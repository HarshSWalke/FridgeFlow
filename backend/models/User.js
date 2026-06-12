import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password by default in queries
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^\d{10}$/, 'Mobile number must be exactly 10 digits'],
    },
    countryCode: {
      type: String,
      default: '+91',
    },
    familySize: {
      type: String,
      enum: ['1', '2', '3', '4', '5+'],
      default: '3',
    },
    language: {
      type: String,
      enum: ['English', 'Hindi'],
      default: 'English',
    },
    vendors: [
      {
        name: { type: String, trim: true },
        contact: { type: String },
        category: { type: String },
        emoji: { type: String, default: '🛒' },
      },
    ],
    budget: {
      type: Number,
      default: 0,
      min: [0, 'Budget cannot be negative'],
    },
    notificationPrefs: {
      dailySummary: { type: Boolean, default: true },
      summaryTime: { type: String, default: '08:00' },
      expiryAlerts: { type: String, enum: ['1', '2'], default: '1' },
      lowStockAlerts: { type: Boolean, default: true },
      reorderReminders: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: full mobile number with country code
userSchema.virtual('fullMobile').get(function () {
  return `${this.countryCode}${this.mobile}`;
});

// Virtual: vendor count
userSchema.virtual('vendorCount').get(function () {
  return this.vendors ? this.vendors.length : 0;
});

// Index for fast email lookups during auth
// Unique index declared on the `email` path already (via `unique: true`).
// Avoid creating a duplicate index here to prevent Mongoose warnings.

// Pre-save: trim name
userSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
});

const User = mongoose.model('User', userSchema);
export default User;
