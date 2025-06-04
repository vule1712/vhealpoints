import appointmentModel from '../models/appointmentModel.js';
import availableSlotModel from '../models/availableSlotModel.js';
import userModel from '../models/userModel.js';

// Helper function to convert 12-hour time to 24-hour time for comparison
const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// Helper function to format date to dd-MM-yyyy
const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Helper function to format time to 12-hour format
const formatTime = (time) => {
    if (!time) return '';
    
    // If time is already in 12-hour format, return it
    if (/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(time)) {
        return time;
    }

    // If time is in 24-hour format (HH:mm), convert to 12-hour format
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }

    // If time is a Date object or date string, extract hours and minutes
    try {
        const date = new Date(time);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
};

// Helper function to check and update appointment status
const checkAndUpdateAppointmentStatus = async (appointment) => {
    try {
        if (appointment.status === 'Confirmed') {
            const slot = await availableSlotModel.findById(appointment.slotId);
            if (!slot) return appointment;

            // Get the raw date from the slot (before getter transformation)
            const rawSlot = await availableSlotModel.findById(appointment.slotId).lean();
            const appointmentDate = new Date(rawSlot.date);
            
            // Get the end time in 24-hour format
            const [endHours, endMinutes] = convertTo24Hour(slot.endTime).split(':');
            
            // Set the hours and minutes for the appointment end time
            appointmentDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
            
            // Get current time
            const currentTime = new Date();
            
            // Compare current time with appointment end time
            if (currentTime >= appointmentDate) {
                console.log('Updating appointment status to Completed:', {
                    appointmentId: appointment._id,
                    currentTime: currentTime.toISOString(),
                    appointmentEndTime: appointmentDate.toISOString()
                });
                
                // Use findByIdAndUpdate to ensure atomic operation
                await appointmentModel.findByIdAndUpdate(
                    appointment._id,
                    { status: 'Completed' },
                    { new: true }
                );
                
                appointment.status = 'Completed';
            }
        }
        return appointment;
    } catch (error) {
        console.error('Error checking appointment status:', error);
        return appointment;
    }
};

// Add a function to check all appointments periodically
const checkAllAppointments = async () => {
    try {
        const appointments = await appointmentModel.find({ status: 'Confirmed' })
            .populate('slotId');
        
        for (const appointment of appointments) {
            await checkAndUpdateAppointmentStatus(appointment);
        }
    } catch (error) {
        console.error('Error checking all appointments:', error);
    }
};

// Set up periodic check every minute
setInterval(checkAllAppointments, 60000);

// Helper: convert 12-hour or 24-hour time string to minutes since midnight
function timeStringToMinutes(time) {
    if (!time) return 0;
    if (time.includes('AM') || time.includes('PM')) {
        const [t, mod] = time.split(' ');
        let [h, m] = t.split(':');
        h = parseInt(h, 10);
        if (h === 12) h = 0;
        if (mod === 'PM') h += 12;
        return h * 60 + parseInt(m, 10);
    } else {
        const [h, m] = time.split(':');
        return parseInt(h, 10) * 60 + parseInt(m, 10);
    }
}

