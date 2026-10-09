const express = require("express");

const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getProductsByCategory
} = require("../controllers/categoryController");

const router = express.Router();


// Create category
router.post("/create", createCategory);


// Get all categories
router.get("/list", getCategories);


// Get products by category
router.get("/:id/products", getProductsByCategory);


// Get category by ID
router.get("/:id", getCategoryById);


// Update category
router.put("/:id", updateCategory);


// Delete category
router.delete("/:id", deleteCategory);


module.exports = router;