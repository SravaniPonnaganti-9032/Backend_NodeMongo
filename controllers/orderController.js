const mongoose = require("mongoose");

const Order = require("../models/Order");
const User = require("../models/Registration");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

// ======================================================
// TASK 1
// CREATE ORDER FROM CART
// POST /order/create
// ======================================================

const createOrder = async (req, res) => {
    try {
        const { userId, shippingAddress } = req.body;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        if (!shippingAddress) {
            return res.status(400).json({
                success: false,
                message: "shippingAddress is required"
            });
        }

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid userId"
            });
        }

        // Check user exists
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Find cart items
        const cartItems = await Cart.find({ userId })
            .populate("productId");

        // Check cart
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        const orderItems = [];
        let totalAmount = 0;

        // Verify every cart product
        for (const cartItem of cartItems) {
            const product = cartItem.productId;

            // Product does not exist
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "One or more products in cart no longer exist"
                });
            }

            // Product inactive
            if (product.status === "inactive") {
                return res.status(400).json({
                    success: false,
                    message: "Product is inactive"
                });
            }

            // Check quantity
            if (!cartItem.quantity || cartItem.quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity for product "${product.name}"`
                });
            }

            // Check stock
            if (product.stock < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Insufficient stock for "${product.name}". ` +
                        `Available: ${product.stock}, ` +
                        `Requested: ${cartItem.quantity}`
                });
            }

            // Calculate item total
            const itemTotal = product.price * cartItem.quantity;

            totalAmount += itemTotal;

            orderItems.push({
                productId: product._id,
                name: product.name,
                quantity: cartItem.quantity,
                price: product.price,
                total: itemTotal
            });
        }

        // Create order
        const order = new Order({
            userId: userId,
            items: orderItems,
            totalAmount: totalAmount,
            status: "pending",
            shippingAddress: shippingAddress
        });

        await order.save();

        // Reduce product stock
        for (const cartItem of cartItems) {
            const product = cartItem.productId;

            await Product.findByIdAndUpdate(
                product._id,
                {
                    $inc: {
                        stock: -cartItem.quantity
                    }
                }
            );
        }

        // Clear cart
        await Cart.deleteMany({ userId });

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: order
        });

    } catch (error) {
        console.error("Create Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Error creating order",
            error: error.message
        });
    }
};


// ======================================================
// TASK 2
// GET USER ORDERS
// GET /order/user/:userId
// ======================================================

const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid userId"
            });
        }

        // Check user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Get orders
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        console.error("Get User Orders Error:", error);

        return res.status(500).json({
            success: false,
            message: "Error fetching user orders",
            error: error.message
        });
    }
};


// ======================================================
// TASK 3
// GET ORDER BY ID
// GET /order/:id
// ======================================================

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        // Find order
        const order = await Order.findById(id)
            .populate("userId", "username email");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error("Get Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Error fetching order",
            error: error.message
        });
    }
};


// ======================================================
// TASK 4
// UPDATE ORDER STATUS
// PUT /order/:id/status
// ======================================================

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log("REQUEST BODY:", req.body);
        console.log("STATUS:", status); 

        // Validate Order ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        // Allowed statuses
        const allowedStatuses = [
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled"
        ];

        // Check status
        if (status === undefined || status === null || status === "") {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        // Check invalid status
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        // Find order
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Don't update cancelled order
        if (order.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled order cannot be updated"
            });
        }

        // Don't change delivered order
        if (
            order.status === "delivered" &&
            status !== "delivered"
        ) {
            return res.status(400).json({
                success: false,
                message: "Delivered order cannot be changed"
            });
        }

        // Update status
        order.status = status;

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order: order
        });

    } catch (error) {
        console.error("Update Order Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Error updating order status",
            error: error.message
        });
    }
};


// ======================================================
// TASK 5
// CANCEL ORDER
// PUT /order/:id/cancel
// ======================================================

const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        // Find order
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Only pending or confirmed can be cancelled
        if (
            order.status !== "pending" &&
            order.status !== "confirmed"
        ) {
            return res.status(400).json({
                success: false,
                message: "Only pending or confirmed orders can be cancelled"
            });
        }

        // Restore product stock
        for (const item of order.items) {
            const product = await Product.findById(item.productId);

            if (product) {
                product.stock = product.stock + item.quantity;
                await product.save();
            }
        }

        // Update order status
        order.status = "cancelled";

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully and stock restored",
            order: order
        });

    } catch (error) {
        console.error("Cancel Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Error cancelling order",
            error: error.message
        });
    }
};


// ======================================================
// TASK 6
// DELETE ORDER
// DELETE /order/:id
// ======================================================

const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        // Find order
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Delivered orders cannot be deleted
        if (order.status === "delivered") {
            return res.status(400).json({
                success: false,
                message: "Delivered orders cannot be deleted"
            });
        }

        // Delete order
        await Order.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Order deleted successfully"
        });

    } catch (error) {
        console.error("Delete Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Error deleting order",
            error: error.message
        });
    }
};


// ======================================================
// EXPORT FUNCTIONS
// ======================================================

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    deleteOrder
};