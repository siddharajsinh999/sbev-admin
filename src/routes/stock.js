const express = require("express")
const router = express.Router()

const stockController = require("../controllers/stockController")
const uploadImage = require("../middlewares/uploadImage");


// router.post("/add", stockController.addStock)
router.post("/add",uploadImage.single("image"),stockController.addStock);
router.post("/dispatch", stockController.dispatchStock)
router.get("/", stockController.getAllStock);
router.get("/history/:productId", stockController.getStockHistory);
router.get("/export/excel", stockController.exportStockExcel);


module.exports = router