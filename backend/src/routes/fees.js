const express = require('express');
const pool = require('../db/connection');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const { logAction } = require('../lib/auditLogger');

const router = express.Router();
router.use(authMiddleware);

// GET /api/fees/config - Obtiene configuración de meses
router.get('/config', async (req, res) => {
  let conn;
  try {
    const { year } = req.query;
    conn = await pool.getConnection();
    let query = 'SELECT * FROM monthly_fee_config';
    let params = [];
    if (year) {
      query += ' WHERE period_year = ?';
      params.push(year);
    }
    query += ' ORDER BY period_year DESC, period_month ASC';
    const rows = await conn.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    console.error('Error GET /fees/config:', error);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/fees/config - Crea o actualiza monto de cuota mensual (Solo admin)
router.post('/config', adminMiddleware, async (req, res) => {
  const { period_month, period_year, amount } = req.body;
  if (!period_month || !period_year || amount === undefined) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`
      INSERT INTO monthly_fee_config (period_month, period_year, amount)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE amount = VALUES(amount)
    `, [period_month, period_year, amount]);
    await logAction(conn, req.user.id, 'create', 'fee_config', null, { period_month, period_year, amount });
    res.json({ message: 'Cuota configurada' });
  } catch (error) {
    console.error('Error POST /fees/config:', error);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/fees/payments - Trae matriz de pagos de clase para un mes/año
router.get('/payments', async (req, res) => {
  const { month, year, search, class_id, shift, orientation, status } = req.query;
  if (!month || !year) {
    return res.status(400).json({ error: 'Parámetros incompletos' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Verificamos si existe configuración de cuota para ese mes para traer el amount objetivo
    const feeRows = await conn.query('SELECT id, amount FROM monthly_fee_config WHERE period_month = ? AND period_year = ? LIMIT 1', [month, year]);
    if (feeRows.length === 0) {
      return res.status(404).json({ error: 'Cuota no configurada para este mes/año' });
    }
    const fee_id = feeRows[0].id;
    const fee_amount = feeRows[0].amount;

    let q = `
      SELECT s.id as student_id, s.name as student_name, s.status as student_status,
             c.name as class_name, c.shift as class_shift,
             p.id as payment_id, p.status as payment_status, p.payment_method, p.amount_paid, p.deposit_date, p.observations
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN payments p ON p.student_id = s.id AND p.fee_id = ?
      WHERE s.deleted_at IS NULL AND s.status = 'active'
    `;
    let params = [fee_id];

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
    if (status) {
      if (status === 'debtor') {
        q += " AND (p.status IS NULL OR p.status = 'pending')";
      } else if (status === 'paid') {
        q += " AND (p.status = 'paid' OR p.status = 'covered_by_raffles')";
      }
    }
    q += ' ORDER BY s.name ASC';

    const rows = await conn.query(q, params);

    const data = rows.map(r => ({
      student_id: r.student_id,
      student_name: r.student_name,
      class_name: r.class_name,
      class_shift: r.class_shift,
      status: r.payment_status || 'pending',
      payment_method: r.payment_method || 'none',
      amount_paid: r.amount_paid || 0,
      fee_amount: fee_amount,
      deposit_date: r.deposit_date,
      observations: r.observations || ''
    }));

    res.json({ data, fee_amount });
  } catch (error) {
    console.error('Error GET /fees/payments:', error);
    res.status(500).json({ error: 'Error del servidor consultando grilla' });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/fees/payments - Acusa recibo de pago o actualiza registro
router.post('/payments', async (req, res) => {
  const { student_id, period_month, period_year, status, payment_method, amount_paid, deposit_date, observations } = req.body;
  if (!student_id || !period_month || !period_year || !status) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const feeRows = await conn.query('SELECT id FROM monthly_fee_config WHERE period_month = ? AND period_year = ? LIMIT 1', [period_month, period_year]);
    if (feeRows.length === 0) {
      return res.status(400).json({ error: 'Cuota no configurada para este mes' });
    }
    const fee_id = feeRows[0].id;

    await conn.query(`
      INSERT INTO payments (student_id, fee_id, status, payment_method, amount_paid, deposit_date, observations)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status), 
        payment_method = VALUES(payment_method), 
        amount_paid = VALUES(amount_paid), 
        deposit_date = VALUES(deposit_date), 
        observations = VALUES(observations)
    `, [
      student_id, fee_id, status, 
      payment_method || 'none', 
      amount_paid || 0, 
      deposit_date || null, 
      observations || null
    ]);

    await logAction(conn, req.user.id, 'payment_recorded', 'payment', null, {
      student_id, fee_id, status, method: payment_method || 'none'
    });
    res.json({ message: 'Pago registrado exitosamente' });
  } catch (error) {
    console.error('Error POST /fees/payments:', error);
    res.status(500).json({ error: 'Error del servidor registrando pago' });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/fees/history/:student_id - Trae el historial financiero anual de un estudiante cruzando los pagos y configs
router.get('/history/:student_id', async (req, res) => {
  const { student_id } = req.params;
  const { year } = req.query;
  if (!student_id || !year) return res.status(400).json({ error: 'Faltan parámetros' });

  let conn;
  try {
    conn = await pool.getConnection();

    const rows = await conn.query(`
      SELECT mfc.period_month, mfc.amount, 
             p.status, p.payment_method, p.amount_paid, p.deposit_date, p.observations
      FROM monthly_fee_config mfc
      LEFT JOIN payments p ON p.fee_id = mfc.id AND p.student_id = ?
      WHERE mfc.period_year = ?
      ORDER BY mfc.period_month ASC
    `, [student_id, year]);

    // Retorna todos los meses tarifados con su respectivo pago cruzado o 'pending' virtual en caso de nulo
    const data = rows.map(r => ({
      period_month: r.period_month,
      amount: r.amount,
      status: r.status || 'pending',
      payment_method: r.payment_method || 'none',
      amount_paid: r.amount_paid || 0,
      deposit_date: r.deposit_date,
      observations: r.observations
    }));

    res.json({ data });
  } catch (error) {
    console.error('Error GET /fees/history:', error);
    res.status(500).json({ error: 'Error del servidor consultando historial' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
