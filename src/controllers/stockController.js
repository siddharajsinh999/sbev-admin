// controllers/stockController.js
import Stock from "../models/Stock.js";
import StockHistory from "../models/StockHistory.js";
import EmptyBottle from "../models/EmptyBottle.js";

export const addStock = async (req, res) => {
    try {
        const {
            productId,
            type,
            quantity,
            notes,
            date,
            bottleId // 🔹 Empty bottle reference
        } = req.body;

        let image = null;
        if (req.file) {
            image = `/public/uploads/${req.file.filename}`;
        }

        const qty = Number(quantity);

        if (qty <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than 0" });
        }

        // 🧴 Find Empty Bottle
        const emptyBottle = await EmptyBottle.findById(bottleId);

        if (!emptyBottle) {
            return res.status(404).json({ message: "Empty bottle not found" });
        }

        // ❗ Type validation
        if (emptyBottle.type !== type) {
            return res.status(400).json({
                message: "Bottle type does not match stock type"
            });
        }

        // ❗ Quantity check
        if (emptyBottle.quantity < qty) {
            return res.status(400).json({
                message: `Only ${emptyBottle.quantity} empty bottles available`
            });
        }

        // 🔻 Deduct bottle quantity
        emptyBottle.quantity -= qty;
        await emptyBottle.save();

        // 📦 Find or create stock
        let stock = await Stock.findOne({ product: productId, type });

        if (!stock) {
            stock = new Stock({
                product: productId,
                type,
                bottle: bottleId, // 🔗 Attach bottle
                quantity: 0,
                image
            });
        }

        stock.quantity += qty;
        await stock.save();

        // 🧾 Stock history
        await StockHistory.create({
            product: productId,
            type,
            action: "ADD",
            quantity: qty,
            notes,
            date,
            bottle: bottleId
        });

        res.json({
            message: "Stock added & empty bottle deducted successfully",
            stock,
            remainingBottleQty: emptyBottle.quantity
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
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
