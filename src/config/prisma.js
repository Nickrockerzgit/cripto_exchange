// src/config/prisma.js
import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient
// This prevents multiple instances from being created
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use global to persist across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['error', 'warn'], // Only log errors and warnings in dev
    });
  }
  prisma = global.prisma;
}

export default prisma;
