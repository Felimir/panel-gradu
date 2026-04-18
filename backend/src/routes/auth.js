const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { logAction } = require('../lib/auditLogger');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_123';

// Login
router.post('/login', async (req, res) => {
  const { cedula, password } = req.body;
  if (!cedula || !password) return res.status(400).json({ error: 'Faltan credenciales' });

  let conn;
  try {
    conn = await pool.getConnection();
    const [users] = await conn.query('SELECT * FROM users WHERE cedula = ? AND status = "active"', [cedula]);
    const user = users[0] ?? users;
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    if (user.status !== 'active') return res.status(401).json({ error: 'Usuario inactivo' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logAction(conn, user.id, 'login', 'session', user.id, { cedula });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    if (conn) conn.release();
  }
});

// Me (validación)
router.get('/me', authMiddleware, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [user] = await conn.query('SELECT id, username, role, status FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
