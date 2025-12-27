// controllers/batchController.js
import Material from "../models/Material.js";
import Batch from "../models/Batch.js";
import mongoose from "mongoose";

export const addMaterial = async (req, res) => {
    try {
        const { name, defaultUnit, stockQuantity } = req.body;

        const material = await Material.create({
            name,
            defaultUnit,
            stockQuantity,
        });

        res.status(201).json({ success: true, material });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const editMaterial = async (req, res) => {
    try {
        const material = await Material.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!material)
            return res.status(404).json({ message: "Material not found" });

        res.json({ success: true, material });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findByIdAndDelete(req.params.id);

        if (!material)
            return res.status(404).json({ message: "Material not found" });

        res.json({ success: true, message: "Material deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getMaterialList = async (req, res) => {
    try {
        const materials = await Material.find().sort({ name: 1 });
        res.json({ success: true, materials });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const addBatch = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            batchCode,
            batchName,
            inputKg,
            outputKg,
            date,
            status,
            usedMaterials,
        } = req.body;

        // 1️⃣ Validate stock
        for (const item of usedMaterials) {
            const material = await Material.findById(item.material).session(session);

            if (!material) {
                throw new Error("Material not found");
            }

            if (material.stockQuantity < item.quantity) {
                throw new Error(
                    `Insufficient stock for ${material.name}`
                );
            }
        }

        // 2️⃣ Deduct material stock
        for (const item of usedMaterials) {
            await Material.findByIdAndUpdate(
                item.material,
                { $inc: { stockQuantity: -item.quantity } },
                { session }
            );
        }

        // 3️⃣ Create batch
        const batch = await Batch.create(
            [
                {
                    batchCode,
                    batchName,
                    inputKg,
                    outputKg,
                    date,
                    status,
                    usedMaterials,
                },
            ],
            { session }
        );

        // 4️⃣ Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Batch created & material stock updated",
            batch: batch[0],
        });

    } catch (error) {
        // ❌ Rollback
        await session.abortTransaction();
        session.endSession();

        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


export const editBatch = async (req, res) => {
    try {
        const batch = await Batch.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!batch)
            return res.status(404).json({ message: "Batch not found" });

        res.json({ success: true, batch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getBatches = async (req, res) => {
    try {
        const { batchCode } = req.query;

        if (batchCode) {
            const batch = await Batch.findOne({ batchCode: batchCode })
                .populate("usedMaterials.material", "name defaultUnit");

            return res.json({ success: true, batch });
        }

        const batches = await Batch.find()
            .populate("usedMaterials.material", "name defaultUnit")
            .sort({ createdAt: -1 });

        res.json({ success: true, batches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

