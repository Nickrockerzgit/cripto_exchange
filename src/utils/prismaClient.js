// src/utils/prismaClient.js
// ✅ SINGLETON: All services and controllers use this

export function getPrisma() {
  const globalForPrisma = globalThis;
  if (!globalForPrisma.prisma) {
    throw new Error(
      "PrismaClient singleton not initialized. " +
        "Ensure server.js initializes globalThis.prisma before importing any services.",
    );
  }
  return globalForPrisma.prisma;
}

// Export as default for convenience
export default { getPrisma };
