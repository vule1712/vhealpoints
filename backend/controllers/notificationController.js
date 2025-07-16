import notificationModel from '../models/notificationModel.js';
import { getIO, getUserSocketMap } from '../socket.js';

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifications = await notificationModel.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, notifications });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        await notificationModel.updateMany({ userId, isRead: false }, { isRead: true });
        // Emit real-time notification update to the user
        const io = getIO();
        const userSocketMap = getUserSocketMap();
        const socketId = userSocketMap[userId];
        if (socketId) {
            io.to(socketId).emit('notification-read');
        }
        res.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}; 