const express = require('express');
const pool = require('../db/connection');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

const PAGE_SIZE = 50;

const buildFilters = (user_id, entity, action, date_from, date_to) => {
  let where = 'WHERE 1=1';
  const params = [];
  if (user_id) { where += ' AND al.user_id = ?'; params.push(parseInt(user_id)); }
  if (entity) { where += ' AND al.entity = ?'; params.push(entity); }
  if (action) { where += ' AND al.action = ?'; params.push(action); }
  if (date_from) { where += ' AND al.created_at >= ?'; params.push(date_from); }
  if (date_to) { where += ' AND al.created_at <= ?'; params.push(date_to + ' 23:59:59'); }
  return { where, params };
};

// GET /api/audit
router.get('/', async (req, res) => {
  const { user_id, entity, action, date_from, date_to, page = 1 } = req.query;
  const currentPage = Math.max(1, parseInt(page));
  const offset = (currentPage - 1) * PAGE_SIZE;

  const { where, params } = buildFilters(user_id, entity, action, date_from, date_to);

  let conn;
  try {
    conn = await pool.getConnection();

    const countRows = await conn.query(
      `SELECT COUNT(*) as total FROM audit_logs al ${where}`,
      [...params]
    );
    const total = Number(countRows[0].total);
    const pages = Math.ceil(total / PAGE_SIZE) || 1;

    const rows = await conn.query(
      `SELECT al.id, al.user_id, al.action, al.entity, al.entity_id, al.metadata, al.created_at,
              u.username AS actor_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, PAGE_SIZE, offset]
    );

    res.json({ data: rows, total, page: currentPage, pages });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Error consultando registros de auditoría' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
