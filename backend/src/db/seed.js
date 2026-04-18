const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./connection');

const seed = async () => {
  let conn;
  try {
    conn = await pool.getConnection();

    console.log("Ejecutando schema.sql...");
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schemaSql.split(';').filter((stmt) => stmt.trim());
    
    for (let stmt of statements) {
      await conn.query(stmt);
    }
    console.log("Tablas creadas correctamente.");

    // Seed de Clases
    const classes = [
      { name: 'Artístico 1', shift: 'morning' },
      { name: 'Derecho 1', shift: 'morning' },
      { name: 'Derecho 2', shift: 'morning' },
      { name: 'Medicina 1', shift: 'morning' },
      { name: 'Medicina 2', shift: 'morning' },
      { name: 'Ingeniería 1', shift: 'morning' },
      
      { name: 'Artístico 2', shift: 'afternoon' },
      { name: 'Derecho 3', shift: 'afternoon' },
      { name: 'Economía', shift: 'afternoon' },
      { name: 'Medicina 3', shift: 'afternoon' },
      { name: 'Medicina 4', shift: 'afternoon' },
      { name: 'Ingeniería 2', shift: 'afternoon' },
    ];

    for (let c of classes) {
      await conn.query('INSERT IGNORE INTO classes (name, shift) VALUES (?, ?)', [c.name, c.shift]);
    }
    console.log("Clases sembradas.");

    // Sembrar Admin
    const adminRows = await conn.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminRows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await conn.query(`
        INSERT INTO users (cedula, username, password_hash, role) 
        VALUES ('12345678', 'Administrador Global', ?, 'admin')
      `, [hash]);
      console.log('Usuario admin (Cédula: 12345678) sembrado.');
    } else {
      console.log('El usuario admin ya existe.');
    }

    // Sembrar Cuotas de Abril a Diciembre para 2026
    const periodYear = 2026;
    const defaultAmount = 1500;
    for (let month = 4; month <= 12; month++) {
      await conn.query(
        'INSERT IGNORE INTO monthly_fee_config (period_month, period_year, amount) VALUES (?, ?, ?)',
        [month, periodYear, defaultAmount]
      );
    }
    console.log(`Configuración de cuotas sembrada para Abril-Diciembre ${periodYear}.`);

  } catch (err) {
    console.error("Error durante el seed:", err);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
};

seed();
