const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        stock: {
            type: Number,
            required: true,
        
        },

        isActive: {
            type: Boolean,
            default: true
        },

        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category"
        },

        description: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Product", productSchema);