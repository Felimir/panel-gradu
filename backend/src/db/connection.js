const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'panel_user',
  password: process.env.DB_PASSWORD || 'panel_pass',
  database: process.env.DB_NAME || 'panel_gradu',
  connectionLimit: 5
});

module.exports = pool;
