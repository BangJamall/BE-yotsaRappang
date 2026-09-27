const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Login Admin
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username dan password wajib diisi!' 
      });
    }

    // Cari user di database
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah!' 
      });
    }

    const user = users[0];

    // Bandingkan password inputan dengan password hash di database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah!' 
      });
    }

    // Buat Token JWT (berlaku 1 hari)
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'rahasia_super_aman',
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });

  } catch (error) {
    console.error('Error Login:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server' 
    });
  }
};

// 2. Cek Profil Admin Aktif (Get Me)
const getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, created_at FROM users WHERE id = ?', 
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User tidak ditemukan' 
      });
    }

    return res.json({ 
      success: true, 
      user: users[0] 
    });
  } catch (error) {
    console.error('Error GetMe:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server' 
    });
  }
};

module.exports = { login, getMe };