const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { logAction } = require('../lib/auditLogger');
router.use(authMiddleware);

// GET /api/raffles/summary - Trae datos acumulados por alumno para un mes
router.get('/summary', async (req, res) => {
  const { month, year, search, class_id, shift, orientation } = req.query;
  if (!month || !year) {
    return res.status(400).json({ error: 'Parámetros incompletos' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    let q = `
      SELECT s.id as student_id, s.name as student_name, s.status as student_status,
             c.name as class_name, c.shift as class_shift,
             IFNULL(SUM(CASE WHEN r.action_type = 'delivered_to_student' THEN r.quantity ELSE 0 END), 0) as total_delivered,
             IFNULL(SUM(CASE WHEN r.action_type = 'returned_sold' THEN r.quantity ELSE 0 END), 0) as total_sold,
             IFNULL(SUM(CASE WHEN r.action_type = 'returned_unsold' THEN r.quantity ELSE 0 END), 0) as total_unsold,
             IFNULL(SUM(r.money_collected), 0) as total_collected,
             IFNULL(SUM(r.applied_to_fee), 0) as total_applied_to_fee,
             IFNULL(SUM(r.surplus_fund), 0) as total_surplus
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN raffle_logs r ON r.student_id = s.id AND r.period_month = ? AND r.period_year = ?
      WHERE s.deleted_at IS NULL AND s.status = 'active'
    `;
    let params = [parseInt(month), parseInt(year)];

    if (search) {
      q += ' AND s.name LIKE ?';
      params.push(`%${search}%`);
    }
    if (class_id) {
      q += ' AND s.class_id = ?';
      params.push(class_id);
    }
    if (shift) {
      q += ' AND c.shift = ?';
      params.push(shift);
    }
    if (orientation) {
      q += ' AND c.name LIKE ?';
      params.push(`${orientation}%`);
    }
    
    q += ' GROUP BY s.id ORDER BY s.name ASC';

    const rows = await conn.query(q, params);

    res.json({ data: rows });
  } catch (error) {
    console.error('Error fetching raffles summary:', error);
    res.status(500).json({ error: 'Error del servidor consultando resumen de rifas' });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/raffles/history/:student_id - Trae registros cronológicos
router.get('/history/:student_id', async (req, res) => {
  const { year } = req.query;
  const { student_id } = req.params;

  if (!year) {
    return res.status(400).json({ error: 'Falta parametro year' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const q = `
      SELECT r.id, r.period_month, r.action_type, r.quantity, r.money_collected, r.applied_to_fee, r.surplus_fund, r.deposit_status, r.created_at
      FROM raffle_logs r
      WHERE r.student_id = ? AND r.period_year = ?
      ORDER BY r.created_at DESC
    `;
    const rows = await conn.query(q, [student_id, parseInt(year)]);

    res.json({ data: rows });
  } catch (error) {
    console.error('Error fetching raffle history:', error);
    res.status(500).json({ error: 'Error del servidor consultando historial' });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/raffles/transaction - Inserta un movimiento
router.post('/transaction', async (req, res) => {
  const { student_id, period_month, period_year, action_type, quantity, deposit_status } = req.body;

  if (!student_id || !period_month || !period_year || !action_type || !quantity) {
    return res.status(400).json({ error: 'Parámetros incompletos' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Iniciar transacción de base de datos real!
    await conn.beginTransaction();

    let money_collected = 0;
    let applied_to_fee = 0;
    let surplus_fund = 0;
    let final_deposit_status = deposit_status || 'not_applicable';

    if (action_type === 'returned_sold' || action_type === 'returned_unsold') {
      const balanceRows = await conn.query(`
        SELECT 
          IFNULL(SUM(CASE WHEN action_type = 'delivered_to_student' THEN quantity ELSE 0 END), 0) as total_delivered,
          IFNULL(SUM(CASE WHEN action_type = 'returned_sold' THEN quantity ELSE 0 END), 0) as total_sold,
          IFNULL(SUM(CASE WHEN action_type = 'returned_unsold' THEN quantity ELSE 0 END), 0) as total_unsold
        FROM raffle_logs 
        WHERE student_id = ? AND period_month = ? AND period_year = ?
      `, [student_id, period_month, period_year]);
      
      if (balanceRows.length > 0) {
        const { total_delivered, total_sold, total_unsold } = balanceRows[0];
        const possession = Number(total_delivered) - (Number(total_sold) + Number(total_unsold));
        if (quantity > possession) {
          await conn.rollback();
          return res.status(400).json({ error: `No puedes registrar ${quantity} rifas. El estudiante solo tiene ${possession} rifas en su poder (sin rendir).` });
        }
      }
    }

    if (action_type === 'returned_sold') {
      const RAFFLE_PRICE = 100;
      money_collected = parseInt(quantity) * RAFFLE_PRICE;
      final_deposit_status = deposit_status || 'pending'; // Require deposit info if money brought in

      // Find monthly fee for this period
      const feeRows = await conn.query('SELECT id, amount FROM monthly_fee_config WHERE period_month = ? AND period_year = ? LIMIT 1', [period_month, period_year]);
      if (feeRows.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'No existe configuración de precio de cuota para este mes. Configúrala antes de ingresar dinero.' });
      }

      const fee_id = feeRows[0].id;
      const fee_amount = feeRows[0].amount;

      // Check current payment status
      const pRows = await conn.query('SELECT id, amount_paid FROM payments WHERE student_id = ? AND fee_id = ? LIMIT 1', [student_id, fee_id]);
      let current_amount_paid = 0;
      if (pRows.length > 0) {
        current_amount_paid = parseInt(pRows[0].amount_paid) || 0;
      }

      const remaining_fee = Math.max(0, fee_amount - current_amount_paid);
      applied_to_fee = Math.min(money_collected, remaining_fee);
      surplus_fund = money_collected - applied_to_fee;

      const new_amount_paid = current_amount_paid + applied_to_fee;
      const new_status = (new_amount_paid >= fee_amount) ? 'covered_by_raffles' : 'pending';

      // Upsert payment
      if (pRows.length > 0) {
        await conn.query('UPDATE payments SET amount_paid = ?, status = ?, observations = CONCAT(IFNULL(observations, ""), " | Rifa Aplicada") WHERE id = ?', 
          [new_amount_paid, new_status, pRows[0].id]);
      } else {
        await conn.query(`
          INSERT INTO payments (student_id, fee_id, status, payment_method, amount_paid, deposit_date, observations)
          VALUES (?, ?, ?, 'cash', ?, CURDATE(), 'Automático vía Rifas')
        `, [student_id, fee_id, new_status, new_amount_paid]);
      }
    }

    // Insert Log
    await conn.query(`
      INSERT INTO raffle_logs (student_id, period_month, period_year, action_type, quantity, money_collected, applied_to_fee, surplus_fund, deposit_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [student_id, period_month, period_year, action_type, quantity, money_collected, applied_to_fee, surplus_fund, final_deposit_status]);

    await logAction(conn, req.user?.id || null, 'create', 'raffle_log', null, {
      student_id, action_type, quantity, money_collected, applied_to_fee, surplus_fund
    });
    await conn.commit();
    res.json({ message: 'Transacción guardada con éxito', applied_to_fee, surplus_fund });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Error saving raffle transaction:', error);
    res.status(500).json({ error: 'Error del servidor registrando la transacción' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
