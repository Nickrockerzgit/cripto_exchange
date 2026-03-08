// src/services/user.service.js
// ⚠️ DO NOT create a new PrismaClient here!
// Instead, use the global singleton initialized in server.js

// Lazy-load to avoid initialization order issues
function getPrisma() {
  const globalForPrisma = globalThis;
  if (!globalForPrisma.prisma) {
    throw new Error(
      "PrismaClient singleton not initialized. Ensure server.js initializes it first.",
    );
  }
  return globalForPrisma.prisma;
}

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  referral_count: true,
  referral_rank_id: true,
  created_at: false,
  is_email_verified: true,
  two_factor_enabled: true,
  lock_until: false,
  referral_code: true,
};

// 🔹 Create User
async function createUser(data) {
  const prisma = getPrisma();
  return await prisma.user.create({
    data,
    select: publicUserSelect,
  });
}

// 🔹 Get All Users
async function getAllUsers() {
  const prisma = getPrisma();
  return await prisma.user.findMany({
    select: publicUserSelect,
    orderBy: { created_at: "desc" },
  });
}

// 🔹 Get Single User
async function getUserById(id) {
  const prisma = getPrisma();
  return await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
}

// 🔹 Update User
async function updateUser(id, data) {
  const prisma = getPrisma();
  return await prisma.user.update({
    where: { id },
    data,
    select: publicUserSelect,
  });
}

// 🔹 Delete User
async function deleteUser(id) {
  const prisma = getPrisma();
  return await prisma.user.delete({
    where: { id },
  });
}

export { createUser, getAllUsers, getUserById, updateUser, deleteUser };
