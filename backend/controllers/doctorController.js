import Appointment from '../models/appointmentModel.js';

export const getDashboardStats = async (req, res) => {
    try {
        const doctorId = req.user._id;

        // Get total appointments
        const totalAppointments = await Appointment.countDocuments({ doctorId });

        // Get today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = await Appointment.countDocuments({
            doctorId,
            'slotId.date': {
                $gte: today,
                $lt: tomorrow
            }
        });

        const uniquePatients = await Appointment.distinct('patientId', { doctorId });
        const totalPatients = uniquePatients.length;

        const recentAppointments = await Appointment.find({ doctorId })
            .populate('patientId', 'name email')
            .populate('slotId', 'date startTime endTime')
            .sort({ createdAt: -1 })
            .limit(5);

        const todaySchedule = await Appointment.find({
            doctorId,
            'slotId.date': {
                $gte: today,
                $lt: tomorrow
            }
        })
            .populate('patientId', 'name email')
            .populate('slotId', 'date startTime endTime')
            .sort({ 'slotId.startTime': 1 });

        res.json({
            success: true,
            stats: {
                totalAppointments,
                todayAppointments,
                totalPatients,
                recentAppointments,
                todaySchedule
            }
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics'
        });
    }
}; 