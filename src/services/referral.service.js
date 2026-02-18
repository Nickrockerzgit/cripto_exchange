// src/services/referral.service.js
import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔹 Create refreal
async function createReferral(data) {
  return await prisma.referral.create({
    data
  });
}
// 🔹 Get All refrealls
async function getAllUsersRef() {
  return await prisma.referral.findMany({
    orderBy: { created_at: 'desc' }
  });
}

export  {
  getAllUsersRef,
  createReferral
};
