const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { logAction } = require('../lib/auditLogger');
router.use(authMiddleware);

// GET /api/finances/summary - Cajón maestro de dinero
router.get('/summary', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    // 1. Obtener sumatoria bruta de tabla pagos
    const feeRows = await conn.query('SELECT IFNULL(SUM(amount_paid), 0) as total_payments FROM payments');
    const totalFees = parseInt(feeRows[0].total_payments);

    // 2. Obtener lo generado por rifas (Excedente destinado a fondo común)
    const raffleRows = await conn.query('SELECT IFNULL(SUM(surplus_fund), 0) as total_surplus FROM raffle_logs');
    const commonFundRaffles = parseInt(raffleRows[0].total_surplus);

    // 3. Obtener flujos extracurriculares
    const txRows = await conn.query("SELECT IFNULL(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income, IFNULL(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense FROM transactions");
    const manualIncome = parseInt(txRows[0].total_income);
    const manualExpense = parseInt(txRows[0].total_expense);

    // Matemáticas Conceptuales
    const currentBalance = totalFees + commonFundRaffles + manualIncome - manualExpense;

    res.json({
      totalFees,
      commonFundRaffles,
      manualIncome,
      manualExpense,
      currentBalance
    });
  } catch (error) {
    console.error('Error fetching finances summary:', error);
    res.status(500).json({ error: 'Error del servidor calculando balance global' });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/finances/ledger - Libro diario de manuales
router.get('/ledger', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM transactions ORDER BY transaction_date DESC, created_at DESC');
    res.json({ data: rows });
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ error: 'Error obteniendo tabla de transacciones' });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/finances/transaction - Creación de asiento contable
router.post('/transaction', async (req, res) => {
  const { type, category, amount, description, transaction_date } = req.body;

  if (!type || !category || !amount || !transaction_date) {
    return res.status(400).json({ error: 'Parámetros incompletos' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const query = 'INSERT INTO transactions (type, category, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?)';
    const result = await conn.query(query, [type, category, parseInt(amount), description || '', transaction_date]);
    await logAction(conn, req.user?.id || null, 'create', 'transaction', Number(result.insertId), {
      type, category, amount: parseInt(amount)
    });
    res.json({ message: 'Transacción asentada en libro diario exitosamente' });
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ error: 'Error procesando la transacción' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
