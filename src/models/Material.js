import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    defaultUnit: {
      type: String,
      required: true,
      enum: ["Liter", "ml", "Gram", "KG"],
    },

    materialType: {
      type: String,
      required: true,
      enum: ["chemical", "other"],
      default: "other",
    },

    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Material", materialSchema);
