import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Route imports
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import orderRoutes from './routes/orders.js';
import transactionRoutes from './routes/transactions.js';
import dashboardRoutes from './routes/dashboard.js';
import userRoutes from './routes/users.js';
import recurringRoutes from './routes/recurring.js';

// Load models so Mongoose registers schemas and creates indexes
import './models/index.js';

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// ──────────────────────────────────────
// Middleware
// ──────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS — allow frontend dev server
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Request logger (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  });
}

// ──────────────────────────────────────
// Routes
// ──────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recurring', recurringRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'FridgeFlow API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/health',
  });
});

// ──────────────────────────────────────
// Error Handling Middleware
// ──────────────────────────────────────

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    return res.status(409).json({
      success: false,
      message: `Duplicate value for: ${field}`,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for ${err.path}: ${err.value}`,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ──────────────────────────────────────
// Server Startup — DB first, then listen
// ──────────────────────────────────────
const startServer = async () => {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Start Express server only after DB connects
    app.listen(PORT, () => {
      console.log('');
      console.log('🧊 ═══════════════════════════════════════');
      console.log(`🧊  FridgeFlow API Server`);
      console.log(`🧊  Port:        ${PORT}`);
      console.log(`🧊  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🧊  Health:      http://localhost:${PORT}/api/health`);
      console.log('🧊 ═══════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('💥 Failed to start FridgeFlow server:', error.message);
    process.exit(1);
  }
};

// ──────────────────────────────────────
// Graceful Shutdown
// ──────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down FridgeFlow server...');
  const mongoose = (await import('mongoose')).default;
  await mongoose.connection.close();
  console.log('📦 MongoDB connection closed.');
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});

startServer();
