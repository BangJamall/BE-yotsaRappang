const db = require("../config/db");
const fs = require("fs");
const path = require("path");

const deleteImageFile = (imageUrl) => {
  if (!imageUrl) return;
  const fileName = imageUrl.split("/uploads/")[1];
  if (fileName) {
    const filePath = path.join(__dirname, "../uploads", fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// 1. Ambil Semua Produk (Public & Admin Filter)
const getProducts = async (req, res) => {
  try {
    const { category, active_only } = req.query;
    let sql = "SELECT * FROM products";
    const params = [];
    const conditions = [];

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }

    // Jika dipanggil oleh frontend publik, tampilkan yang active saja
    if (active_only === "true") {
      conditions.push("is_active = 1");
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY id DESC";

    const [products] = await db.query(sql, params);
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error GetProducts:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data produk" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await db.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);

    if (products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
    }

    return res.json({ success: true, data: products[0] });
  } catch (error) {
    console.error("Error GetProductById:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil detail produk" });
  }
};

// 3. Tambah Produk Baru (Protected)
const createProduct = async (req, res) => {
  try {
    const { title, category, price, description, is_best_seller, is_active } =
      req.body;

    if (!title || !category || !price) {
      if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
      return res
        .status(400)
        .json({
          success: false,
          message: "Judul, kategori, dan harga wajib diisi!",
        });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Gambar produk wajib diunggah!" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const bestSellerVal =
      is_best_seller === "true" ||
      is_best_seller === "1" ||
      is_best_seller === true
        ? 1
        : 0;
    const activeVal =
      is_active === "false" || is_active === "0" || is_active === false ? 0 : 1;

    const [result] = await db.query(
      `INSERT INTO products (title, category, price, description, image_url, is_best_seller, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        Number(price),
        description || "",
        imageUrl,
        bestSellerVal,
        activeVal,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan!",
      data: { id: result.insertId, title, category, price, imageUrl },
    });
  } catch (error) {
    console.error("Error CreateProduct:", error);
    if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menambahkan produk" });
  }
};

// 4. Perbarui Produk (Protected)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, price, description, is_best_seller, is_active } =
      req.body;

    const [existing] = await db.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
    }

    const oldProduct = existing[0];
    let imageUrl = oldProduct.image_url;

    // Jika ada file gambar baru diunggah, pakai gambar baru dan hapus gambar lama
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      deleteImageFile(oldProduct.image_url);
    }

    const bestSellerVal =
      is_best_seller === "true" ||
      is_best_seller === "1" ||
      is_best_seller === true
        ? 1
        : 0;
    const activeVal =
      is_active === "false" || is_active === "0" || is_active === false ? 0 : 1;

    await db.query(
      `UPDATE products 
       SET title = ?, category = ?, price = ?, description = ?, image_url = ?, is_best_seller = ?, is_active = ?
       WHERE id = ?`,
      [
        title || oldProduct.title,
        category || oldProduct.category,
        price ? Number(price) : oldProduct.price,
        description !== undefined ? description : oldProduct.description,
        imageUrl,
        bestSellerVal,
        activeVal,
        id,
      ],
    );

    return res.json({ success: true, message: "Produk berhasil diperbarui!" });
  } catch (error) {
    console.error("Error UpdateProduct:", error);
    if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui produk" });
  }
};

// 5. Hapus Produk (Protected)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
    }

    // Hapus file gambar fisiknya
    deleteImageFile(existing[0].image_url);

    // Hapus record di database
    await db.query("DELETE FROM products WHERE id = ?", [id]);

    return res.json({ success: true, message: "Produk berhasil dihapus!" });
  } catch (error) {
    console.error("Error DeleteProduct:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus produk" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
