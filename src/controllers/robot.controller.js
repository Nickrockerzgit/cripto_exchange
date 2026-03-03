// controllers/robot.controller.js

import robotActivationService from "../services/blockchain/robotActivation.service.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const activateRobotController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tx_hash, deposit_address } = req.body;

    if (!tx_hash || !deposit_address) {
      return res.status(400).json({
        success: false,
        message: "tx_hash and deposit_address are required"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.robot_status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Robot already active"
      });
    }

    // prevent duplicate tx submission
    const existingTx = await prisma.depositSubmission.findUnique({
      where: { tx_hash }
    });

    if (existingTx) {
      return res.status(400).json({
        success: false,
        message: "Transaction already submitted"
      });
    }

    // create activation submission
    await prisma.depositSubmission.create({
      data: {
        user_id: userId,
        amount: 30, // fixed
        tx_hash,
        deposit_address,
        type: "ROBOT_ACTIVATION",
        status: "PENDING"
      }
    });

    return res.status(200).json({
      success: true,
      message: "Activation request submitted. Waiting for blockchain confirmation."
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


////--- for testing without  auth token --//


// export const activateRobotController = async (req, res) => {
//   try {
//     const { user_id, tx_hash, deposit_address } = req.body;

//     if (!user_id || !tx_hash || !deposit_address) {
//       return res.status(400).json({
//         success: false,
//         message: "user_id, tx_hash and deposit_address are required"
//       });
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: user_id }
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     if (user.robot_status === "ACTIVE") {
//       return res.status(400).json({
//         success: false,
//         message: "Robot already active"
//       });
//     }

//     const existingTx = await prisma.depositSubmission.findUnique({
//       where: { tx_hash }
//     });

//     if (existingTx) {
//       return res.status(400).json({
//         success: false,
//         message: "Transaction already submitted"
//       });
//     }

//     await prisma.depositSubmission.create({
//       data: {
//         user_id,
//         amount: 30,
//         tx_hash,
//         deposit_address,
//         type: "ROBOT_ACTIVATION",
//         status: "PENDING"
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Activation request submitted. Waiting for blockchain confirmation."
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };