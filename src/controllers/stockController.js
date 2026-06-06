// controllers/stockController.js
import Stock from "../models/Stock.js";
import StockHistory from "../models/StockHistory.js";
import EmptyBottle from "../models/EmptyBottle.js";
import Batch from "../models/Batch.js";
import mongoose from "mongoose";

import ExcelJS from "exceljs";



export const addStock = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            productId,
            type,
            quantity,
            notes,
            date,
            bottleId, // 🔹 Empty bottle reference
            batch // 🔹 Optional Batch reference
        } = req.body;

        let image = null;
        if (req.file) {
            image = `/public/uploads/${req.file.filename}`;
        }

        const qty = Number(quantity);

        if (qty <= 0) {
            throw new Error("Quantity must be greater than 0");
        }

        // 🧴 Find Empty Bottle
        const emptyBottle = await EmptyBottle.findById(bottleId).session(session);

        if (!emptyBottle) {
            throw new Error("Empty bottle not found");
        }

        // ❗ Type validation
        if (emptyBottle.type !== type) {
            throw new Error("Bottle type does not match stock type");
        }

        // ❗ Quantity check
        if (emptyBottle.quantity < qty) {
            throw new Error(`Only ${emptyBottle.quantity} empty bottles available`);
        }

        // 🔻 Deduct bottle quantity
        emptyBottle.quantity -= qty;
        await emptyBottle.save({ session });

        // 📦 Find or create stock
        let stock = await Stock.findOne({ product: productId, type }).session(session);

        if (!stock) {
            stock = new Stock({
                product: productId,
                type,
                bottle: bottleId, // 🔗 Attach bottle
                quantity: 0,
                image,
                batch: batch || null
            });
        } else if (batch) {
            stock.batch = batch;
        }

        stock.quantity += qty;
        await stock.save({ session });

        // 🧾 Stock history
        const history = await StockHistory.create(
            [
                {
                    product: productId,
                    type,
                    action: "ADD",
                    quantity: qty,
                    notes,
                    date: date || new Date(),
                    bottle: bottleId,
                    batch: batch || null
                },
            ],
            { session }
        );

        const stockHistoryId = history[0]._id;

        // 🔗 Sync with Batch Output Breakdown
        if (batch) {
            const batchDoc = await Batch.findById(batch).session(session);
            if (batchDoc) {
                batchDoc.outputBreakdowns.push({
                    product: productId,
                    productType: type,
                    emptyBottle: bottleId,
                    quantity: qty,
                    notes: notes || "Added manually via Stock Module",
                    stockHistory: stockHistoryId
                });
                await batchDoc.save({ session });
            }
        }

        await session.commitTransaction();
        session.endSession();

        res.json({
            success: true,
            message: "Stock added & batch production history updated successfully",
            stock,
            remainingBottleQty: emptyBottle.quantity
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
};


export const dispatchStock = async (req, res) => {
    try {
        const { productId, type, quantity, customer, notes, date } = req.body;

        const stock = await Stock.findOne({ product: productId, type });

        if (!stock || stock.quantity < quantity) {
            return res.status(400).json({ message: "Not enough stock available" });
        }

        stock.quantity -= Number(quantity);
        await stock.save();

        await StockHistory.create({
            product: productId,
            type,
            action: "DISPATCH",
            quantity,
            notes,
            customer,
            date
        });

        res.json({ message: "Stock dispatched successfully", stock });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const getAllStock = async (req, res) => {
    const stock = await Stock.find().populate("product");

    res.json(stock);
};

export const getStockHistory = async (req, res) => {
    const { productId } = req.params;
    const { type } = req.query

    const history = await StockHistory
        .find({ product: productId, type })
        .sort({ date: -1 });

    res.json(history);
};

export const exportStockExcel = async (req, res) => {
  try {
    const stocks = await Stock.find().populate("product");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Stock List");

    // Define columns
    worksheet.columns = [
      { header: "Product Name", key: "productName", width: 30 },
      { header: "Type", key: "type", width: 15 },
      { header: "Quantity", key: "quantity", width: 15 },
    ];

    // Add rows
    stocks.forEach(stock => {
      worksheet.addRow({
        productName: stock.product?.name || "",
        type: stock.type,
        quantity: stock.quantity,
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=stock-report.xlsx"
    );

    // Send file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to export stock" });
  }
};
