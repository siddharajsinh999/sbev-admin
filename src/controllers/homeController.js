const Product = require("../models/Product");
const EmptyBottle = require("../models/EmptyBottle");
const Batch = require("../models/Batch").default;
const Stock = require("../models/Stock").default;

exports.dashboardSummary = async (req, res) => {
    try {
        // Run all queries in parallel (FAST)
        const [
            totalProduct,
            emptyBottleResult,
            outputKgResult,
            stockResult
        ] = await Promise.all([
            Product.countDocuments(),

            EmptyBottle.aggregate([
                {
                    $group: {
                        _id: null,
                        totalQuantity: { $sum: "$quantity" }
                    }
                }
            ]),

            Batch.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOutputKg: { $sum: "$outputKg" }
                    }
                }
            ]),

            Stock.aggregate([
                {
                    $group: {
                        _id: null,
                        totalStockQuantity: { $sum: "$quantity" }
                    }
                }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalProducts: totalProduct,
                totalEmptyBottles: emptyBottleResult[0]?.totalQuantity || 0,
                totalOutputKg: outputKgResult[0]?.totalOutputKg || 0,
                totalStockQuantity: stockResult[0]?.totalStockQuantity || 0
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
