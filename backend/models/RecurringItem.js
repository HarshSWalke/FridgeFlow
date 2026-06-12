import mongoose from 'mongoose';

const recurringItemSchema = new mongoose.Schema(
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
      default: null,
    },
    name: {
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
      min: [0.1, 'Quantity must be at least 0.1'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
    },
    vendorId: {
      type: String,
      default: '',
    },
    frequency: {
      type: String,
      enum: {
        values: ['daily', 'every_2_days', 'weekly', 'biweekly', 'monthly'],
        message: '{VALUE} is not a valid frequency',
      },
      required: [true, 'Frequency is required'],
    },
    nextScheduledDate: {
      type: Date,
      required: [true, 'Next scheduled date is required'],
    },
    lastTriggered: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: whether this recurring item is due today
recurringItemSchema.virtual('isDueToday').get(function () {
  if (!this.isActive || !this.nextScheduledDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = new Date(this.nextScheduledDate);
  scheduled.setHours(0, 0, 0, 0);

  return scheduled <= today;
});

// Virtual: frequency label
recurringItemSchema.virtual('frequencyLabel').get(function () {
  const labels = {
    daily: 'Every day',
    every_2_days: 'Every 2 days',
    weekly: 'Every week',
    biweekly: 'Every 2 weeks',
    monthly: 'Every month',
  };
  return labels[this.frequency] || this.frequency;
});

// Index: active recurring items due for scheduling
recurringItemSchema.index({ userId: 1, isActive: 1, nextScheduledDate: 1 });

// Pre-save: compute nextScheduledDate when frequency or lastTriggered changes
recurringItemSchema.pre('save', function () {
  if (this.isModified('lastTriggered') && this.lastTriggered) {
    const base = new Date(this.lastTriggered);
    const frequencyDays = {
      daily: 1,
      every_2_days: 2,
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    };
    const days = frequencyDays[this.frequency] || 1;
    base.setDate(base.getDate() + days);
    this.nextScheduledDate = base;
  }
});

const RecurringItem = mongoose.model('RecurringItem', recurringItemSchema);
export default RecurringItem;
