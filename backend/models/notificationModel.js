import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String, // e.g., 'appointment', 'feedback', 'rating', etc.
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId, // appointmentId, doctorId, feedbackId, etc.
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const notificationModel = mongoose.model('Notification', notificationSchema);
export default notificationModel; 