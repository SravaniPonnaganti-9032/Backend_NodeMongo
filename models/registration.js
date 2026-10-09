const mongoose = require("mongoose");
const registrationSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});



module.exports =
    mongoose.models.Registration ||
    mongoose.model("Registration", registrationSchema);