const Party = require('../models/Party');

// @desc    Get all parties, optionally filtered by type
// @route   GET /api/parties
// @access  Public
exports.getParties = async (req, res) => {
    try {
        const filter = req.query.type ? { type: req.query.type } : {};
        const parties = await Party.find(filter);
        res.status(200).json(parties);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a party
// @route   POST /api/parties
// @access  Private
exports.createParty = async (req, res) => {
    try {
        const newParty = new Party(req.body);
        const savedParty = await newParty.save();
        res.status(201).json(savedParty);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
