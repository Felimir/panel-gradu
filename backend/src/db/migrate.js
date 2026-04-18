const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./connection');

const migrate = async () => {
  let conn;
  try {
    conn = await pool.getConnection();

    // Crear tablas (idempotente — IF NOT EXISTS)
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    for (const stmt of sql.split(';').filter((s) => s.trim())) {
      await conn.query(stmt);
    }
    console.log('[migrate] Tablas verificadas/creadas.');

    // Clases
    const classes = [
      { name: 'Artístico 1',  shift: 'morning' },
      { name: 'Derecho 1',    shift: 'morning' },
      { name: 'Derecho 2',    shift: 'morning' },
      { name: 'Medicina 1',   shift: 'morning' },
      { name: 'Medicina 2',   shift: 'morning' },
      { name: 'Ingeniería 1', shift: 'morning' },
      { name: 'Artístico 2',  shift: 'afternoon' },
      { name: 'Derecho 3',    shift: 'afternoon' },
      { name: 'Economía',     shift: 'afternoon' },
      { name: 'Medicina 3',   shift: 'afternoon' },
      { name: 'Medicina 4',   shift: 'afternoon' },
      { name: 'Ingeniería 2', shift: 'afternoon' },
    ];
    for (const c of classes) {
      await conn.query(
        'INSERT IGNORE INTO classes (name, shift) VALUES (?, ?)',
        [c.name, c.shift]
      );
    }
    console.log('[migrate] Clases verificadas.');

    // Usuario admin por defecto
    const adminRows = await conn.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminRows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await conn.query(
        "INSERT INTO users (cedula, username, password_hash, role) VALUES ('12345678', 'Administrador Global', ?, 'admin')",
        [hash]
      );
      console.log('[migrate] Admin creado — cédula: 12345678, contraseña: admin123');
    }

    // Cuotas Abril–Diciembre 2026 ($1500 por defecto)
    for (let month = 4; month <= 12; month++) {
      await conn.query(
        'INSERT IGNORE INTO monthly_fee_config (period_month, period_year, amount) VALUES (?, ?, ?)',
        [month, 2026, 1500]
      );
    }
    console.log('[migrate] Cuotas 2026 verificadas.');

  } finally {
    if (conn) conn.release();
  }
};

module.exports = migrate;
