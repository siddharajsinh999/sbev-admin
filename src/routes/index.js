const express = require("express")
const router = express.Router()

// User routes
router.use("/users", require("./user"))
router.use("/product",require("./product"))
router.use("/stock", require("./stock"))


module.exports = router
