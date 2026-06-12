import { Router } from 'express';
import mongoose from 'mongoose';
import DatabaseService from '../utils/dbService.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

/**
 * GET /api/health
 *
 * Database health-check endpoint.
 * Returns connection status, database name, and server status.
 */
router.get('/', (req, res) => {
  try {
    const dbStatus = DatabaseService.getConnectionStatus();

    const healthData = {
      server: 'running',
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus.status === 'connected',
        status: dbStatus.status,
        name: dbStatus.name,
        host: dbStatus.host,
      },
      environment: process.env.NODE_ENV || 'development',
      mongooseVersion: mongoose.version,
    };

    if (!healthData.database.connected) {
      return sendError(res, 'Database is not connected', 503, healthData);
    }

    return sendSuccess(res, healthData, 'FridgeFlow backend is healthy');
  } catch (error) {
    return sendError(res, 'Health check failed', 500, { error: error.message });
  }
});

export default router;
