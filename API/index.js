const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ---------------- DATABASE
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ---------------- TABLE CONFIG (IMPORTANT)
const tables = {
  students: "student_id",
  courses: "course_id",
  instructors: "instructor_id",
  departments: "dept_id",
  enrollments: "enroll_id",
  attendance: "attendance_id",
  exams: "exam_id",
  results: "result_id",
  fees: "fee_id",
  classes: "class_id"
};

// ---------------- GET ALL (ANY TABLE)
app.get('/:table', async (req, res) => {
  try {
    const table = req.params.table;
    const result = await pool.query(`SELECT * FROM ${table}`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- INSERT (ANY TABLE)
app.post('/:table', async (req, res) => {
  try {
    const table = req.params.table;
    const data = req.body;

    const keys = Object.keys(data);
    const values = Object.values(data);

    const query = `
      INSERT INTO ${table} (${keys.join(",")})
      VALUES (${keys.map((_, i) => "$" + (i + 1)).join(",")})
      RETURNING *
    `;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- UPDATE (ANY TABLE)
app.put('/:table/:id', async (req, res) => {
  try {
    const table = req.params.table.trim();
    const id = req.params.id;

    if (!tables[table]) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    const idColumn = tables[table];
    const data = req.body;

    const keys = Object.keys(data);
    const values = Object.values(data);

    if (keys.length === 0) {
      return res.status(400).json({ error: "No data provided" });
    }

    const setQuery = keys.map((k, i) => `${k}=$${i + 1}`).join(", ");

    const query = `
      UPDATE ${table}
      SET ${setQuery}
      WHERE ${idColumn}=$${keys.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, [...values, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DELETE (ANY TABLE)
app.delete('/:table/:id', async (req, res) => {
  try {
    const table = req.params.table.trim();
    const id = req.params.id;

    const tables = {
      students: "student_id",
      courses: "course_id",
      instructors: "instructor_id",
      departments: "dept_id",
      enrollments: "enroll_id",
      attendance: "attendance_id",
      exams: "exam_id",
      results: "result_id",
      fees: "fee_id",
      classes: "class_id"
    };

    if (!tables[table]) {
      return res.status(400).json({ error: "Invalid table" });
    }

    const idColumn = tables[table];

    const result = await pool.query(
      `DELETE FROM ${table} WHERE ${idColumn}=$1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ message: "Deleted successfully", data: result.rows[0] });

  } catch (err) {
    console.error("DELETE ERROR:", err); // 
    res.status(500).json({ error: err.message });
  }
});
// ---------------- START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});