// Helper: check if a slot is ongoing or in the future (for slot creation)
function isSlotInFutureOrOngoing(date, startTime, endTime) {
    // date: Date object or string
    // startTime, endTime: 'HH:mm' or 'hh:mm AM/PM'
    const yyyyMmDd = new Date(date).toISOString().split('T')[0];
    // Convert to 24-hour format if needed
    function to24(time) {
        if (time.includes('AM') || time.includes('PM')) {
            const [t, mod] = time.split(' ');
            let [h, m] = t.split(':');
            h = parseInt(h, 10);
            if (h === 12) h = 0;
            if (mod === 'PM') h += 12;
            return `${h.toString().padStart(2, '0')}:${m}`;
        }
        return time;
    }
    const start = new Date(`${yyyyMmDd}T${to24(startTime)}:00+07:00`);
    const end = new Date(`${yyyyMmDd}T${to24(endTime)}:00+07:00`);
    const now = new Date();
    return now < start;
}

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
            .populate('patientId', 'name email bloodType')
            .populate('doctorId', 'name email specialization clinicName clinicAddress')
            .populate('slotId')
            .select('status notes cancelReason slotId patientId doctorId doctorComment')
            .sort({ createdAt: -1 });

        // Check and update status for each appointment
        const updatedAppointments = await Promise.all(
            appointments.map(appointment => checkAndUpdateAppointmentStatus(appointment))
        );

        res.json({
            success: true,
            appointments: updatedAppointments
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
            .populate('doctorId', 'name email specialization clinicName clinicAddress')
            .populate('slotId')
            .populate('patientId', 'name email bloodType')
            .select('status notes cancelReason slotId doctorId patientId doctorComment')
            .sort({ createdAt: -1 });

        // Check and update status for each appointment
        const updatedAppointments = await Promise.all(
            appointments.map(appointment => checkAndUpdateAppointmentStatus(appointment))
        );

        res.json({
            success: true,
            appointments: updatedAppointments
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get all appointments
export const getAllAppointments = async (req, res) => {
    try {
        const appointments = await appointmentModel.find()
            .populate('doctorId', 'name email specialization clinicName clinicAddress')
            .populate('patientId', 'name email bloodType')
            .populate('slotId', 'date startTime endTime')
            .select('status notes cancelReason slotId doctorId patientId doctorComment')
            .sort({ createdAt: -1 });

        // Check and update status for each appointment
        const updatedAppointments = await Promise.all(
            appointments.map(appointment => checkAndUpdateAppointmentStatus(appointment))
        );

        res.status(200).json({
            success: true,
            data: updatedAppointments
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
            .populate('patientId', 'name email bloodType')
            .populate('slotId', 'date startTime endTime')
            .sort({ createdAt: -1 })
            .limit(5);

        // Check and update status for each appointment
        const updatedAppointments = await Promise.all(
            appointments.map(appointment => checkAndUpdateAppointmentStatus(appointment))
        );

        res.status(200).json({
            success: true,
            data: updatedAppointments
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

        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // If the appointment is being canceled, make the slot available again
        if (status === 'Canceled') {
            await availableSlotModel.findByIdAndUpdate(
                appointment.slotId,
                { isBooked: false }
            );
        }

        // Update the appointment status
        appointment.status = status;
        if (status === 'Canceled') {
            appointment.cancelReason = cancelReason;
        }
        await appointment.save();

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

        // Format the slots and check if they're in the past
        const formattedSlots = availableSlots.map(slot => {
            const slotDate = new Date(slot.date);
            const [hours, minutes] = convertTo24Hour(slot.startTime).split(':');
            slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const isPastSlot = slotDate <= new Date();

            return {
                ...slot.toObject(),
                date: slot.date,
                isPastSlot
            };
        });

        res.json({
            success: true,
            slots: formattedSlots
        });
    } catch (error) {
        console.error('Error in getAvailableSlots:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available slots'
        });
    }
};

// Get doctor's slots
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

// Add slot (doctor)
export const addSlot = async (req, res) => {
    try {
        const doctorId = req.user.userId;
        const { date, startTime, endTime } = req.body;

        const slotDate = new Date(date);
        const now = new Date();
        const slotDateMidnight = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
        const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (slotDateMidnight < nowMidnight) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add slots for past dates'
            });
        }

        // For today, check if slot is in the future (using isSlotInFutureOrOngoing)
        if (slotDateMidnight.getTime() === nowMidnight.getTime()) {
            if (!isSlotInFutureOrOngoing(slotDate, startTime, endTime)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot add slots for times that have already passed today'
                });
            }
        }

        // Check for overlapping slots (robust)
        const existingSlots = await availableSlotModel.find({ doctorId, date });
        const newStart = timeStringToMinutes(startTime);
        const newEnd = timeStringToMinutes(endTime);
        for (const slot of existingSlots) {
            const existStart = timeStringToMinutes(slot.startTime);
            const existEnd = timeStringToMinutes(slot.endTime);
            if (newStart < existEnd && newEnd > existStart) {
                return res.status(400).json({
                    success: false,
                    message: 'This slot overlaps with an existing slot'
                });
            }
        }

        // Format times to 12-hour format
        const startTime12 = formatTime(startTime);
        const endTime12 = formatTime(endTime);
        if (!startTime12 || !endTime12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format'
            });
        }

        const newSlot = new availableSlotModel({
            doctorId,
            date,
            startTime: startTime12,
            endTime: endTime12
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

// Update slot
export const updateSlot = async (req, res) => {
    try {
        const { slotId } = req.params;
        const { date, startTime, endTime } = req.body;
        const doctorId = req.user.userId;

        // Validate input
        if (!date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Find the slot
        const slot = await availableSlotModel.findById(slotId);
        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        // Verify the slot belongs to the doctor
        if (slot.doctorId.toString() !== doctorId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this slot'
            });
        }

        // Create Date objects for validation
        const slotDate = new Date(date);
        const startTime24 = convertTo24Hour(startTime);
        const endTime24 = convertTo24Hour(endTime);
        const slotStartTime = new Date(`${date}T${startTime24}`);
        const slotEndTime = new Date(`${date}T${endTime24}`);

        // Validate date and times
        if (slotDate < new Date().setHours(0, 0, 0, 0)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update slots for past dates'
            });
        }

        if (slotEndTime <= slotStartTime) {
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time'
            });
        }

        // Check for overlapping slots (excluding current slot)
        const overlappingSlot = await availableSlotModel.findOne({
            doctorId,
            date,
            _id: { $ne: slotId },
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        });

        if (overlappingSlot) {
            return res.status(400).json({
                success: false,
                message: 'This slot overlaps with an existing slot'
            });
        }

        // Convert times to 12-hour format
        const startTime12 = formatTime(startTime);
        const endTime12 = formatTime(endTime);

        // Update the slot
        const updatedSlot = await availableSlotModel.findByIdAndUpdate(
            slotId,
            {
                date,
                startTime: startTime12,
                endTime: endTime12
            },
            { new: true }
        );

        if (!updatedSlot) {
            return res.status(404).json({
                success: false,
                message: 'Failed to update slot'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Slot updated successfully',
            slot: updatedSlot
        });
    } catch (error) {
        console.error('Error updating slot:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating slot'
        });
    }
};

