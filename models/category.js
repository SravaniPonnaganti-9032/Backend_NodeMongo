const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            unique: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        status: {
            type: String,
            required: [true, "Category status is required"],
            enum: {
                values: ["active", "inactive"],
                message: "Status must be active or inactive"
            },
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Category", categorySchema);