const express = require('express');
const pool = require('../db/connection');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// GET /api/classes - Retorna listado de clases y sus organizadores responsables
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const classes = await conn.query(`
      SELECT c.id, c.name, c.shift, 
        (SELECT COUNT(s.id) FROM students s WHERE s.class_id = c.id AND s.deleted_at IS NULL AND s.status = 'active') as student_count
      FROM classes c 
      ORDER BY c.shift, c.name
    `);
    
    const organizers = await conn.query(`
      SELECT oc.class_id, u.id, u.username
      FROM organizer_classes oc
      JOIN users u ON oc.user_id = u.id AND u.status = 'active'
    `);

    const classesData = classes.map(c => ({
      ...c,
      student_count: Number(c.student_count || 0),
      organizers: organizers.filter(o => o.class_id === c.id).map(o => ({ id: o.id, username: o.username }))
    }));

    res.json({ data: classesData });
  } catch (error) {
    console.error('Error in GET /classes:', error);
    res.status(500).json({ error: 'Error del servidor consultando clases' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
