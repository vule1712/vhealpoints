import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

router.get('/', userAuth, getNotifications);
router.post('/mark-read', userAuth, markAsRead);

export default router; 