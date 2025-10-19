const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: {
        type: String,
        required: true,
        enum: ['customer', 'supplier']
    },
    gstin: { type: String, trim: true },
    // ... other party details like contact info, address, etc.
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);
