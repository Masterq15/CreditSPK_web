// ============================================================
// Backend API untuk SPK Kelayakan Nasabah
// PostgreSQL + Express.js
// ============================================================

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files (HTML, CSS, JS)

// Database Connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Test Database Connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to database:', err.stack);
    } else {
        console.log('✅ Connected to PostgreSQL database');
        release();
    }
});

// ============================================================
// FRONTEND ROUTE
// ============================================================

// GET - Serve halaman utama
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/spk.html');
});

// ============================================================
// API ROUTES
// ============================================================

// GET - Ambil semua data nasabah
app.get('/api/nasabah', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM nasabah ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET - Ambil nasabah by ID
app.get('/api/nasabah/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM nasabah WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Nasabah not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST - Tambah nasabah baru
app.post('/api/nasabah', async (req, res) => {
    try {
        const { nama, nik, penghasilan, nilai_jaminan, riwayat_kredit, tanggungan, pengeluaran, tanggal } = req.body;
        
        const query = `
            INSERT INTO nasabah (nama, nik, penghasilan, nilai_jaminan, riwayat_kredit, tanggungan, pengeluaran, tanggal)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const values = [nama, nik, penghasilan, nilai_jaminan, riwayat_kredit, tanggungan, pengeluaran, tanggal || new Date().toISOString().split('T')[0]];
        
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            res.status(400).json({ error: 'NIK sudah terdaftar' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// PUT - Update nasabah
app.put('/api/nasabah/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, nik, penghasilan, nilai_jaminan, riwayat_kredit, tanggungan, pengeluaran } = req.body;
        
        const query = `
            UPDATE nasabah 
            SET nama = $1, nik = $2, penghasilan = $3, nilai_jaminan = $4, riwayat_kredit = $5, 
                tanggungan = $6, pengeluaran = $7, updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *
        `;
        
        const values = [nama, nik, penghasilan, nilai_jaminan, riwayat_kredit, tanggungan, pengeluaran, id];
        
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Nasabah not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE - Hapus nasabah
app.delete('/api/nasabah/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM nasabah WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Nasabah not found' });
        }
        res.json({ message: 'Nasabah deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
