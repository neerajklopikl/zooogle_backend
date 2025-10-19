const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    salePrice: { type: Number, required: true },
    purchasePrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 }, // e.g., 18 for 18%
    hsnCode: { type: String, trim: true },
    // ... other item details
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
