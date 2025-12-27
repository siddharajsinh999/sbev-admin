const mongoose = require("mongoose");

const emptyBottleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["500_ml", "1_liter", "5_liter", "10_liter"],
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmptyBottle", emptyBottleSchema);
