const express = require('express');
const router = express.Router();
// Import both controller functions
const { getHsnSacCodes, getHsnSacPdf } = require('../controllers/hsnSacController');

// This route serves the JSON data
router.get('/', getHsnSacCodes);

// This new route serves the PDF document
router.get('/pdf', getHsnSacPdf);

module.exports = router;