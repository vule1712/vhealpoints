import notificationModel from '../models/notificationModel.js';

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
        res.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}; 