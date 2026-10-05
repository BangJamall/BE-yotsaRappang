const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const posterRoutes = require("./routes/posterRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Global
app.use(cors({
  origin: 'http://localhost:3000', // URL Frontend Next.js Anda
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Membuka akses folder uploads agar gambar bisa diakses dari URL
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test Route
app.get("/", (req, res) => {
  res.send({ message: "API Kaki Lima Backend Berhasil Jalan!" });
});

// Jalankan Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Express berjalan di http://localhost:${PORT}`);
});

app.get("/db-test", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ message: "Koneksi ke database berhasil!" });
  } catch (error) {
    console.error("Koneksi ke database gagal:", error);
    res.status(500).json({ message: "Koneksi ke database gagal!" });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/posters', posterRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const isMulterError = error instanceof multer.MulterError;
  const statusCode = isMulterError
    ? (error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
    : error.statusCode || 500;
  let message = error.message;

  if (statusCode === 500) {
    message = 'Terjadi kesalahan pada server';
  } else if (isMulterError) {
    message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Ukuran gambar maksimal 5 MB.'
      : 'Permintaan upload gambar tidak valid.';
  }

  if (statusCode >= 500) {
    console.error('Error middleware:', error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
});
