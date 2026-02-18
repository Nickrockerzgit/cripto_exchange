import * as userService from '../services/user.service.js';
import { successResponse } from '../utils/successResponse.js';
import { errorResponse } from '../utils/errorResponse.js';
// 🔹 Create User
export const createUser = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password_hash) {
      return errorResponse(res, "Required fields missing", 400);
    }

    const user = await userService.createUser(req.body);

    return successResponse(res, "User created successfully", user, 201);

  } catch (error) {
    console.error("Create User Error:", error);
    return errorResponse(res, "Failed to create user");
  }
};

// 🔹 Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return successResponse(res, "Users fetched successfully", users);
  } catch (error) {
    console.error("Get All Users Error:", error);
    return errorResponse(res, "Failed to fetch users");
  }
};


// 🔹 Get Single User
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return errorResponse(res, "User ID required", 400);

    const user = await userService.getUserById(id);

    if (!user) return errorResponse(res, "User not found", 404);

    return successResponse(res, "User fetched successfully", user);

  } catch (error) {
    console.error("Get User Error:", error);
    return errorResponse(res, "Failed to fetch user");
  }
};


// 🔹 Update User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return errorResponse(res, "User ID required", 400);

    const user = await userService.updateUser(id, req.body);

    return successResponse(res, "User updated successfully", user);

  } catch (error) {
    console.error("Update User Error:", error);

    if (error.code === 'P2025') {
      return errorResponse(res, "User not found", 404);
    }

    return errorResponse(res, "Failed to update user");
  }
};


// 🔹 Delete User
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return errorResponse(res, "User ID required", 400);

    await userService.deleteUser(id);

    return successResponse(res, "User deleted successfully");

  } catch (error) {
    console.error("Delete User Error:", error);

    if (error.code === 'P2025') {
      return errorResponse(res, "User not found", 404);
    }

    return errorResponse(res, "Failed to delete user");
  }
};
