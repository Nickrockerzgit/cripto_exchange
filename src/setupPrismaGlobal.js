// src/setupPrismaGlobal.js
// This file MUST be imported FIRST before any services/controllers

export function setupPrismaGlobal(prismaInstance) {
  if (!globalThis.prisma) {
    globalThis.prisma = prismaInstance;
    console.log("✅ Global PrismaClient singleton configured");
  }
  return globalThis.prisma;
}
