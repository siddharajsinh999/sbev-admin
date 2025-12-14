// controllers/stockController.js
import Stock from "../models/Stock.js";
import StockHistory from "../models/StockHistory.js";

export const addStock = async (req, res) => {
    try {
        const { productId, type, quantity, notes, date } = req.body;
        let image = null;
        if (req.file) {
            image = `/public/uploads/${req.file.filename}`;
        }

        let stock = await Stock.findOne({ product: productId, type });

        if (!stock) {
            stock = new Stock({ product: productId, type, quantity: 0, image });
        }

        stock.quantity += Number(quantity);
        await stock.save();

        await StockHistory.create({
            product: productId,
            type,
            action: "ADD",
            quantity,
            notes,
            date,
        });

        res.json({ message: "Stock added successfully", stock });

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