// Delete slot
export const deleteSlot = async (req, res) => {
    try {
        const { slotId } = req.params;
        const doctorId = req.user.userId;

        const slot = await availableSlotModel.findById(slotId);
        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        // Verify the slot belongs to the doctor
        if (slot.doctorId.toString() !== doctorId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this slot'
            });
        }

        if (slot.isBooked) {
            return res.status(400).json({
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

// Admin: Update appointment
export const adminUpdateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { date, startTime, endTime, status, cancelReason } = req.body;

        // Validate input
        if (!date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const appointment = await appointmentModel.findById(appointmentId)
            .populate('slotId');
            
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Validate date and times
        const slotDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (slotDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update slots for past dates'
            });
        }

        // Format times to 12-hour format
        const startTime12 = formatTime(startTime);
        const endTime12 = formatTime(endTime);

        if (!startTime12 || !endTime12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format'
            });
        }

        // Check for overlapping slots (excluding current slot)
        const overlappingSlot = await availableSlotModel.findOne({
            doctorId: appointment.doctorId,
            date,
            _id: { $ne: appointment.slotId._id }, // Exclude current slot
            $or: [
                {
                    startTime: { $lt: endTime12 },
                    endTime: { $gt: startTime12 }
                }
            ]
        });

        if (overlappingSlot) {
            return res.status(400).json({
                success: false,
                message: 'This slot overlaps with an existing slot'
            });
        }

        // Update the slot
        const updatedSlot = await availableSlotModel.findByIdAndUpdate(
            appointment.slotId._id,
            {
                date,
                startTime: startTime12,
                endTime: endTime12
            },
            { new: true }
        );

        if (!updatedSlot) {
            return res.status(404).json({
                success: false,
                message: 'Failed to update slot'
            });
        }

        // Update the appointment
        appointment.status = status;
        if (status === 'Canceled') {
            appointment.cancelReason = cancelReason;
        }
        await appointment.save();

        // Populate the updated appointment with slot details
        const updatedAppointment = await appointmentModel.findById(appointmentId)
            .populate('doctorId', 'name email specialization clinicName')
            .populate('patientId', 'name email')
            .populate('slotId');

        res.status(200).json({
            success: true,
            message: 'Appointment updated successfully',
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating appointment'
        });
    }
};

// Admin: Delete appointment
export const adminDeleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await appointmentModel.findById(appointmentId);
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

        // Delete the appointment
        await appointmentModel.findByIdAndDelete(appointmentId);

        res.status(200).json({
            success: true,
            message: 'Appointment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error deleting appointment'
        });
    }
};

// Get doctor's slots (admin access)
export const getDoctorSlotsAdmin = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const slots = await availableSlotModel.find({ doctorId })
            .sort({ date: 1, startTime: 1 });

        res.json({
            success: true,
            slots
        });
    } catch (error) {
        console.error('Error in getDoctorSlotsAdmin:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor slots'
        });
    }
};

