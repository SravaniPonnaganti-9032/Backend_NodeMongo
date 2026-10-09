const express = require("express");

const router = express.Router();

const {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    deleteOrder
} = require("../controllers/orderController");


// Create order from cart
router.post("/create", createOrder);


// Get all orders of a user
router.get("/user/:userId", getUserOrders);


// Get order by ID
router.get("/:id", getOrderById);


// Update order status
router.put("/:id/status", updateOrderStatus);


// Cancel order
router.put("/:id/cancel", cancelOrder);


// Delete order
router.delete("/:id", deleteOrder);


module.exports = router;