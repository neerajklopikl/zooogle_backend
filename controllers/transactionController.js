const Transaction = require('../models/Transaction');
const Item = require('../models/Item');
const Party = require('../models/Party');
const Counter = require('../models/Counter'); // <-- NEW: Import the counter
const mongoose = require('mongoose');

// --- NEW: Atomic Counter Function ---
async function getNextSequenceValue(sequenceName) {
    const sequenceDocument = await Counter.findByIdAndUpdate(
        sequenceName, 
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true } // `new` returns the updated doc, `upsert` creates it if it doesn't exist
    );
    return sequenceDocument.sequence_value;
}

// --- UPDATED: To use the new atomic counter ---
exports.getNextTransactionNumber = async (req, res) => {
    try {
        const { type } = req.params;
        const { company_code } = req.user;

        // The sequence name is a combination of the company and transaction type
        const sequenceName = `${type}_${company_code}`;

        const nextNumber = await getNextSequenceValue(sequenceName);

        res.status(200).json({ nextNumber: nextNumber.toString() });

    } catch (error) {
        console.error('Error getting next transaction number:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- The rest of your controller remains largely the same, but does not need to handle number generation ---

exports.createTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { type, partyId, items, ...otherDetails } = req.body;
        const { company_code } = req.user;

        // The transaction number is now expected to be correct from the frontend
        if (!type || !otherDetails.totalAmount || !otherDetails.transactionNumber) {
             return res.status(400).json({ message: 'Client error: transactionNumber is missing.' });
        }

        const newTransaction = new Transaction({
            ...otherDetails,
            type,
            party: partyId,
            company_code,
            items: [],
        });

        if (items && items.length > 0) {
            for (const transactionItem of items) {
                let item = await Item.findOne({ name: transactionItem.name, company_code }).session(session);
                if (!item) {
                    item = new Item({
                        name: transactionItem.name,
                        company_code: company_code,
                        salePrice: transactionItem.rate,
                    });
                    await item.save({ session });
                }
                newTransaction.items.push({
                    item: item._id,
                    quantity: transactionItem.quantity,
                    rate: transactionItem.rate,
                });
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

exports.updateTransaction = async (req, res) => {
    try {
        const { company_code } = req.user;
        const updatedTransaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, company_code }, 
            req.body, 
            { new: true }
        );
        if (!updatedTransaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.status(200).json(updatedTransaction);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const { company_code } = req.user;
        const deletedTransaction = await Transaction.findOneAndDelete({ _id: req.params.id, company_code });
        if (!deletedTransaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
