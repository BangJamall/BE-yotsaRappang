const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Helper untuk menghapus file gambar fisik dari folder uploads
const deleteImageFile = (imageUrl) => {
  if (!imageUrl) return;
  const fileName = imageUrl.split('/uploads/')[1];
  if (fileName) {
    const filePath = path.join(__dirname, '../uploads', fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// 1. Ambil Semua Poster (Publik/Admin)
const getPosters = async (req, res) => {
  try {
    const [posters] = await db.query('SELECT * FROM posters ORDER BY id ASC');
    return res.json({ success: true, data: posters });
  } catch (error) {
    console.error('Error GetPosters:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data poster' });
  }
};

// 2. Ambil Poster Spesifik Berdasarkan Kategori (makanan, minuman, splash)
const getPosterByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const [posters] = await db.query(
      'SELECT * FROM posters WHERE category = ? AND is_active = 1 LIMIT 1',
      [category]
    );

    if (posters.length === 0) {
      return res.status(404).json({ success: false, message: `Poster kategori '${category}' tidak ditemukan` });
    }

    return res.json({ success: true, data: posters[0] });
  } catch (error) {
    console.error('Error GetPosterByCategory:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data poster' });
  }
};

// 3. Tambah / Upsert Poster (Protected)
// Jika kategori sudah ada, gambar lama otomatis diganti dengan yang baru
const upsertPoster = async (req, res) => {
  try {
    const { title, category, is_active } = req.body;

    if (!title || !category) {
      if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({ success: false, message: 'Judul dan kategori wajib diisi!' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Gambar poster/splash screen wajib diunggah!' });
    }

    const newImageUrl = `/uploads/${req.file.filename}`;
    const activeVal = is_active === 'false' || is_active === '0' || is_active === false ? 0 : 1;

    // Cek apakah poster dengan kategori ini sudah ada
    const [existing] = await db.query('SELECT * FROM posters WHERE category = ?', [category]);

    if (existing.length > 0) {
      // Hapus gambar lama dari harddisk host
      deleteImageFile(existing[0].image_url);

      // Update data poster yang sudah ada
      await db.query(
        'UPDATE posters SET title = ?, image_url = ?, is_active = ? WHERE category = ?',
        [title, newImageUrl, activeVal, category]
      );

      return res.json({
        success: true,
        message: `Poster kategori '${category}' berhasil diperbarui!`,
        data: { id: existing[0].id, title, category, imageUrl: newImageUrl },
      });
    } else {
      // Buat record poster baru
      const [result] = await db.query(
        'INSERT INTO posters (title, category, image_url, is_active) VALUES (?, ?, ?, ?)',
        [title, category, newImageUrl, activeVal]
      );

      return res.status(201).json({
        success: true,
        message: 'Poster berhasil ditambahkan!',
        data: { id: result.insertId, title, category, imageUrl: newImageUrl },
      });
    }
  } catch (error) {
    console.error('Error UpsertPoster:', error);
    if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan poster' });
  }
};

// 4. Hapus Poster (Protected)
const deletePoster = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM posters WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Poster tidak ditemukan' });
    }

    // Hapus file fisik gambar dari host
    deleteImageFile(existing[0].image_url);

    // Hapus dari database
    await db.query('DELETE FROM posters WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Poster berhasil dihapus!' });
  } catch (error) {
    console.error('Error DeletePoster:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus poster' });
  }
};

module.exports = {
  getPosters,
  getPosterByCategory,
  upsertPoster,
  deletePoster,
};