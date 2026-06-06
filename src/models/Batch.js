import mongoose from "mongoose";

const usedMaterialSchema = new mongoose.Schema(
    {
        material: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Material",
            required: true,
        },
        unit: {
            type: String,
            required: true, // KG, Liter, Gram, etc.
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const outputBreakdownSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        productType: {
            type: String,
            required: true,
        },
        emptyBottle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EmptyBottle",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        notes: {
            type: String,
        },
        stockHistory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockHistory",
            required: false,
        },
    },
    { _id: false }
);

const batchSchema = new mongoose.Schema(
    {
        batchCode: {
            type: String,
            required: true,
            unique: true,
        },
        batchName: {
            type: String,
            required: true,
        },
        inputKg: {
            type: Number,
            required: true,
            min: 0,
        },
        outputKg: {
            type: Number,
            required: true,
            min: 0,
        },
        date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "In Progress", "Completed", "Rejected"],
            default: "Pending",
        },
        usedMaterials: [usedMaterialSchema],
        outputBreakdowns: [outputBreakdownSchema],
    },
    { timestamps: true }
);

export default mongoose.model("Batch", batchSchema);
