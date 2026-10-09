const express = require("express");

const router = express.Router();

const {
    addToCart,
    getUserCart,
    updateCart,
    removeCartItem,
    clearCart
} = require("../controllers/cartController");


// Add product to cart
router.post("/add", addToCart);


// Get user's cart
router.get("/:userId", getUserCart);


// Update cart quantity
router.put("/:id", updateCart);


// Remove cart item
router.delete("/:id", removeCartItem);


// Clear user's cart
router.delete("/user/:userId", clearCart);


module.exports = router;