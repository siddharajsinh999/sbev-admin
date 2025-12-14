const express = require("express")
const cors = require("cors")
const morgan = require("morgan")

const routes = require("./routes")

const app = express()

app.use(cors())
app.use(express.json())
app.use("/public", express.static("public"));
app.use(morgan("dev"))

// All routes
app.use("/api", routes)

module.exports = app
