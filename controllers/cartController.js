
const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const User = require("../models/Registration");
const Product = require("../models/Product");

// ==========================================
// ADD PRODUCT TO CART
// POST /cart/add
// ==========================================

const addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        // Validate required fields
        if (!userId || !productId || quantity === undefined) {
            return res.status(400).json({
                status: false,
                message: "userId, productId and quantity are required"
            });
        }

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid userId"
            });
        }

        // Validate productId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid productId"
            });
        }

        // Validate quantity
        if (quantity <= 0) {
            return res.status(400).json({
                status: false,
                message: "Quantity must be greater than 0"
            });
        }

        // Check user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User does not exist"
            });
        }

        // Check product
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                status: false,
                message: "Product does not exist"
            });
        }

        // Check product active status
        if (!product.isActive) {
            return res.status(400).json({
                status: false,
                message: "Product is inactive"
            });
        }

        // Check stock
        if (quantity > product.stock) {
            return res.status(400).json({
                status: false,
                message: "Insufficient stock"
            });
        }

        // Check if product already exists in cart
        const existingCart = await Cart.findOne({
            userId: userId,
            productId: productId
        });

        if (existingCart) {
            const newQuantity = existingCart.quantity + quantity;

            // Check stock after adding quantity
            if (newQuantity > product.stock) {
                return res.status(400).json({
                    status: false,
                    message: "Requested quantity exceeds available stock"
                });
            }

            existingCart.quantity = newQuantity;
            existingCart.price = product.price;

            await existingCart.save();

            return res.status(200).json({
                status: true,
                message: "Cart quantity updated",
                cart: existingCart
            });
        }

        // Create new cart item
        const cart = new Cart({
            userId: userId,
            productId: productId,
            quantity: quantity,
            price: product.price
        });

        await cart.save();

        return res.status(201).json({
            status: true,
            message: "Product added to cart",
            cart: cart
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// GET USER CART
// GET /cart/:userId
// ==========================================

const getUserCart = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid userId"
            });
        }

        // Check user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User does not exist"
            });
        }

        // Get cart items
        const cartItems = await Cart.find({
            userId: userId
        }).populate("productId");

        let grandTotal = 0;

        const cart = cartItems.map((item) => {
            const itemTotal = item.quantity * item.price;

            grandTotal += itemTotal;

            return {
                _id: item._id,
                userId: item.userId,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                itemTotal: itemTotal
            };
        });

        return res.status(200).json({
            status: true,
            message: "Cart fetched successfully",
            cart: cart,
            grandTotal: grandTotal
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE CART QUANTITY
// PUT /cart/:id
// ==========================================

const updateCart = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        // Validate cart ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: false,
                message: "Invalid cart ID"
            });
        }

        // Validate quantity
        if (quantity === undefined || quantity <= 0) {
            return res.status(400).json({
                status: false,
                message: "Quantity must be greater than 0"
            });
        }

        // Find cart item
        const cart = await Cart.findById(id);

        if (!cart) {
            return res.status(404).json({
                status: false,
                message: "Cart item not found"
            });
        }

        // Find product
        const product = await Product.findById(cart.productId);

        if (!product) {
            return res.status(404).json({
                status: false,
                message: "Product does not exist"
            });
        }

        // Check product active status
        if (!product.isActive) {
            return res.status(400).json({
                status: false,
                message: "Product is inactive"
            });
        }

        // Check stock
        if (quantity > product.stock) {
            return res.status(400).json({
                status: false,
                message: "Quantity exceeds available stock"
            });
        }

        // Update quantity
        cart.quantity = quantity;

        // Update price
        cart.price = product.price;

        await cart.save();

        return res.status(200).json({
            status: true,
            message: "Cart quantity updated successfully",
            cart: cart
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// REMOVE CART ITEM
// DELETE /cart/:id
// ==========================================

const removeCartItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate cart ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: false,
                message: "Invalid cart ID"
            });
        }

        // Find cart item
        const cart = await Cart.findById(id);

        if (!cart) {
            return res.status(404).json({
                status: false,
                message: "Cart item not found"
            });
        }

        // Delete cart item
        await Cart.findByIdAndDelete(id);

        return res.status(200).json({
            status: true,
            message: "Cart item removed successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// CLEAR USER CART
// DELETE /cart/user/:userId
// ==========================================

const clearCart = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid userId"
            });
        }

        // Check user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User does not exist"
            });
        }

        // Delete all cart items for this user
        const result = await Cart.deleteMany({
            userId: userId
        });

        return res.status(200).json({
            status: true,
            message: "Cart cleared successfully",
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    addToCart,
    getUserCart,
    updateCart,
    removeCartItem,
    clearCart
};