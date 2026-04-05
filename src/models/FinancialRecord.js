const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, trim: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

// Soft delete filter
recordSchema.pre(/^find/, function() {
  this.where({ deletedAt: null });
});

module.exports = mongoose.model('FinancialRecord', recordSchema);