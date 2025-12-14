const express = require("express")
const router = express.Router()

const productController = require("../controllers/product")

router.post("/addProduct", productController.addProduct)
router.get("/allProduct", productController.getAllProduct)

module.exports = router