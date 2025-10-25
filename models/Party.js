const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// FIX 1: Pass mongoose to the function
const AutoIncrement = require('mongoose-sequence')(mongoose);

const PartySchema = new Schema({
  id: {
    type: Number,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  gstin: {
    type: String,
  },
  phone: {
    type: String,
  },
  company_code: {
    type: String,
    required: true,
  }
}, {
  timestamps: true,
  versionKey: false,
});

PartySchema.plugin(AutoIncrement, {
  id: 'party_id_counter',
  inc_field: 'id'
});

// FIX 2: Add the unique index to match your database
PartySchema.index({ company_code: 1, name: 1 }, { unique: true });

const Party = mongoose.model('Party', PartySchema);

module.exports = Party;

