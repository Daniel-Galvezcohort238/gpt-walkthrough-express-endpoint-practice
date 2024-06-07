const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

require('dotenv').config();

const port = process.env.PORT;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306
});

app.use(async function(req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

    req.db.release();
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});

app.use(cors());

app.use(express.json());

// GET endpoint to fetch all cars with deleted_flag = 0
app.get('/cars', async function(req, res) {
  try {
    const [rows] = await req.db.query('SELECT * FROM car WHERE deleted_flag = 0');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST endpoint to create a new car
app.post('/car', async function(req, res) {
  try {
    const { make, model, year } = req.body;
    console.log('Received data:', { make, model, year });

    const result = await req.db.query(
        `INSERT INTO car (make, model, year) VALUES (?, ?, ?);`,
        [make, model, year]
      );
      console.log('Insert result:', result);


    res.json({ success: true, message: 'Car successfully created' });
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT endpoint to update a specific car
app.put('/car/:id', async function(req, res) {
    try {
      const { id } = req.params;
      const { make, model, year } = req.body;
  
      const result = await req.db.query(
        `UPDATE car SET make = ?, model = ?, year = ? WHERE id = ?`,
        [make, model, year, id]
      );
      console.log('Update result:', result);
  
      res.json({ success: true, message: 'Car successfully updated' });
    } catch (err) {
      console.error('Error updating data:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });
  

// DELETE endpoint to soft delete a car
app.delete('/car/:id', async function(req, res) {
    try {
      const { id } = req.params;
  
      const result = await req.db.query(
        `UPDATE car SET deleted_flag = 1 WHERE id = ?`,
        [id]
      );
      console.log('Delete result:', result);
  
      res.json({ success: true, message: 'Car successfully deleted' });
    } catch (err) {
      console.error('Error deleting data:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
