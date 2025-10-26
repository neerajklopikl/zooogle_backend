// zooogle_backend/controllers/transactionController.js

const Transaction = require('../models/Transaction');
const Item = require('../models/Item');
const Party = require('../models/Party');
const mongoose = require('mongoose');

/**
 * @desc    Create a new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
exports.createTransaction = async (req, res) => {
    const companyStateCode = process.env.COMPANY_STATE_CODE;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { type, partyId, items, ...otherDetails } = req.body;

        if (!type || !otherDetails.totalAmount || !otherDetails.transactionNumber) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Missing required fields: type, totalAmount, and transactionNumber are required.' });
        }

        let partyGstin = null;
        let partyStateCode = null;
        if (partyId) {
            const party = await Party.findById(partyId).session(session);
            if (party) {
                partyGstin = party.gstin;
                if (party.gstin && party.gstin.length >= 2) {
                    partyStateCode = party.gstin.substring(0, 2);
                }
            }
        }

        const enrichedItems = [];
        if (items && items.length > 0) {
            for (const transactionItem of items) {
                let itemDetails;
                let itemId;

                if (transactionItem.name && !transactionItem.item) {
                    const newItem = new Item({
                        name: transactionItem.name,
                        category: transactionItem.category || null,
                        itemCode: transactionItem.itemCode || null,
                        salePrice: transactionItem.rate,
                        purchasePrice: transactionItem.rate,
                        taxType: transactionItem.taxType || 'Without Tax',
                        gstRate: transactionItem.gstRate || 0,
                        stock: 0, 
                        unit: transactionItem.unit,
                        hsnCode: transactionItem.hsnCode || null,
                    });
                    const savedNewItem = await newItem.save({ session });
                    itemDetails = savedNewItem;
                    itemId = savedNewItem._id;
                } else if (transactionItem.item) {
                    itemId = transactionItem.item;
                    itemDetails = await Item.findById(itemId).session(session);
                    if (!itemDetails) {
                        throw new Error(`Item with ID ${itemId} not found.`);
                    }
                } else {
                     throw new Error('Item data is malformed. It must have an existing "item" ID or a "name" for a new item.');
                }

                const taxableValue = transactionItem.quantity * transactionItem.rate;
                const totalTax = taxableValue * (itemDetails.gstRate / 100);
                let cgst = 0;
                let sgst = 0;
                let igst = 0;

                if (companyStateCode && partyStateCode && companyStateCode === partyStateCode) {
                    cgst = totalTax / 2;
                    sgst = totalTax / 2;
                } else {
                    igst = totalTax;
                }
                
                enrichedItems.push({
                    ...transactionItem,
                    item: itemId, 
                    gstRate: itemDetails.gstRate,
                    hsnCode: itemDetails.hsnCode,
                    taxableValue: taxableValue, 
                    cgst: cgst,                 
                    sgst: sgst,                 
                    igst: igst                  
                });
            }
        }

        const newTransaction = new Transaction({
            type,
            party: partyId,
            partyGstin: partyGstin,
            items: enrichedItems,
            ...otherDetails
        });

        const savedTransaction = await newTransaction.save({ session });

        if (enrichedItems.length > 0 && (type === 'sale' || type === 'purchase')) {
            for (const transactionItem of enrichedItems) {
                const stockChange = (type === 'sale' || type === 'purchaseReturn') ? -transactionItem.quantity : transactionItem.quantity;
                await Item.findByIdAndUpdate(transactionItem.item, { $inc: { stock: stockChange } }, { session });
            }
        }

        await session.commitTransaction();
        res.status(201).json(savedTransaction);

    } catch (error) {
        await session.abortTransaction();
        console.error('Transaction Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    } finally {
        session.endSession();
    }
};


/**
 * @desc    Get all transactions with filtering
 * @route   GET /api/transactions
 * @access  Private
 */
exports.getAllTransactions = async (req, res) => {
    try {
        const { type, partyId, startDate, endDate } = req.query;
        let query = {};

        if (type) query.type = { $in: type.split(',') };
        if (partyId) query.party = partyId;
        if (startDate || endDate) {
            query.transactionDate = {};
            if (startDate) query.transactionDate.$gte = new Date(startDate);
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                query.transactionDate.$lte = endOfDay;
            }
        }

        const transactions = await Transaction.find(query)
            .populate('party', 'name gstin')
            .populate('items.item', 'name hsnCode gstRate')
            .sort({ transactionDate: -1, createdAt: -1 });

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Get a single transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id).populate('party').populate('items.item');
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.status(200).json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Update a transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
exports.updateTransaction = async (req, res) => {
    try {
        const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTransaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.status(200).json(updatedTransaction);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Delete a transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
exports.deleteTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const transaction = await Transaction.findById(req.params.id).session(session);

        if (!transaction) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.items && transaction.items.length > 0) {
            for (const transactionItem of transaction.items) {
                const stockChange = (transaction.type === 'sale' || transaction.type === 'purchaseReturn') ? transactionItem.quantity : -transactionItem.quantity;
                await Item.findByIdAndUpdate(transactionItem.item, { $inc: { stock: stockChange } }, { session });
            }
        }

        await transaction.deleteOne({ session });
        await session.commitTransaction();
        res.status(200).json({ message: 'Transaction removed successfully' });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Server Error' });
    } finally {
        session.endSession();
    }
};

/**
 * @desc    Convert a Quotation (Estimate) to a Sale (Invoice)
 * @route   POST /api/transactions/:id/convert
 * @access  Private
 */
exports.convertQuotationToInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const quotation = await Transaction.findById(req.params.id).session(session);

        if (!quotation) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Quotation not found' });
        }
        if (quotation.type !== 'estimate') {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Only estimates (quotations) can be converted.' });
        }
        if (quotation.status === 'Invoiced') {
            await session.abortTransaction();
            return res.status(400).json({ message: 'This quotation has already been converted to an invoice.' });
        }

        const newInvoice = new Transaction({
            ...quotation.toObject(),
            _id: new mongoose.Types.ObjectId(),
            type: 'sale',
            status: 'Draft',
            transactionNumber: `INV-${Date.now()}`,
            convertedFrom: quotation._id,
            transactionDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await newInvoice.save({ session });
        
        if (newInvoice.items && newInvoice.items.length > 0) {
             for (const transactionItem of newInvoice.items) {
                const stockChange = -transactionItem.quantity; 
                await Item.findByIdAndUpdate(transactionItem.item, { $inc: { stock: stockChange } }, { session });
            }
        }

        quotation.status = 'Invoiced';
        await quotation.save({ session });

        await session.commitTransaction();
        res.status(201).json(newInvoice);

    } catch (error) {
        await session.abortTransaction();
        console.error('Conversion Error:', error);
        res.status(500).json({ message: 'Server Error during conversion' });
    } finally {
        session.endSession();
    }
};