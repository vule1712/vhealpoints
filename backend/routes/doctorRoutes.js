import express from 'express';
import { userAuth, doctorAuth } from '../middleware/userAuth.js';
import { getDashboardStats } from '../controllers/doctorController.js';

const doctorRouter = express.Router();

// Get dashboard statistics
doctorRouter.get('/dashboard-stats', userAuth, doctorAuth, getDashboardStats);

export default doctorRouter; 