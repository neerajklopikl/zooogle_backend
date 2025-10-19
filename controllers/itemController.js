const Item = require('../models/Item');

// @desc    Get all items
// @route   GET /api/items
// @access  Public
exports.getItems = async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create an item
// @route   POST /api/items
// @access  Private
exports.createItem = async (req, res) => {
    try {
        const newItem = new Item(req.body);
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
