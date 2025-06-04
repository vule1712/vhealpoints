import DoctorRating from '../models/DoctorRating.js';
import Appointment from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';

// Check if patient can rate doctor
export const canRateDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const patientId = req.user.userId;

        console.log('doctorId:', doctorId);
        console.log('patientId:', patientId);

        // Check if patient has any completed appointments with the doctor
        const hasCompletedAppointment = await Appointment.findOne({
            doctorId,
            patientId,
            status: 'Completed'
        });

        console.log('Appointment found:', hasCompletedAppointment);

        // Check if patient has already rated the doctor
        const existingRating = await DoctorRating.findOne({
            doctorId,
            patientId
        });

        res.json({
            success: true,
            canRate: hasCompletedAppointment && !existingRating,
            hasRated: !!existingRating
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

        // Check if patient has any completed appointments
        const hasCompletedAppointment = await Appointment.findOne({
            doctorId,
            patientId,
            status: 'Completed'
        });

        if (!hasCompletedAppointment) {
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

        res.json({
            success: true,
            ratings,
            averageRating: parseFloat(averageRating.toFixed(1))
        });
    } catch (error) {
        console.error('Error in getDoctorRatings:', error);
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
        await existingRating.save();

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