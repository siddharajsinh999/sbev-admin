const express = require("express")
const router = express.Router()

const emptyBottleController = require("../controllers/emptyBottleController")

router.post("/", emptyBottleController.addEmptyBottle);
router.get("/", emptyBottleController.getAllEmptyBottles);
router.get("/:id", emptyBottleController.getEmptyBottleById);
router.put("/:id", emptyBottleController.updateEmptyBottle);
router.delete("/:id", emptyBottleController.deleteEmptyBottle);

module.exports = router