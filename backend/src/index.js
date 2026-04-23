require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db/connection');
const migrate = require('./db/migrate');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const classesRoutes = require('./routes/classes');
const studentsRoutes = require('./routes/students');
const feesRoutes = require('./routes/fees');
const rafflesRoutes = require('./routes/raffles');
const financesRoutes = require('./routes/finances');
const dashboardRoutes = require('./routes/dashboard');
const calendarRoutes = require('./routes/calendar');
const auditRoutes = require('./routes/audit');
const hoodiesRoutes = require('./routes/hoodies');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/raffles', rafflesRoutes);
app.use('/api/finances', financesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/hoodies', hoodiesRoutes);

// Healthcheck endpoints
const healthHandler = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    res.json({ status: 'OK', db: 'Connected' });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ status: 'ERROR', db: 'Disconnected' });
  }
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

const start = async () => {
  await migrate();
  app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
  });
};

start();
