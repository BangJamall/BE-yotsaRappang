const express = require('express');
const router = express.Router();
const {
  getPosters,
  getPosterByCategory,
  upsertPoster,
  deletePoster,
} = require('../controllers/posterController');

const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public Routes (Bisa diakses langsung oleh Frontend Next.js)
router.get('/', getPosters);
router.get('/:category', getPosterByCategory);

// Protected Routes (Butuh Login Admin + Upload Gambar)
router.post('/', verifyToken, upload.single('image'), upsertPoster);
router.delete('/:id', verifyToken, deletePoster);

module.exports = router;