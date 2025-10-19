const express = require('express');
const router = express.Router();
const { getItems, createItem } = require('../controllers/itemController');

router.route('/').get(getItems).post(createItem);

module.exports = router;
