import appointmentModel from '../models/appointmentModel.js';
import availableSlotModel from '../models/availableSlotModel.js';
import userModel from '../models/userModel.js';

// Create a new appointment
export const createAppointment = async (req, res) => {
    try {
        const { doctorId, slotId, notes } = req.body;
        const patientId = req.user.userId;

        // Check if slot exists and is available
        const slot = await availableSlotModel.findById(slotId);
        if (!slot) {
            return res.json({ success: false, message: 'Slot not found' });
        }
        if (slot.isBooked) {
            return res.json({ success: false, message: 'Slot is already booked' });
        }

        // Create appointment
        const appointment = new appointmentModel({
            doctorId,
            patientId,
            slotId,
            notes
        });

        // Update slot status
        slot.isBooked = true;
        await slot.save();
        await appointment.save();

        res.json({
            success: true,
            message: 'Appointment created successfully',
            appointment
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get doctor's appointments
export const getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.user.userId;
        const appointments = await appointmentModel.find({ doctorId })
            .populate('patientId', 'name email')
            .populate('slotId')
            .select('status notes cancelReason slotId patientId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            appointments
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get patient's appointments
export const getPatientAppointments = async (req, res) => {
    try {
        const patientId = req.user.userId;
        const appointments = await appointmentModel.find({ patientId })
            .populate('doctorId', 'name email specialization clinicName')
            .populate('slotId')
            .select('status notes cancelReason slotId doctorId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            appointments
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get all appointments
export const getAllAppointments = async (req, res) => {
    try {
        const appointments = await appointmentModel.find()
            .populate('doctorId', 'name email specialization clinicName')
            .populate('patientId', 'name email')
            .populate('slotId', 'date startTime endTime')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: appointments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get recent appointments (last 5)
export const getRecentAppointments = async (req, res) => {
    try {
        const appointments = await appointmentModel.find()
            .populate('doctorId', 'name email specialization clinicName')
            .populate('patientId', 'name email')
            .populate('slotId', 'date startTime endTime')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: appointments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status, cancelReason } = req.body;

        const appointment = await appointmentModel.findByIdAndUpdate(
            appointmentId,
            { 
                status,
                ...(status === 'Canceled' && { cancelReason })
            },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await appointmentModel.findByIdAndDelete(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Update the slot availability
        await availableSlotModel.findByIdAndUpdate(
            appointment.slotId,
            { isBooked: false }
        );

        res.status(200).json({
            success: true,
            message: 'Appointment deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all available slots for the doctor from today onwards
        const availableSlots = await availableSlotModel.find({
            doctorId,
            date: { $gte: today },
            isBooked: false
        }).sort({ date: 1, startTime: 1 });

        res.json({
            success: true,
            slots: availableSlots
        });
    } catch (error) {
        console.error('Error in getAvailableSlots:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available slots'
        });
    }
};

// Get doctor's available slots
export const getDoctorSlots = async (req, res) => {
    try {
        const doctorId = req.user.userId;
        const slots = await availableSlotModel.find({ doctorId })
            .sort({ date: 1, startTime: 1 });

        res.json({
            success: true,
            slots
        });
    } catch (error) {
        console.error('Error in getDoctorSlots:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor slots'
        });
    }
};

// Add a new available slot
export const addSlot = async (req, res) => {
    try {
        const doctorId = req.user.userId;
        const { date, startTime, endTime } = req.body;

        // Validate date and times
        const slotDate = new Date(date);
        const slotStartTime = new Date(`${date}T${startTime}`);
        const slotEndTime = new Date(`${date}T${endTime}`);

        if (slotDate < new Date().setHours(0, 0, 0, 0)) {
            return res.json({
                success: false,
                message: 'Cannot add slots for past dates'
            });
        }

        if (slotEndTime <= slotStartTime) {
            return res.json({
                success: false,
                message: 'End time must be after start time'
            });
        }

        // Check for overlapping slots
        const overlappingSlot = await availableSlotModel.findOne({
            doctorId,
            date,
            $or: [
                {
                    startTime: { $lt: slotEndTime },
                    endTime: { $gt: slotStartTime }
                }
            ]
        });

        if (overlappingSlot) {
            return res.json({
                success: false,
                message: 'This slot overlaps with an existing slot'
            });
        }

        const newSlot = new availableSlotModel({
            doctorId,
            date,
            startTime: slotStartTime,
            endTime: slotEndTime
        });

        await newSlot.save();

        res.json({
            success: true,
            message: 'Slot added successfully',
            slot: newSlot
        });
    } catch (error) {
        console.error('Error in addSlot:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding slot'
        });
    }
};

// Delete an available slot
export const deleteSlot = async (req, res) => {
    try {
        const { slotId } = req.params;
        const doctorId = req.user.userId;

        const slot = await availableSlotModel.findOne({ _id: slotId, doctorId });

        if (!slot) {
            return res.json({
                success: false,
                message: 'Slot not found'
            });
        }

        if (slot.isBooked) {
            return res.json({
                success: false,
                message: 'Cannot delete a booked slot'
            });
        }

        await availableSlotModel.findByIdAndDelete(slotId);

        res.json({
            success: true,
            message: 'Slot deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteSlot:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting slot'
        });
    }
}; 