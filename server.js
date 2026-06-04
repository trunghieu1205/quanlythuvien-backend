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
        // Cột image_url đã được tự động thêm vào lệnh lấy dữ liệu này
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
        // Lấy thêm trường image_url được gửi lên từ Frontend form
        const { title, author, category, image_url } = req.body;
        
        if (!title || !author || !category) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin sách.' });
        }

        // Nếu người dùng để trống ô nhập ảnh, hệ thống sẽ tự động gán một link ảnh sách mặc định
        const finalImageUrl = image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500';

        const queryText = 'INSERT INTO books (title, author, category, image_url) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(queryText, [title, author, category, finalImageUrl]);
        
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

const PORT = process.env.PORT || 5000;
// Thêm '0.0.0.0' để server lắng nghe từ mọi địa chỉ IP, không chỉ riêng localhost
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});