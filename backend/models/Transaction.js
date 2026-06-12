import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item ID is required'],
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'Other',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
    },
    unit: {
      type: String,
      default: 'pcs',
    },
    pricePerUnit: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    type: {
      type: String,
      enum: {
        values: ['added', 'consumed', 'expired', 'adjusted'],
        message: '{VALUE} is not a valid transaction type',
      },
      required: [true, 'Transaction type is required'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: total cost of this transaction
transactionSchema.virtual('totalCost').get(function () {
  return parseFloat((Math.abs(this.quantity) * this.pricePerUnit).toFixed(2));
});

// Virtual: human-readable type label
transactionSchema.virtual('typeLabel').get(function () {
  const labels = {
    added: '➕ Added',
    consumed: '🍽️ Consumed',
    expired: '⏰ Expired',
    adjusted: '🔧 Adjusted',
  };
  return labels[this.type] || this.type;
});

// Compound index: user + date for monthly spending reports
transactionSchema.index({ userId: 1, date: -1 });

// Compound index: user + category + date for category-wise spending
transactionSchema.index({ userId: 1, category: 1, date: -1 });

// Index: type for filtering by transaction kind
transactionSchema.index({ type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
