const EmptyBottle = require("../models/EmptyBottle");

/**
 * ➕ Add Empty Bottle
 * POST /api/empty-bottles
 */
exports.addEmptyBottle = async (req, res) => {
  try {
    const { name, type, quantity, date } = req.body;

    const bottle = await EmptyBottle.create({
      name,
      type,
      quantity,
      date
    });

    res.status(201).json({
      success: true,
      message: "Empty bottle added successfully",
      data: bottle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * ✏️ Edit Empty Bottle
 * PUT /api/empty-bottles/:id
 */
exports.updateEmptyBottle = async (req, res) => {
  try {
    const { id } = req.params;

    const bottle = await EmptyBottle.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bottle) {
      return res.status(404).json({
        success: false,
        message: "Empty bottle not found"
      });
    }

    res.json({
      success: true,
      message: "Empty bottle updated successfully",
      data: bottle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 🗑️ Delete Empty Bottle
 * DELETE /api/empty-bottles/:id
 */
exports.deleteEmptyBottle = async (req, res) => {
  try {
    const { id } = req.params;

    const bottle = await EmptyBottle.findByIdAndDelete(id);

    if (!bottle) {
      return res.status(404).json({
        success: false,
        message: "Empty bottle not found"
      });
    }

    res.json({
      success: true,
      message: "Empty bottle deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 📃 Get All Empty Bottles
 * GET /api/empty-bottles
 */
exports.getAllEmptyBottles = async (req, res) => {
  try {
    const bottles = await EmptyBottle.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bottles.length,
      data: bottles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 🔍 Get Empty Bottle By ID
 * GET /api/empty-bottles/:id
 */
exports.getEmptyBottleById = async (req, res) => {
  try {
    const { id } = req.params;

    const bottle = await EmptyBottle.findById(id);

    if (!bottle) {
      return res.status(404).json({
        success: false,
        message: "Empty bottle not found"
      });
    }

    res.json({
      success: true,
      data: bottle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
