const express = require("express");

const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/prodUctController");

// CREATE
router.post("/create", createProduct);

// GET ALL
router.get("/list", getProducts);

// GET BY ID
router.get("/:id", getProductById);

// UPDATE
router.put("/:id", updateProduct);

// DELETE
router.delete("/:id", deleteProduct);

module.exports = router;