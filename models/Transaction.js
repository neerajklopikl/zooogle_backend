const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Party = require('./Party'); // Import Party model to find party name

// Sub-schema for items in an invoice
const invoiceLineItemSchema = new mongoose.Schema({
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' }, // Link to Item model
    itemName: { type: String, required: true }, // Store item name for quick access
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    rate: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxableValue: { type: Number, required: true },
    taxDetails: {
        // Store tax details if needed
        gstRate: { type: Number, default: 0 },
        cgst: { type: Number, default: 0 },
        sgst: { type: Number, default: 0 },
        igst: { type: Number, default: 0 },
    },
    total: { type: Number, required: true },
});

// Main transaction schema
const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: [
            'sale', 'purchase', 'saleReturn', 'purchaseReturn', 
            'paymentIn', 'paymentOut', 'expense', 
            'estimate', 'saleOrder', 'purchaseOrder',
            'deliveryChallan', 'proformaInvoice', 'creditNote', 'debitNote'
        ]
    },
    transactionNumber: { type: String }, // User-facing number (e.g., INV-001)
    transactionId: { type: Number, unique: true }, // Internal auto-incrementing ID
    party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' },
    partyName: { type: String }, // Denormalized field for faster report generation
    
    // Dates
    date: { type: Date, default: Date.now, required: true },
    dueDate: { type: Date },

    // Item Details (for item-based transactions)
    items: [invoiceLineItemSchema],

    // Financials
    subTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },

    // Status & Payment
    paymentType: { type: String, enum: ['cash', 'credit', 'bank'], default: 'cash' },
    status: { type: String, default: 'unpaid' }, // e.g., 'unpaid', 'paid', 'partiallyPaid', 'draft'

    // References (for linking transactions)
    originalInvoiceNumber: { type: String }, // For returns
    originalInvoiceDate: { type: Date },     // For returns
    poNumber: { type: String },             // For Sale/Purchase
    poDate: { type: Date },                 // For Sale/Purchase
    eWayBillNumber: { type: String },
    
    // Other Details
    notes: { type: String },
    termsAndConditions: { type: String },
    phoneNumber: { type: String }, // Added from create_transaction_screen

}, { timestamps: true }); // Adds createdAt and updatedAt

// Plugin for auto-incrementing transactionId (internal)
transactionSchema.plugin(AutoIncrement, { inc_field: 'transactionId' });

// --- THIS IS THE FIX ---
// Middleware to automatically populate partyName before saving
transactionSchema.pre('save', async function(next) {
    if (this.isModified('party') && this.party) {
        try {
            const party = await Party.findById(this.party);
            if (party) {
                this.partyName = party.name; // <-- CORRECTED: Was party.partyName
            } else {
                this.partyName = undefined; // Handle case where party is not found
            }
        } catch (error) {
            console.error('Error fetching party details in pre-save hook:', error);
            // Don't block save operation, but log the error
        }
    }
    
    // Calculate balance due
    if (this.isModified('totalAmount') || this.isModified('amountPaid')) {
        this.balanceDue = this.totalAmount - this.amountPaid;
    }

    // Update status based on balance
    if (this.balanceDue <= 0) {
        this.status = 'paid';
    } else if (this.balanceDue > 0 && this.amountPaid > 0) {
        this.status = 'partiallyPaid';
    } else {
        this.status = 'unpaid';
    }
    
    next();
});
// --- END OF FIX ---

module.exports = mongoose.model('Transaction', transactionSchema);
