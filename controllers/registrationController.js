const Registration = require("../models/Registration");

const registerUser = async (req, res) => {
    try {
        const { username, mobile, email, password } = req.body;

        // Check if user already exists
        const existingUser = await Registration.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // Create new user
        const newUser = new Registration({
            username,
            mobile,
            email,
            password
        });

        // Save user in MongoDB
        await newUser.save();

        // Send user details in response
        res.status(201).json({
            message: "User Registered Successfully",
            user: {
                id: newUser._id,
                username: newUser.username,
                mobile: newUser.mobile,
                email: newUser.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

//login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Registration.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (password !== user.password) {
            return res.status(400).json({
                message: "Invalid Password"
            });
        }

        res.status(200).json({
            message: "Login Successful",
            user: {
                id: user._id,
                username: user.username,
                mobile: user.mobile,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    registerUser,
    loginUser
};