const express = require('express');
const pool = require('../db/connection');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const { logAction } = require('../lib/auditLogger');

const router = express.Router();
router.use(authMiddleware);

// GET /api/calendar
router.get('/', async (req, res) => {
  const { month, year, type, class_id } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();

    let query = `
      SELECT e.*,
        c.name AS class_name, c.shift AS class_shift,
        s.name AS student_name,
        u.username AS user_name
      FROM events_calendar e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN students s ON e.assigned_student_id = s.id
      LEFT JOIN users u ON e.assigned_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (month && year) {
      query += ` AND MONTH(e.event_date) = ? AND YEAR(e.event_date) = ?`;
      params.push(parseInt(month), parseInt(year));
    }
    if (type) {
      query += ` AND e.event_type = ?`;
      params.push(type);
    }
    if (class_id) {
      query += ` AND e.class_id = ?`;
      params.push(parseInt(class_id));
    }
    query += ` ORDER BY e.event_date ASC, e.created_at ASC`;

    const rows = await conn.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Error obteniendo eventos del calendario' });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/calendar
router.post('/', async (req, res) => {
  const { title, description, event_type, event_date, end_date, class_id, assigned_student_id, assigned_user_id, notes } = req.body;

  if (!title || !event_type || !event_date) {
    return res.status(400).json({ error: 'Título, tipo y fecha son obligatorios' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      `INSERT INTO events_calendar (title, description, event_type, event_date, end_date, class_id, assigned_student_id, assigned_user_id, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        event_type,
        event_date,
        end_date || null,
        class_id || null,
        assigned_student_id || null,
        assigned_user_id || null,
        notes || null,
        req.user.id
      ]
    );
    const newEventId = Number(result.insertId);
    await logAction(conn, req.user.id, 'create', 'event', newEventId, { title, event_type, event_date });
    res.json({ message: 'Evento creado exitosamente', id: newEventId });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Error creando el evento' });
  } finally {
    if (conn) conn.release();
  }
});

// PUT /api/calendar/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, event_type, event_date, end_date, class_id, assigned_student_id, assigned_user_id, notes } = req.body;

  if (!title || !event_type || !event_date) {
    return res.status(400).json({ error: 'Título, tipo y fecha son obligatorios' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `UPDATE events_calendar
       SET title=?, description=?, event_type=?, event_date=?, end_date=?,
           class_id=?, assigned_student_id=?, assigned_user_id=?, notes=?, updated_at=NOW()
       WHERE id=?`,
      [
        title,
        description || null,
        event_type,
        event_date,
        end_date || null,
        class_id || null,
        assigned_student_id || null,
        assigned_user_id || null,
        notes || null,
        parseInt(id)
      ]
    );
    await logAction(conn, req.user.id, 'update', 'event', parseInt(id), { title });
    res.json({ message: 'Evento actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Error actualizando el evento' });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /api/calendar/:id (admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM events_calendar WHERE id = ?', [parseInt(id)]);
    await logAction(conn, req.user.id, 'delete', 'event', parseInt(id), { id: parseInt(id) });
    res.json({ message: 'Evento eliminado' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Error eliminando el evento' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
