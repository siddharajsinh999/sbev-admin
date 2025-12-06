const express = require("express")
const router = express.Router()

// User routes
router.use("/users", require("./user"))
router.use("/product",require("./product"))

module.exports = router
