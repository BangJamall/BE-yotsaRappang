const express = require("express");
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
