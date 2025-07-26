import DoctorRating from '../models/DoctorRating.js';
import Appointment from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import notificationModel from '../models/notificationModel.js';

// Check if patient can rate doctor
export const canRateDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const patientId = req.user.userId;

        // Check if patient has any completed appointments with the doctor
        const completedAppointments = await Appointment.find({
            doctorId,
            patientId,
            status: 'Completed'
        });

        // Check if patient has already rated the doctor
        const existingRating = await DoctorRating.findOne({
            doctorId,
            patientId
        });

        res.json({
            success: true,
            canRate: completedAppointments.length > 0 && !existingRating,
            hasRated: !!existingRating,
            completedAppointments: completedAppointments.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Submit a rating
export const submitRating = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { rating, feedback } = req.body;
        const patientId = req.user.userId;
        const { io, userSocketMap } = req;

        // Check if patient has any completed appointments
        const completedAppointments = await Appointment.find({
            doctorId,
            patientId,
            status: 'Completed'
        });

        if (completedAppointments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'You must have at least one completed appointment to rate this doctor'
            });
        }

        // Check if patient has already rated
        const existingRating = await DoctorRating.findOne({
            doctorId,
            patientId
        });

        if (existingRating) {
            return res.status(400).json({
                success: false,
                message: 'You have already rated this doctor'
            });
        }

        // Create new rating
        const newRating = new DoctorRating({
            doctorId,
            patientId,
            rating,
            feedback
        });

        await newRating.save();

        // Notify doctor
        const patient = await userModel.findById(patientId);
        const message = `You have a new rating from ${patient.name}.`;
        const notification = new notificationModel({
            userId: doctorId,
            message: message,
            type: 'rating',
            targetId: newRating._id,
        });
        await notification.save();

        const doctorSocketId = userSocketMap[doctorId];
        if (doctorSocketId) {
            io.to(doctorSocketId).emit('notification', notification);
        }

        res.json({
            success: true,
            message: 'Rating submitted successfully',
            rating: newRating
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get doctor's ratings
export const getDoctorRatings = async (req, res) => {
    try {
        const { doctorId } = req.params;
        console.log('Fetching ratings for doctorId:', doctorId);
        console.log('User from request:', req.user);

        if (!doctorId) {
            console.error('No doctorId provided');
            return res.status(400).json({
                success: false,
                message: 'Doctor ID is required'
            });
        }

        // Validate doctorId format
        if (!doctorId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error('Invalid doctorId format:', doctorId);
            return res.status(400).json({
                success: false,
                message: 'Invalid Doctor ID format'
            });
        }

        console.log('Searching for ratings with doctorId:', doctorId);
        const ratings = await DoctorRating.find({ doctorId })
            .populate({
                path: 'patientId',
                model: 'user',
                select: 'name'
            })
            .sort({ createdAt: -1 });

        console.log('Found ratings:', ratings);

        // Calculate average rating
        const averageRating = ratings.length > 0
            ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
            : 0;

        const response = {
            success: true,
            ratings,
            averageRating: parseFloat(averageRating.toFixed(1))
        };

        console.log('Sending response:', response);
        res.json(response);
    } catch (error) {
        console.error('Error in getDoctorRatings:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching doctor ratings'
        });
    }
};

// Update a rating
export const updateRating = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { rating, feedback } = req.body;
        const patientId = req.user.userId;
        const { io, userSocketMap } = req;

        // Find the existing rating
        const existingRating = await DoctorRating.findOne({
            doctorId,
            patientId
        });

        if (!existingRating) {
            return res.status(404).json({
                success: false,
                message: 'Rating not found'
            });
        }

        // Update the rating
        existingRating.rating = rating;
        existingRating.feedback = feedback;
        existingRating.createdAt = new Date();
        await existingRating.save();

        // Notify doctor
        const patient = await userModel.findById(patientId);
        const message = `${patient.name} updated their rating for you.`;
        const notification = new notificationModel({
            userId: doctorId,
            message: message,
            type: 'rating',
            targetId: existingRating._id,
        });
        await notification.save();

        const doctorSocketId = userSocketMap[doctorId];
        if (doctorSocketId) {
            io.to(doctorSocketId).emit('notification', notification);
        }

        // Populate the patient information
        const updatedRating = await DoctorRating.findById(existingRating._id)
            .populate({
                path: 'patientId',
                model: 'user',
                select: 'name'
            });

        res.json({
            success: true,
            message: 'Rating updated successfully',
            rating: updatedRating
        });
    } catch (error) {
        console.error('Error updating rating:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating rating'
        });
    }
};

// Delete a rating
export const deleteRating = async (req, res) => {
    try {
        const { doctorId, ratingId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Find the rating
        const rating = await DoctorRating.findById(ratingId);

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: 'Rating not found'
            });
        }

        // Check if user is either the patient who created the rating or an admin
        if (userRole !== 'Admin' && rating.patientId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this rating'
            });
        }

        // Delete the rating
        await DoctorRating.findByIdAndDelete(ratingId);

        res.json({
            success: true,
            message: 'Rating deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting rating:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error deleting rating'
        });
    }
}; 