const express = require('express');
const pool = require('../db/connection');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { logAction } = require('../lib/auditLogger');

const router = express.Router();
router.use(authMiddleware);

// GET /api/students
router.get('/', async (req, res) => {
  const { search, class_id, status } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();

    let query = `
      SELECT s.id, s.name, s.wants_hoodie, s.status, s.class_id, c.name as class_name, c.shift
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.deleted_at IS NULL
    `;
    const params = [];

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }
    if (req.query.shift) {
      query += ` AND c.shift = ?`;
      params.push(req.query.shift);
    }
    if (req.query.orientation) {
      query += ` AND c.name LIKE ?`;
      params.push(`${req.query.orientation}%`);
    }
    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND s.name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY s.name ASC`;

    const students = await conn.query(query, params);
    
    const normalized = students.map(st => ({
      ...st,
      wants_hoodie: Boolean(st.wants_hoodie)
    }));

    res.json({ data: normalized });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Error del servidor consultando estudiantes' });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/students
router.post('/', async (req, res) => {
  const { name, class_id, wants_hoodie, status } = req.body;
  if (!name || !class_id) return res.status(400).json({ error: 'Nombre y clase son obligatorios' });

  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      `INSERT INTO students (name, class_id, wants_hoodie, status) VALUES (?, ?, ?, ?)`,
      [name, class_id, wants_hoodie ? 1 : 0, status || 'active']
    );
    const newId = Number(result.insertId);
    await logAction(conn, req.user.id, 'create', 'student', newId, { name, class_id });
    res.status(201).json({ message: 'Estudiante registrado', id: newId });
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ error: 'Error agregando estudiante' });
  } finally {
    if (conn) conn.release();
  }
});

// PUT /api/students/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, class_id, wants_hoodie, status } = req.body;
  
  let conn;
  try {
    conn = await pool.getConnection();
    let updates = [];
    let params = [];
    
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (class_id !== undefined) { updates.push('class_id = ?'); params.push(class_id); }
    if (wants_hoodie !== undefined) { updates.push('wants_hoodie = ?'); params.push(wants_hoodie ? 1 : 0); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    
    if (updates.length > 0) {
      params.push(id);
      await conn.query(`UPDATE students SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
      await logAction(conn, req.user.id, 'update', 'student', parseInt(id), { name, status });
    }

    res.json({ message: 'Estudiante modificado exitosamente' });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ error: 'Error modificando estudiante' });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /api/students/:id (Soft Delete)
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden hacer borrados profundos' });
  }

  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('UPDATE students SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    await logAction(conn, req.user.id, 'delete', 'student', parseInt(id), { id });
    res.json({ message: 'Estudiante eliminado lógicamente' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ error: 'Error eliminando estudiante' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
