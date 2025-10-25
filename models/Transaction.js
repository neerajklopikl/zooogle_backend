const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// FIX: Pass mongoose to the function
const AutoIncrement = require('mongoose-sequence')(mongoose);

const TransactionSchema = new Schema({
  id: {
    type: Number,
    unique: true
  },
  date: {
    type: Date,
    required: true,
  },
  party: {
    type: Schema.Types.ObjectId,
    ref: 'Party',
    required: true,
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['Purchase', 'Sale', 'Service'],
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

TransactionSchema.plugin(AutoIncrement, {
  id: 'transaction_id_counter',
  inc_field: 'id'
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;

