const express = require('express');
const router = express.Router();

const { 
    createTransaction, 
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    convertQuotationToInvoice 
} = require('../controllers/transactionController');

// Routes for getting all transactions and creating a new one
router.route('/')
    .post(createTransaction)
    .get(getAllTransactions);

// Route to convert a quotation to an invoice
router.route('/:id/convert').post(convertQuotationToInvoice);

// Routes for a single transaction (get, update, delete)
router.route('/:id')
    .get(getTransactionById)
    .put(updateTransaction)
    .delete(deleteTransaction);

module.exports = router;
