// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// export const submitDeposit = async (req, res) => {
//   try {

//     const { tx_hash, amount } = req.body;
//     const userId = req.user.id;

//     if (!tx_hash || !amount) {
//       return res.status(400).json({
//         success: false,
//         message: "TX hash and amount required"
//       });
//     }

//     const exists = await prisma.depositSubmission.findUnique({
//       where: { tx_hash }
//     });

//     if (exists) {
//       return res.status(400).json({
//         success: false,
//         message: "Transaction already submitted"
//       });
//     }

//     await prisma.depositSubmission.create({
//       data: {
//         user_id: userId,
//         amount,
//         tx_hash,
//         status: "PENDING"
//       }
//     });

//     return res.json({
//       success: true,
//       message: "Deposit submitted successfully"
//     });

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const submitDeposit = async (req, res) => {
  try {

    const { tx_hash, deposite_address, amount, user_id } = req.body;

    if (!tx_hash || !amount || !user_id || !deposite_address) {
      return res.status(400).json({
        success: false,
        message: "tx_hash, deposite_address, amount and user_id required"
      });
    }

    const exists = await prisma.depositSubmission.findUnique({
      where: { tx_hash }
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Transaction already submitted"
      });
    }

    const submission = await prisma.depositSubmission.create({
      data: {
        user_id,
        amount,
        deposit_address: deposite_address,
        tx_hash,
        status: "PENDING"
      }
    });

    return res.json({
      success: true,
      message: "Deposit submitted successfully",
      submission
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};