// Update slot (admin access)
export const updateSlotAdmin = async (req, res) => {
    try {
        const { slotId } = req.params;
        const { date, startTime, endTime } = req.body;

        // Validate input
        if (!date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Find the slot
        const slot = await availableSlotModel.findById(slotId);
        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        // Check if slot is booked
        if (slot.isBooked) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update booked slots'
            });
        }

        // Validate date and times
        const slotDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (slotDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update slots for past dates'
            });
        }

        // Format times to 12-hour format
        const startTime12 = formatTime(startTime);
        const endTime12 = formatTime(endTime);

        if (!startTime12 || !endTime12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format'
            });
        }

        // Check for overlapping slots (excluding current slot)
        const overlappingSlot = await availableSlotModel.findOne({
            doctorId: slot.doctorId,
            date,
            _id: { $ne: slotId },
            $or: [
                {
                    startTime: { $lt: endTime12 },
                    endTime: { $gt: startTime12 }
                }
            ]
        });

        if (overlappingSlot) {
            return res.status(400).json({
                success: false,
                message: 'This slot overlaps with an existing slot'
            });
        }

        // Update the slot
        const updatedSlot = await availableSlotModel.findByIdAndUpdate(
            slotId,
            {
                date,
                startTime: startTime12,
                endTime: endTime12
            },
            { new: true }
        );

        if (!updatedSlot) {
            return res.status(404).json({
                success: false,
                message: 'Failed to update slot'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Slot updated successfully',
            slot: updatedSlot
        });
    } catch (error) {
        console.error('Error updating slot:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating slot'
        });
    }
};

// Delete slot (admin access)
export const deleteSlotAdmin = async (req, res) => {
    try {
        const { slotId } = req.params;

        const slot = await availableSlotModel.findById(slotId);
        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        // Check if slot is booked
        if (slot.isBooked) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete booked slots'
            });
        }

        // Check if slot is in the past
        const slotDate = new Date(slot.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (slotDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete past slots'
            });
        }

        await availableSlotModel.findByIdAndDelete(slotId);

        res.json({
            success: true,
            message: 'Slot deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteSlotAdmin:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting slot'
        });
    }
};

// Add slot for doctor (admin access)
export const addSlotAdmin = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date, startTime, endTime } = req.body;

        const slotDate = new Date(date);
        const now = new Date();
        const slotDateMidnight = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
        const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (slotDateMidnight < nowMidnight) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add slots for past dates'
            });
        }

        // For today, check if slot is in the future (using isSlotInFutureOrOngoing)
        if (slotDateMidnight.getTime() === nowMidnight.getTime()) {
            if (!isSlotInFutureOrOngoing(slotDate, startTime, endTime)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot add slots for times that have already passed today'
                });
            }
        }

        // Check for overlapping slots (robust)
        const existingSlots = await availableSlotModel.find({ doctorId, date });
        const newStart = timeStringToMinutes(startTime);
        const newEnd = timeStringToMinutes(endTime);
        for (const slot of existingSlots) {
            const existStart = timeStringToMinutes(slot.startTime);
            const existEnd = timeStringToMinutes(slot.endTime);
            if (newStart < existEnd && newEnd > existStart) {
                return res.status(400).json({
                    success: false,
                    message: 'This slot overlaps with an existing slot'
                });
            }
        }

        // Format times to 12-hour format
        const startTime12 = formatTime(startTime);
        const endTime12 = formatTime(endTime);
        if (!startTime12 || !endTime12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format'
            });
        }

        const newSlot = new availableSlotModel({
            doctorId,
            date,
            startTime: startTime12,
            endTime: endTime12
        });
        await newSlot.save();
        res.json({
            success: true,
            message: 'Slot added successfully',
            slot: newSlot
        });
    } catch (error) {
        console.error('Error in addSlotAdmin:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding slot'
        });
    }
};

// Get doctor's recent appointments
export const getDoctorRecentAppointments = async (req, res) => {
    try {
        const doctorId = req.user.userId;
        const appointments = await appointmentModel.find({ doctorId })
            .populate('patientId', 'name email bloodType')
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

// Get patient's recent appointments
export const getPatientRecentAppointments = async (req, res) => {
    try {
        const patientId = req.user.userId;
        const appointments = await appointmentModel.find({ patientId })
            .populate('doctorId', 'name email specialization clinicName')
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

export const updateDoctorComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorComment } = req.body;
        const userId = req.user.userId;

        const appointment = await appointmentModel.findById(id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Check if the user is the doctor of this appointment
        if (appointment.doctorId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Only the doctor can add comments' });
        }

        // Check if the appointment is completed
        if (appointment.status !== 'Completed') {
            return res.status(400).json({ success: false, message: 'Can only add comments to completed appointments' });
        }

        appointment.doctorComment = doctorComment;
        await appointment.save();

        res.json({ success: true, appointment });
    } catch (error) {
        console.error('Error updating doctor comment:', error);
        res.status(500).json({ success: false, message: 'Error updating doctor comment' });
    }
}; 