const express = require("express")
const router = express.Router()

const homeController = require("../controllers/homeController")

router.get("/dashbord", homeController.dashboardSummary)

module.exports = router