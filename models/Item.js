const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    company_code: {
        type: String,
        required: true,
    },
    name: { type: String, required: true, trim: true },
    salePrice: { type: Number, required: true },
    purchasePrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 }, // e.g., 18 for 18%
    hsnCode: { type: String, trim: true },
}, { timestamps: true });

// This index enforces that the combination of company_code and name is unique.
itemSchema.index({ company_code: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Item', itemSchema);
