const User = require("../models/User")

// CREATE USER
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body)
    res.status(201).json({
      success: true,
      data: user
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

// GET ALL USERS
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
    res.json({
      total: users.length,
      data: users
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// GET SINGLE USER
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )

    res.json(user)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
