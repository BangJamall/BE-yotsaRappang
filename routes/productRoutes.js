const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const verifyToken = require("../middleware/authMiddleware");
const { upload, processImage } = require("../middleware/uploadMiddleware");

// Public Routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected Routes (Butuh Token & Multipart Form Upload)
router.post("/", verifyToken, upload.single("image"), processImage, createProduct);
router.put("/:id", verifyToken, upload.single("image"), processImage, updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

module.exports = router;
