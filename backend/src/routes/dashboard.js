const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET /api/dashboard/stats - Devuelve todo el dashboard payload
router.get('/stats', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    // 1. Balance Financiero Actual (Mismo de finances)
    const feeRows = await conn.query('SELECT IFNULL(SUM(amount_paid), 0) as total_payments FROM payments');
    const totalFees = parseInt(feeRows[0].total_payments) || 0;
    
    const raffleRows = await conn.query('SELECT IFNULL(SUM(surplus_fund), 0) as total_surplus FROM raffle_logs');
    const commonFundRaffles = parseInt(raffleRows[0].total_surplus) || 0;
    
    const txRows = await conn.query("SELECT IFNULL(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income, IFNULL(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense FROM transactions");
    const manualIncome = parseInt(txRows[0].total_income) || 0;
    const manualExpense = parseInt(txRows[0].total_expense) || 0;

    const currentBalance = totalFees + commonFundRaffles + manualIncome - manualExpense;

    // 2. Proyección Futura (Asumiendo cobro 100% de estudiantes activos x toda la anualidad)
    const activeCountRow = await conn.query("SELECT COUNT(*) as c FROM students WHERE deleted_at IS NULL AND status = 'active'");
    const activeStudents = parseInt(activeCountRow[0].c) || 0;

    const soldRaffleRow = await conn.query("SELECT IFNULL(SUM(quantity), 0) as total FROM raffle_logs WHERE action_type = 'returned_sold'");
    const totalSoldRaffles = parseInt(soldRaffleRow[0].total) || 0;

    const configRows = await conn.query('SELECT SUM(amount) as yearly_target FROM monthly_fee_config WHERE period_year = 2026');
    const yearTargetPerStudent = parseInt(configRows[0].yearly_target) || 0;

    // Calculamos cuanta plata falta aportar de todos los activos
    const stRows = await conn.query("SELECT id, IFNULL((SELECT SUM(amount_paid) FROM payments WHERE student_id = students.id), 0) as paid FROM students WHERE deleted_at IS NULL AND status = 'active'");
    let totalMissing = 0;
    for (let st of stRows) {
      const missing = yearTargetPerStudent - parseInt(st.paid);
      if (missing > 0) totalMissing += missing;
    }
    const projectedBalance = currentBalance + totalMissing;

    // --- NUEVAS MÉTRICAS ---
    
    // 1. Rifas del mes actual
    const monthSoldRow = await conn.query(`
      SELECT IFNULL(SUM(quantity), 0) as total 
      FROM raffle_logs 
      WHERE action_type = 'returned_sold' 
      AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
      AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `);
    const monthlySoldRaffles = parseInt(monthSoldRow[0].total) || 0;

    // 2. Conteo de morosos vs al día
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const studentDebtStats = await conn.query(`
      SELECT
        COUNT(DISTINCT CASE WHEN s.paid_current = 0 THEN s.student_id END) as delinquent_count,
        COUNT(DISTINCT CASE WHEN s.paid_current = 1 THEN s.student_id END) as uptodate_count
      FROM (
        SELECT st.id as student_id,
        COALESCE((
          SELECT 1 FROM payments p
          JOIN monthly_fee_config mfc ON p.fee_id = mfc.id
          WHERE p.student_id = st.id
          AND p.status IN ('paid', 'covered_by_raffles')
          AND mfc.period_month = ?
          AND mfc.period_year = ?
          LIMIT 1
        ), 0) as paid_current
        FROM students st
        WHERE st.deleted_at IS NULL AND st.status = 'active'
      ) s
    `, [currentMonth, currentYear]);

    const delinquentCount = parseInt(studentDebtStats[0].delinquent_count) || 0;
    const uptodateCount = parseInt(studentDebtStats[0].uptodate_count) || 0;

    // 3. Último ingreso registrado
    const lastIncomeRow = await conn.query(`
      (SELECT amount as val, transaction_date as dt, description as descrip FROM transactions WHERE type = 'income')
      UNION ALL
      (SELECT amount_paid as val, deposit_date as dt, 'Pago de cuota' as descrip FROM payments WHERE status IN ('paid', 'covered_by_raffles'))
      ORDER BY dt DESC LIMIT 1
    `);
    const lastIncome = lastIncomeRow[0] || { val: 0, dt: null, descrip: 'Sin registros' };

    // 4. Meta Global Fija
    const globalTarget = 1000000;

    // --- FIN NUEVAS MÉTRICAS ---

    // 3. Recaudación por Clases
    const colsByClass = await conn.query(`
      SELECT c.name as class_name, c.shift, IFNULL(SUM(p.amount_paid), 0) as collected
      FROM students s 
      JOIN classes c ON s.class_id = c.id 
      LEFT JOIN payments p ON p.student_id = s.id 
      WHERE s.deleted_at IS NULL 
      GROUP BY c.id
      ORDER BY collected DESC
    `);

    // 4. Salón de la fama Rifas (Top 5)
    // ... (sigue igual)
    const topSellers = await conn.query(`
      SELECT s.name, c.name as class_name, IFNULL(SUM(r.quantity), 0) as sold
      FROM students s 
      JOIN classes c ON s.class_id = c.id 
      JOIN raffle_logs r ON r.student_id = s.id 
      WHERE s.deleted_at IS NULL AND r.action_type = 'returned_sold' 
      GROUP BY s.id 
      ORDER BY sold DESC 
      LIMIT 5
    `);

    // 5. Defaulters (Top 5 Morosos)
    const configuredMonthsRow = await conn.query("SELECT COUNT(*) as c FROM monthly_fee_config WHERE period_year = ? AND amount > 0 AND period_month <= ?", [currentYear, currentMonth]);
    const configuredMonths = parseInt(configuredMonthsRow[0].c) || 0;

    const defaulters = await conn.query(`
      SELECT s.student_id, s.name, s.class_name, (? - s.paid_months) as pending_months
      FROM (
        SELECT st.id as student_id, st.name, c.name as class_name,
        (SELECT COUNT(*) FROM payments p WHERE p.student_id = st.id AND p.status IN ('paid', 'covered_by_raffles')) as paid_months
        FROM students st
        JOIN classes c ON st.class_id = c.id
        WHERE st.deleted_at IS NULL AND st.status = 'active'
      ) s
      WHERE (? - s.paid_months) > 0
      ORDER BY pending_months DESC
      LIMIT 5
    `, [configuredMonths, configuredMonths]);

    res.json({
      metrics: {
        totalFees,
        commonFundRaffles,
        manualIncome,
        manualExpense,
        currentBalance,
        projectedBalance,
        totalMissing,
        activeStudents,
        totalSoldRaffles,
        monthlySoldRaffles,
        delinquentCount,
        uptodateCount,
        lastIncome,
        globalTarget
      },
      collectionByClass: colsByClass.map(c => ({...c, collected: Number(c.collected)})),
      topSellers: topSellers.map(s => ({...s, sold: Number(s.sold)})),
      defaulters: defaulters.map(d => ({...d, pending_months: Number(d.pending_months)})),
      configuredMonths
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Error del servidor calculando analíticas' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
