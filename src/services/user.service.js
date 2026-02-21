// src/services/user.service.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient()

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  referral_count: true,
  referral_rank_id : true,
  created_at: false,
  is_email_verified: true,
  two_factor_enabled: true,
  lock_until:false,
  referral_code:true
};

// 🔹 Create User
async function createUser(data) {
  return await prisma.user.create({
    data,
    select: publicUserSelect
  });
}


// 🔹 Get All Users
async function getAllUsers() {
  return await prisma.user.findMany({
    select: publicUserSelect,
    orderBy: { created_at: 'desc' }
  });
}


// 🔹 Get Single User
async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect
  });
}


// 🔹 Update User
async function updateUser(id, data) {
  return await prisma.user.update({
    where: { id },
    data,
    select: publicUserSelect
  });
}


// 🔹 Delete User
async function deleteUser(id) {
  return await prisma.user.delete({
    where: { id }
  });
}


export {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
