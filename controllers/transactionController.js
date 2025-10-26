const Transaction = require('../models/Transaction');
const Item = require('../models/Item');
const Party = require('../models/Party');
const mongoose = require('mongoose');

// Get the next transaction number
exports.getNextTransactionNumber = async (req, res) => {
    try {
        const { type } = req.params;
        const { company_code } = req.user;
        
        const lastTransaction = await Transaction.findOne({ type, company_code })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastTransaction && lastTransaction.transactionNumber) {
            const lastNum = parseInt(lastTransaction.transactionNumber, 10);
            if (!isNaN(lastNum)) {
                nextNumber = lastNum + 1;
            }
        }
        res.status(200).json({ nextNumber: nextNumber.toString() });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { type, partyId, items, ...otherDetails } = req.body;
        const { company_code } = req.user;

        const newTransaction = new Transaction({
            ...otherDetails,
            type,
            party: partyId,
            company_code,
            items: [], // Items will be processed and added below
        });

        if (items && items.length > 0) {
            for (const transactionItem of items) {
                // Create or find item scoped to the company
                let item = await Item.findOne({ name: transactionItem.name, company_code }).session(session);
                if (!item) {
                    item = new Item({
                        name: transactionItem.name,
                        company_code: company_code,
                        salePrice: transactionItem.rate, // Assuming rate is sale price
                        // ... other item fields you might want to set
                    });
                    await item.save({ session });
                }

                newTransaction.items.push({
                    item: item._id,
                    quantity: transactionItem.quantity,
                    rate: transactionItem.rate,
                    // ... any other line-item specific fields
                });

                // Update stock
                const stockChange = (type === 'sale' || type === 'purchaseReturn') ? -transactionItem.quantity : transactionItem.quantity;
                await Item.findByIdAndUpdate(item._id, { $inc: { stock: stockChange } }, { session });
            }
        }

        await newTransaction.save({ session });
        await session.commitTransaction();
        res.status(201).json(newTransaction);

    } catch (error) {
        await session.abortTransaction();
        console.error('Create Transaction Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    } finally {
        session.endSession();
    }
};

// Get all transactions for the company
exports.getAllTransactions = async (req, res) => {
    try {
        const { company_code } = req.user;
        const transactions = await Transaction.find({ company_code })
            .populate('party', 'name')
            .populate('items.item', 'name');
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get a single transaction
exports.getTransactionById = async (req, res) => {
    try {
        const { company_code } = req.user;
        const transaction = await Transaction.findOne({ _id: req.params.id, company_code })
            .populate('party').populate('items.item');
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.status(200).json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// ... other controller functions (update, delete) would also need to be updated
// to be company-aware in a similar fashion.
