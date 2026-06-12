import ActivityLog from '../models/ActivityLog.js';
import DatabaseService from './dbService.js';

export const logActivity = async (userId, action, message, performedBy = 'User', metadata = {}) => {
  return DatabaseService.create(ActivityLog, {
    userId,
    action,
    message,
    performedBy,
    metadata,
  });
};
