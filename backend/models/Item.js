import mongoose from 'mongoose';

const CATEGORIES = [
  'Dairy',
  'Vegetables',
  'Fruits',
  'Dry Goods',
  'Beverages',
  'Snacks',
  'Leftovers',
  'Other',
];

const UNITS = ['kg', 'g', 'L', 'mL', 'pcs', 'packets', 'bottles'];

const itemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: {
        values: UNITS,
        message: '{VALUE} is not a valid unit',
      },
    },
    threshold: {
      type: Number,
      default: 0,
      min: [0, 'Threshold cannot be negative'],
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    pricePerUnit: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    addedBy: {
      type: String,
      default: 'User',
      trim: true,
    },
    vendorId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: freshness status based on expiry date
itemSchema.virtual('freshness').get(function () {
  if (!this.expiryDate) return 'fresh'; // No expiry → always fresh

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(this.expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'expiring';
  return 'fresh';
});

// Virtual: stock status based on threshold
itemSchema.virtual('stockStatus').get(function () {
  if (this.quantity <= 0) return 'finished';
  if (this.quantity <= this.threshold) return 'low';
  return 'sufficient';
});

// Virtual: total value (quantity × pricePerUnit)
itemSchema.virtual('totalValue').get(function () {
  return parseFloat((this.quantity * this.pricePerUnit).toFixed(2));
});

// Compound index: user + category for filtered fridge views
itemSchema.index({ userId: 1, category: 1 });

// Index: expiry date for expiring-soon queries
itemSchema.index({ expiryDate: 1 });

// Index: quantity + threshold for low-stock detection
itemSchema.index({ userId: 1, quantity: 1, threshold: 1 });

// Pre-save: auto-set dateAdded if not provided
itemSchema.pre('save', function () {
  if (this.isNew && !this.dateAdded) {
    this.dateAdded = new Date();
  }
});

const Item = mongoose.model('Item', itemSchema);
export default Item;
