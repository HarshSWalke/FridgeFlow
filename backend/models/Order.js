import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.1 },
    unit: { type: String, required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    vendorId: {
      type: String,
      required: [true, 'Vendor ID is required'],
    },
    vendorName: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
    },
    vendorContact: {
      type: String,
      default: '',
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'confirmed', 'delivered', 'cancelled'],
      default: 'pending',
    },
    messageText: {
      type: String,
      default: '',
    },
    dateSent: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: item count in this order
orderSchema.virtual('itemCount').get(function () {
  return this.items ? this.items.length : 0;
});

// Virtual: human-readable status label
orderSchema.virtual('statusLabel').get(function () {
  const labels = {
    pending: '⏳ Pending',
    sent: '📤 Sent',
    confirmed: '✅ Confirmed',
    delivered: '📦 Delivered',
    cancelled: '❌ Cancelled',
  };
  return labels[this.status] || this.status;
});

// Index: user + status for filtered order views
orderSchema.index({ userId: 1, status: 1 });

// Index: dateSent for order history chronological queries
orderSchema.index({ dateSent: -1 });

// Pre-save: set dateSent when status changes to 'sent'
orderSchema.pre('save', function () {
  if (this.isModified('status') && this.status === 'sent' && !this.dateSent) {
    this.dateSent = new Date();
  }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
