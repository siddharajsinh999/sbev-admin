const express = require("express")
const router = express.Router()

// User routes
router.use("/users", require("./user"))
router.use("/product",require("./product"))
router.use("/stock", require("./stock"))
router.use("/batch",require('./batch'))
router.use("/emptyBottle",require("./emptyBottle"))
router.use("/home",require("./home"))


module.exports = router
