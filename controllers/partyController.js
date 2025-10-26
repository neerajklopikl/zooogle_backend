const Party = require('../models/Party');

// @desc    Get all parties for the current company
// @route   GET /api/parties
// @access  Private
exports.getParties = async (req, res) => {
    try {
        const { company_code } = req.user;
        const filter = req.query.type ? { type: req.query.type, company_code } : { company_code };
        const parties = await Party.find(filter);
        res.status(200).json(parties);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a party for the current company
// @route   POST /api/parties
// @access  Private
exports.createParty = async (req, res) => {
    try {
        const { company_code } = req.user;
        const newParty = new Party({
            ...req.body,
            company_code: company_code
        });
        const savedParty = await newParty.save();
        res.status(201).json(savedParty);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
