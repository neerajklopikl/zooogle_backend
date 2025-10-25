const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// FIX 1: Pass mongoose to the function
const AutoIncrement = require('mongoose-sequence')(mongoose);

const ItemSchema = new Schema({
  id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: true,
  },
  hsn_sac: {
    type: String,
    required: true,
  },
  gst_rate: {
    type: Number,
    required: true,
  },
  company_code: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

ItemSchema.plugin(AutoIncrement, {
  id: 'item_id_counter',
  inc_field: 'id'
});

// FIX 2: Add the unique index to match your database
ItemSchema.index({ company_code: 1, name: 1 }, { unique: true });

const Item = mongoose.model('Item', ItemSchema);

module.exports = Item;

