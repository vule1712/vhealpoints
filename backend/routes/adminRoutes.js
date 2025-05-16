import express from 'express';
import { getAllUsers, getDashboardStats, updateUserRole, deleteUser, getUserById } from '../controllers/adminController.js';
import { userAuth, adminAuth } from '../middleware/userAuth.js';

const adminRouter = express.Router();

// Get all users (admin only)
adminRouter.get('/users', userAuth, adminAuth, getAllUsers);

// Get single user details
adminRouter.get('/users/:userId', userAuth, adminAuth, getUserById);

// Get dashboard statistics
adminRouter.get('/stats', userAuth, adminAuth, getDashboardStats);

// Update user role
adminRouter.put('/users/:userId/role', userAuth, adminAuth, updateUserRole);

// Delete user
adminRouter.delete('/users/:userId', userAuth, adminAuth, deleteUser);

export default adminRouter; 