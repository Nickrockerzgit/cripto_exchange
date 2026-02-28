import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js'
import referralRoutes from './routes/referralRoutes.js'
import investmentRoutes from './routes/investmentRoutes.js'
import withdrawalRoutes from './routes/withdrawalRoutes.js'
import cronJobs from './config/cronJobs.js'
// Agar aur routes banaye honge to yaha import kar dena
// const userRoutes = require('./routes/userRoutes');
// const walletRoutes = require('./routes/walletRoutes');

const app = express();
const prisma = new PrismaClient();

// ────────────────────────────────────────────────
// Middlewares
// ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging (development mein helpful)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/referrals',referralRoutes)
app.use('/api/investments', investmentRoutes)
app.use('/api/withdrawals', withdrawalRoutes)
// app.use('/api/wallets', walletRoutes);
// app.use('/api/transactions', transactionRoutes);
// ... baaki routes yaha add karte jana

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ────────────────────────────────────────────────
// Server Start
// ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Prisma connection check
    await prisma.$connect();
    console.log('✅ Database connected successfully (Prisma)');

    // Initialize cron jobs
    cronJobs.init();

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║      Server is running on port ${PORT}      ║
║      http://localhost:${PORT}               ║
║                                            ║
║   → API Base: http://localhost:${PORT}/api  ║
║   → Health:   http://localhost:${PORT}/health║
║                                            ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing server...');
  await prisma.$disconnect();
  process.exit(0);
});