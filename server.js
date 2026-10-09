const dns = require("dns");
dns.setServers(["8.8.8.8","8.8.4.4"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./db");
const mutualFundRoutes = require("./routes/mutualFundRoutes");

const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const registrationRoutes = require("./routes/registrationRoutes");
const productRoutes = require("./routes/productRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Create Express application
const app = express();
app.use(cors());

// Load environment variables
dotenv.config();


// Port
const PORT = process.env.PORT || 5000;


// Middleware
app.use(bodyParser.json());
   
// Connect to MongoDB
connectDB();


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");
    })
    .catch((error) => {
        console.log("MongoDB Connection Error:");
        console.log(error.message);
    });
//Employee Routes
app.use("/employee", employeeRoutes);

// Registration Routes
app.use("/registration", registrationRoutes); 


// Product Routes
app.use("/product", productRoutes);

//Category Routes
const categoryRoutes = require("./routes/categoryRoutes");

app.use("/category", categoryRoutes);

// Cart Routes
app.use("/cart", cartRoutes);

// Order Routes
app.use("/order", orderRoutes);

// Test API
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "E-commerce Backend API is running"
    });
});


//test  routes
app.get("/", (req, res) => {
    res.send("E-commerce Backend API is running");
});


// Mutual Fund routes
app.use("/api/mutual-funds", mutualFundRoutes);



// Start Server
app.listen(PORT, () => {
    console.log(`Server Started and running at ${PORT}`);
});