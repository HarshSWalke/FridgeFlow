import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    action: {
      type: String,
      enum: [
        'item_added',
        'item_edited',
        'item_removed',
        'item_finished',
        'item_expired',
        'order_sent',
        'order_confirmed',
        'vendor_added',
        'vendor_removed',
        'user_login',
        'user_logout',
        'user_signup',
        'settings_updated',
        'threshold_updated',
        'budget_updated',
        'system',
      ],
      required: [true, 'Action type is required'],
    },
    message: {
      type: String,
      required: [true, 'Log message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
      type: String,
      default: 'User',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: human-readable time ago (computed at query time)
activityLogSchema.virtual('timeAgo').get(function () {
  if (!this.createdAt) return 'Unknown';

  const now = new Date();
  const diff = now - this.createdAt;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return this.createdAt.toLocaleDateString();
});

// Compound index: user + createdAt for chronological feed (last 10)
activityLogSchema.index({ userId: 1, createdAt: -1 });

// Index: action type for filtering
activityLogSchema.index({ action: 1 });

// Auto-expire old logs after 90 days (TTL index)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
