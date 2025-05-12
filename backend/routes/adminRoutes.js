import express from 'express';
import { getAllUsers, getDashboardStats } from '../controllers/adminController.js';
import userAuth from '../middleware/userAuth.js';

const adminRouter = express.Router();

// Get all users (admin only)
adminRouter.get('/users', userAuth, getAllUsers);

// Get dashboard statistics
adminRouter.get('/stats', userAuth, getDashboardStats);

export default adminRouter; 