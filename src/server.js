import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js'
import referralRoutes from './routes/referralRoutes.js'
import walletRoutes from './routes/walletRoutes.js'
import  startDepositJob  from './jobs/deposit.job.js';
import startDepositMatcherJob from "./jobs/depositMatcher.job.js";
import depositRoutes from "./routes/depositRoutes.js";
import { createWallet } from './controllers/createwallet.controller.js';
import robotRoutes from "./routes/robot.routes.js";

import startRobotActivationJob from "./jobs/robotActivation.job.js";
import adminDepositRoutes from "./routes/adminDeposit.routes.js";
import adminTransactionRoutes from "./routes/adminTransaction.routes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import investmentRoutes from './routes/investmentRoutes.js'
import withdrawalRoutes from './routes/withdrawalRoutes.js'
import transferRoutes from './routes/transferRoutes.js'
import cronJobs from './config/cronJobs.js'

const app = express();
const prisma = new PrismaClient();

// ────────────────────────────────────────────────
// Middlewares
// ────────────────────────────────────────────────

// CORS Configuration - Origins loaded from environment
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173']; // Fallback for development

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log for debugging which origin is failing
      console.error(`CORS Blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

// MANDATORY FIX: Use standard cors middleware for all routes including preflight
app.use(cors(corsOptions)); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/referrals', referralRoutes)
app.use('/api/investments', investmentRoutes)
app.use('/api/withdrawals', withdrawalRoutes)
app.use('/api/referrals',referralRoutes)
app.use("/api/wallet", walletRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/createwallet", createWallet);
app.use("/api/robot", robotRoutes);
app.use('/api/investments', investmentRoutes)
app.use('/api/withdrawals', withdrawalRoutes)
app.use('/api/transfers', transferRoutes)
app.use("/api/admin", adminDepositRoutes);
app.use("/api/admin", adminTransactionRoutes);
app.use("/api/admin", adminAuthRoutes);

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
    await prisma.$connect();
    console.log('✅ Database connected successfully (Prisma)');
  // 2️⃣ Start Deposit Scanner Job
    startDepositJob();
    startDepositMatcherJob();
    startRobotActivationJob();

    cronJobs.init();

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║      Server is running on port ${PORT}        ║
║      http://localhost:${PORT}                 ║
║                                               ║
║   → API Base: http://localhost:${PORT}/api    ║
║   → Health:   http://localhost:${PORT}/health ║
║                                               ║
╚═══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();

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