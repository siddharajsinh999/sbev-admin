const express = require("express")
const router = express.Router()

const batchController = require("../controllers/batchController")


/* Material */
router.post("/materials", batchController.addMaterial);
router.put("/materials/:id", batchController.editMaterial);
router.delete("/materials/:id", batchController.deleteMaterial);
router.get("/materials", batchController.getMaterialList);



/* Batch */
router.post("/batches", batchController.addBatch);
router.put("/batches/:id", batchController.editBatch);
router.delete("/batches/:id", batchController.deleteBatch);
router.get("/batches", batchController.getBatches);

module.exports = router