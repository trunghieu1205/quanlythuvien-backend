const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Cấu hình Middleware
app.use(cors()); 
app.use(express.json()); 

// Cấu hình kết nối cơ sở dữ liệu Supabase
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false 
    }
});

// Kiểm tra kết nối database ngay khi khởi động server
pool.connect((err, client, release) => {
    if (err) {
        return console.error(' Lỗi kết nối database Supabase:', err.stack);
    }
    console.log(' Kết nối database Supabase thành công!');
    release();
});

// 1. LẤY DANH SÁCH TẤT CẢ SÁCH (READ)
app.get('/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách sách.' });
    }
});

// 2. THÊM SÁCH MỚI (CREATE)
app.post('/books', async (req, res) => {
    try {
        const { title, author, category } = req.body;
        
        if (!title || !author || !category) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin sách.' });
        }

        const queryText = 'INSERT INTO books (title, author, category) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(queryText, [title, author, category]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi hệ thống khi thêm sách.' });
    }
});

// 3. XÓA SÁCH (DELETE)
app.delete('/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Không tìm thấy sách để xóa.' });
        }

        res.status(200).json({ message: 'Xóa sách thành công!', deletedBook: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi hệ thống khi xóa sách.' });
    }
});

// KHỞI ĐỘNG SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(` Backend đang chạy tại: http://localhost:${PORT}`);
});