const express = require('express');
const pool = require('../db/connection');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const { logAction } = require('../lib/auditLogger');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/users - Listar Staff con sus clases asignadas
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT u.id, u.cedula, u.username, u.role, u.status, oc.class_id, c.name as class_name, c.shift
      FROM users u
      LEFT JOIN organizer_classes oc ON u.id = oc.user_id
      LEFT JOIN classes c ON oc.class_id = c.id
      WHERE u.role IN ('admin', 'organizer')
      ORDER BY u.role, u.username
    `);

    const usersMap = {};
    rows.forEach(row => {
      if (!usersMap[row.id]) {
        usersMap[row.id] = {
          id: row.id,
          cedula: row.cedula,
          username: row.username,
          role: row.role,
          status: row.status,
          classes: []
        };
      }
      if (row.class_id) {
        usersMap[row.id].classes.push({ id: row.class_id, name: row.class_name, shift: row.shift });
      }
    });

    res.json({ data: Object.values(usersMap) });
  } catch (error) {
    res.status(500).json({ error: 'Error consultando usuarios' });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/users - Crear usuario y asignarle clases
router.post('/', async (req, res) => {
  const { cedula, username, password, role, class_ids } = req.body;
  if (!cedula || !username || !password || !role) return res.status(400).json({ error: 'Faltan campos obligatorios (cédula, nombre, contraseña, rol)' });

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const hash = await bcrypt.hash(password, 10);
    const result = await conn.query(
      'INSERT INTO users (cedula, username, password_hash, role, status) VALUES (?, ?, ?, ?, "active")',
      [cedula, username, hash, role]
    );

    const newUserId = Number(result.insertId);

    if (role === 'organizer' && class_ids && class_ids.length > 0) {
      for (let cid of class_ids) {
        await conn.query('INSERT IGNORE INTO organizer_classes (user_id, class_id) VALUES (?, ?)', [newUserId, cid]);
      }
    }

    await logAction(conn, req.user.id, 'create', 'user', newUserId, { username, role });
    await conn.commit();
    res.status(201).json({ message: 'Usuario creado exitosamente', id: newUserId });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Error creando usuario:', err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Nombre de usuario o cédula en uso' });
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    if (conn) conn.release();
  }
});

// PUT /api/users/:id - Actualizar datos y clases
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { cedula, username, password, role, status, class_ids } = req.body;

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    let updates = [];
    let params = [];

    if (cedula) { updates.push('cedula = ?'); params.push(cedula); }
    if (username) { updates.push('username = ?'); params.push(username); }
    if (password) { 
      const hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?'); params.push(hash); 
    }
    if (role) { updates.push('role = ?'); params.push(role); }
    if (status) { updates.push('status = ?'); params.push(status); }

    if (updates.length > 0) {
      params.push(id);
      await conn.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Actualizar clases asignadas reescribiendo la relacion (delete and insert)
    if (role === 'organizer' && Array.isArray(class_ids)) {
      await conn.query('DELETE FROM organizer_classes WHERE user_id = ?', [id]);
      for (let cid of class_ids) {
        await conn.query('INSERT IGNORE INTO organizer_classes (user_id, class_id) VALUES (?, ?)', [id, cid]);
      }
    }

    await logAction(conn, req.user.id, 'update', 'user', parseInt(id), { username, role, status });
    await conn.commit();
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: 'Error del servidor al actualizar' });
  } finally {
    if (conn) conn.release();
  }
});


module.exports = router;
