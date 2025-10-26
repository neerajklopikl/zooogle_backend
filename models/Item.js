const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    salePrice: { type: Number, required: true },
    purchasePrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 }, // e.g., 18 for 18%
    hsnCode: { type: String, trim: true },
    // ... other item details
}, { timestamps: true });

// Pre-save hook to ensure ID is set
itemSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('Item', itemSchema);
