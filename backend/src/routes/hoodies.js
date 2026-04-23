const express = require('express');
const pool = require('../db/connection');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const { logAction } = require('../lib/auditLogger');

const router = express.Router();
router.use(authMiddleware);

// GET /api/hoodies/payments - Trae matriz de pagos de buzos (solo estudiantes que quieren buzo)
router.get('/payments', async (req, res) => {
  const { period, search, class_id, shift, status } = req.query;
  if (!period || (period !== 'initial' && period !== 'final')) {
    return res.status(400).json({ error: 'Parámetros incompletos o período inválido' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    let q = `
      SELECT s.id as student_id, s.name as student_name, s.status as student_status,
             c.name as class_name, c.shift as class_shift,
             hp.id as payment_id, hp.status as payment_status, hp.payment_method, hp.amount_paid, hp.deposit_date, hp.observations
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN hoodie_payments hp ON hp.student_id = s.id AND hp.period = ?
      WHERE s.deleted_at IS NULL AND s.status = 'active' AND s.wants_hoodie = 1
    `;
    let params = [period];

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
    if (status) {
      if (status === 'debtor') {
        q += " AND (hp.status IS NULL OR hp.status = 'pending')";
      } else if (status === 'paid') {
        q += " AND hp.status = 'paid'";
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
      fee_amount: 750, // Hardcoded fee
      deposit_date: r.deposit_date,
      observations: r.observations || ''
    }));

    res.json({ data, fee_amount: 750 });
  } catch (error) {
    console.error('Error GET /hoodies/payments:', error);
    res.status(500).json({ error: 'Error del servidor consultando grilla de buzos' });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/hoodies/payments - Acusa recibo de pago o actualiza registro
router.post('/payments', async (req, res) => {
  const { student_id, period, status, payment_method, amount_paid, deposit_date, observations } = req.body;
  if (!student_id || !period || !status) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    await conn.query(`
      INSERT INTO hoodie_payments (student_id, period, status, payment_method, amount_paid, deposit_date, observations)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status), 
        payment_method = VALUES(payment_method), 
        amount_paid = VALUES(amount_paid), 
        deposit_date = VALUES(deposit_date), 
        observations = VALUES(observations)
    `, [
      student_id, period, status, 
      payment_method || 'none', 
      amount_paid || 0, 
      deposit_date || null, 
      observations || null
    ]);

    await logAction(conn, req.user.id, 'payment_recorded', 'payment', null, {
      student_id, period, status, method: payment_method || 'none', module: 'hoodies'
    });
    res.json({ message: 'Pago de buzo registrado exitosamente' });
  } catch (error) {
    console.error('Error POST /hoodies/payments:', error);
    res.status(500).json({ error: 'Error del servidor registrando pago de buzo' });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/hoodies/history/:student_id - Trae el historial de pagos de buzo de un estudiante
router.get('/history/:student_id', async (req, res) => {
  const { student_id } = req.params;
  if (!student_id) return res.status(400).json({ error: 'Faltan parámetros' });

  let conn;
  try {
    conn = await pool.getConnection();

    const rows = await conn.query(`
      SELECT period, status, payment_method, amount_paid, deposit_date, observations
      FROM hoodie_payments
      WHERE student_id = ?
    `, [student_id]);

    const initialPay = rows.find(r => r.period === 'initial');
    const finalPay = rows.find(r => r.period === 'final');

    const data = [
      {
        period: 'initial',
        period_name: 'Cuota inicial (abril)',
        amount: 750,
        status: initialPay?.status || 'pending',
        payment_method: initialPay?.payment_method || 'none',
        amount_paid: initialPay?.amount_paid || 0,
        deposit_date: initialPay?.deposit_date,
        observations: initialPay?.observations
      },
      {
        period: 'final',
        period_name: 'Cuota final (mayo/junio)',
        amount: 750,
        status: finalPay?.status || 'pending',
        payment_method: finalPay?.payment_method || 'none',
        amount_paid: finalPay?.amount_paid || 0,
        deposit_date: finalPay?.deposit_date,
        observations: finalPay?.observations
      }
    ];

    res.json({ data });
  } catch (error) {
    console.error('Error GET /hoodies/history:', error);
    res.status(500).json({ error: 'Error del servidor consultando historial de buzos' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
