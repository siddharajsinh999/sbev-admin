// controllers/batchController.js
import Material from "../models/Material.js";
import Batch from "../models/Batch.js";
import EmptyBottle from "../models/EmptyBottle.js";
import Stock from "../models/Stock.js";
import StockHistory from "../models/StockHistory.js";
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
            outputBreakdowns
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
                    outputBreakdowns
                },
            ],
            { session }
        );

        const newBatch = batch[0];

        // 4️⃣ Handle Output Breakdowns (Stock Creation)
        if (outputBreakdowns && outputBreakdowns.length > 0) {
            for (const item of outputBreakdowns) {
                const { product, productType, emptyBottle, quantity, notes } = item;

                if (!product || !quantity) continue;

                if (!productType || !emptyBottle) {
                    throw new Error("Missing Product Type or Empty Bottle for output breakdown");
                }

                // 🧴 Find Empty Bottle
                const bottle = await EmptyBottle.findById(emptyBottle).session(session);

                if (!bottle) {
                    throw new Error(`Empty bottle not found for ${productType}`);
                }

                // ❗ Type validation
                if (bottle.type !== productType) {
                    throw new Error(`Bottle type mismatch for ${productType}`);
                }

                // ❗ Quantity check
                if (bottle.quantity < quantity) {
                    throw new Error(`Insufficient empty bottles for ${productType} (Available: ${bottle.quantity})`);
                }

                // 🔻 Deduct bottle quantity
                await EmptyBottle.findByIdAndUpdate(
                    emptyBottle,
                    { $inc: { quantity: -quantity } },
                    { session }
                );

                // 📦 Find or create stock
                let stock = await Stock.findOne({ product, type: productType }).session(session);

                if (!stock) {
                    stock = new Stock({
                        product,
                        type: productType,
                        bottle: emptyBottle,
                        quantity: 0,
                        batch: newBatch._id,
                        date: date || newBatch.date // 📅 Use batch date
                    });
                } else {
                    stock.batch = newBatch._id;
                }

                stock.quantity += Number(quantity);
                await stock.save({ session });

                // 🧾 Stock history
                await StockHistory.create(
                    [
                        {
                            product,
                            type: productType,
                            action: "ADD",
                            quantity: Number(quantity),
                            notes: notes || `Created from Batch ${newBatch.batchCode}`,
                            date: date || newBatch.date, // 📅 Use batch date
                            bottle: emptyBottle,
                            batch: newBatch._id
                        },
                    ],
                    { session }
                );
            }
        }

        // 5️⃣ Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Batch created & stocks updated successfully",
            batch: newBatch,
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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const newData = req.body;

        // 1️⃣ Fetch old batch data to reverse impacts
        const oldBatch = await Batch.findById(id).session(session);
        if (!oldBatch) {
            throw new Error("Batch not found");
        }

        // --- UNDO OLD IMPACTS ---

        // A. Restore Material Stock
        if (oldBatch.usedMaterials && oldBatch.usedMaterials.length > 0) {
            for (const item of oldBatch.usedMaterials) {
                await Material.findByIdAndUpdate(
                    item.material,
                    { $inc: { stockQuantity: item.quantity } },
                    { session }
                );
            }
        }

        // B. Restore Empty Bottle Stock & Deduct Product Stock & Delete History
        if (oldBatch.outputBreakdowns && oldBatch.outputBreakdowns.length > 0) {
            for (const item of oldBatch.outputBreakdowns) {
                // Restore Bottles
                await EmptyBottle.findByIdAndUpdate(
                    item.emptyBottle,
                    { $inc: { quantity: item.quantity } },
                    { session }
                );

                // Deduct Product Stock
                await Stock.findOneAndUpdate(
                    { product: item.product, type: item.productType },
                    { $inc: { quantity: -item.quantity } },
                    { session }
                );
            }

            // Delete associated history
            await StockHistory.deleteMany({ batch: oldBatch._id }).session(session);
        }

        // --- APPLY NEW IMPACTS ---

        // C. Validate and Deduct New Materials
        if (newData.usedMaterials && newData.usedMaterials.length > 0) {
            for (const item of newData.usedMaterials) {
                const material = await Material.findById(item.material).session(session);
                if (!material || material.stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${material?.name || 'Material'}`);
                }

                await Material.findByIdAndUpdate(
                    item.material,
                    { $inc: { stockQuantity: -item.quantity } },
                    { session }
                );
            }
        }

        // D. Validate and Deduct New Bottles & Increase New Product Stock
        if (newData.outputBreakdowns && newData.outputBreakdowns.length > 0) {
            for (const item of newData.outputBreakdowns) {
                const { product, productType, emptyBottle, quantity, notes } = item;

                if (!product || !quantity) continue;

                const bottle = await EmptyBottle.findById(emptyBottle).session(session);
                if (!bottle || bottle.quantity < quantity) {
                    throw new Error(`Insufficient bottles for ${productType}`);
                }

                // Deduct Bottles
                await EmptyBottle.findByIdAndUpdate(
                    emptyBottle,
                    { $inc: { quantity: -quantity } },
                    { session }
                );

                // Increase Product Stock
                let stock = await Stock.findOne({ product, type: productType }).session(session);
                if (!stock) {
                    stock = new Stock({
                        product,
                        type: productType,
                        bottle: emptyBottle,
                        quantity: 0,
                        batch: oldBatch._id,
                        date: newData.date || oldBatch.date
                    });
                }
                stock.quantity += Number(quantity);
                await stock.save({ session });

                // Create new History
                await StockHistory.create(
                    [
                        {
                            product,
                            type: productType,
                            action: "ADD",
                            quantity: Number(quantity),
                            notes: notes || `Updated from Batch ${oldBatch.batchCode}`,
                            date: newData.date || oldBatch.date,
                            bottle: emptyBottle,
                            batch: oldBatch._id
                        },
                    ],
                    { session }
                );
            }
        }

        // 2️⃣ Update Batch Record
        const updatedBatch = await Batch.findByIdAndUpdate(
            id,
            newData,
            { new: true, session }
        );

        await session.commitTransaction();
        session.endSession();

        res.json({
            success: true,
            message: "Batch updated & stocks recalculated successfully",
            batch: updatedBatch
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
};


export const deleteBatch = async (req, res) => {
    try {
        const batch = await Batch.findByIdAndDelete(req.params.id);

        if (!batch)
            return res.status(404).json({ message: "Batch not found" });

        res.json({ success: true, message: "Batch deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getBatches = async (req, res) => {
    try {
        const { batchCode } = req.query;

        if (batchCode) {
            const batch = await Batch.findOne({ batchCode: batchCode })
                .populate("usedMaterials.material", "name defaultUnit")
                .populate("outputBreakdowns.product", "name")
                .populate("outputBreakdowns.emptyBottle", "name type");

            return res.json({ success: true, batch });
        }

        const batches = await Batch.find()
            .populate("usedMaterials.material", "name defaultUnit")
            .populate("outputBreakdowns.product", "name")
            .populate("outputBreakdowns.emptyBottle", "name type")
            .sort({ createdAt: -1 });

        res.json({ success: true, batches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

