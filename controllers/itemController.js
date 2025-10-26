const Item = require('../models/Item');

// @desc    Get all items for the current company
// @route   GET /api/items
// @access  Private
exports.getItems = async (req, res) => {
    try {
        const { company_code } = req.user;
        const items = await Item.find({ company_code });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create an item for the current company
// @route   POST /api/items
// @access  Private
exports.createItem = async (req, res) => {
    try {
        const { company_code } = req.user;
        const newItem = new Item({
            ...req.body,
            company_code: company_code
        });
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
