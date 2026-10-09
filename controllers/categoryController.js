const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");

// CREATE CATEGORY
const createCategory = async (req, res) => {
    try {
        const { name, description, status } = req.body;

        // Check required name
        if (!name || name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        // Check duplicate category
        const existingCategory = await Category.findOne({
            name: name.trim()
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: "Category name already exists"
            });
        }

        // Validate status
        if (status && !["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be active or inactive"
            });
        }

        const category = await Category.create({
            name: name.trim(),
            description,
            status: status || "active"
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create category",
            error: error.message
        });
    }
};


// GET ALL CATEGORIES
const getCategories = async (req, res) => {
    try {
        const { status } = req.query;

        const filter = {};

        if (status) {
            if (!["active", "inactive"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be active or inactive"
                });
            }

            filter.status = status;
        }

        const categories = await Category.find(filter)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
            error: error.message
        });
    }
};


// GET CATEGORY BY ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch category",
            error: error.message
        });
    }
};


// UPDATE CATEGORY
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check duplicate name
        if (name && name.trim() !== category.name) {
            const duplicate = await Category.findOne({
                name: name.trim(),
                _id: { $ne: id }
            });

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: "Category name already exists"
                });
            }

            category.name = name.trim();
        }

        if (description !== undefined) {
            category.description = description;
        }

        if (status !== undefined) {
            if (!["active", "inactive"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be active or inactive"
                });
            }

            category.status = status;
        }

        const updatedCategory = await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: updatedCategory
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update category",
            error: error.message
        });
    }
};


// DELETE CATEGORY
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check whether products are using this category
        const productCount = await Product.countDocuments({
            categoryId: id
        });

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete category because products are assigned to it",
                productCount
            });
        }

        await Category.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete category",
            error: error.message
        });
    }
};


// GET PRODUCTS BY CATEGORY
const getProductsByCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const products = await Product.find({
            categoryId: id
        }).populate("categoryId", "name status");

        res.status(200).json({
            success: true,
            category: category.name,
            count: products.length,
            data: products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch products by category",
            error: error.message
        });
    }
};


module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getProductsByCategory
};