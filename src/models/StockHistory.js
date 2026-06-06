// models/StockHistory.js
import mongoose from "mongoose";

const stockHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  type: {
    type: String,
    enum: ["500_ml", "1_liter", "5_liter", "10_liter"],
    required: true
  },

  action: {
    type: String,
    enum: ["ADD", "DISPATCH"],
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  notes: {
    type: String
  },

  customer: {
    type: String     // only for DISPATCH
  },

  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: false
  },

  date: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

export default mongoose.model("StockHistory", stockHistorySchema);
