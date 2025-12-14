const Product = require("../models/Product")



// Add Product
exports.addProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body)
        res.status(201).json({
            success: true,
            data: product
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

// get all products
exports.getAllProduct = async (req, res) => {
    try {
        const products = await Product.find()
        res.status(201).json({
            success: true,
            data: products
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}