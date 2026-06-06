// models/Stock.js
import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  bottle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EmptyBottle",
    required: false // make true if stock must always be linked to a bottle
  },

  type: {
    type: String,
    enum: ["500_ml", "1_liter", "5_liter", "10_liter"],
    required: true
  },

  quantity: {
    type: Number,
    default: 0
  },

  date: {
    type: Date,
    default: Date.now
  },

  image: {
    type: String,
    required: false
  },

  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: false
  },

  minLevel: {
    type: Number,
    default: 10   // for "Low" / "Very Low" badge
  }

}, { timestamps: true });

export default mongoose.model("Stock", stockSchema);
