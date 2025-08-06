import appointmentModel from '../models/appointmentModel.js';
import availableSlotModel from '../models/availableSlotModel.js';
import userModel from '../models/userModel.js';
import notificationModel from '../models/notificationModel.js';
import { getIO, getUserSocketMap, emitAdminDashboardUpdate, emitDoctorDashboardUpdate, emitPatientDashboardUpdate } from '../socket.js';
import { sendAppointmentReminderEmail } from '../config/nodemailer.js';
import { isToday } from 'date-fns';

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
            
            // Create appointment end time by combining date and time properly
            const [endHours, endMinutes] = convertTo24Hour(slot.endTime).split(':');
            
            // Create the appointment end time in local timezone
            // Parse the date string and create a local date object
            const [year, month, day] = rawSlot.date.split('T')[0].split('-');
            const appointmentDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(endHours), parseInt(endMinutes), 0, 0);
            
            const currentTime = new Date();
            
            // Compare current time with appointment end time
            if (currentTime >= appointmentDate) {
                console.log('Updating appointment status to Completed:', {
                    appointmentId: appointment._id,
                    currentTime: currentTime.toISOString(),
                    currentTimeLocal: currentTime.toString(),
                    appointmentEndTime: appointmentDate.toISOString(),
                    appointmentEndTimeLocal: appointmentDate.toString(),
                    timeDifference: currentTime.getTime() - appointmentDate.getTime()
                });
                
                const updatedAppointment = await appointmentModel.findByIdAndUpdate(
                    appointment._id,
                    { status: 'Completed' },
                    { new: true }
                ).populate('doctorId').populate('patientId');
                
                appointment.status = 'Completed';

                if (updatedAppointment) {
                    const io = getIO();
                    const userSocketMap = getUserSocketMap();
                    // Notify patient
                    const messageToPatient = `Your appointment with Dr. ${updatedAppointment.doctorId.name} has been completed.`;
                    const notificationToPatient = new notificationModel({
                        userId: updatedAppointment.patientId._id,
                        message: messageToPatient,
                        type: 'appointment',
                        targetId: updatedAppointment._id,
                    });
                    await notificationToPatient.save();
                    const patientSocketId = userSocketMap[updatedAppointment.patientId._id.toString()];
                    if (patientSocketId) {
                        io.to(patientSocketId).emit('notification', notificationToPatient);
                        // Also emit patient dashboard update with latest stats
                        const patientStats = await getPatientStats(updatedAppointment.patientId._id);
                        emitPatientDashboardUpdate(updatedAppointment.patientId._id.toString(), patientStats);
                    }
                    // Notify doctor
                    const messageToDoctor = `Your appointment with patient ${updatedAppointment.patientId.name} has been completed.`;
                    const notificationToDoctor = new notificationModel({
                        userId: updatedAppointment.doctorId._id,
                        message: messageToDoctor,
                        type: 'appointment',
                        targetId: updatedAppointment._id,
                    });
                    await notificationToDoctor.save();
                    const doctorSocketId = userSocketMap[updatedAppointment.doctorId._id.toString()];
                    if (doctorSocketId) {
                        io.to(doctorSocketId).emit('notification', notificationToDoctor);
                        // Also emit doctor dashboard update with latest stats
                        const doctorStats = await getDoctorStats(updatedAppointment.doctorId._id);
                        emitDoctorDashboardUpdate(updatedAppointment.doctorId._id.toString(), doctorStats);
                    }
                    // Emit admin dashboard update with latest stats
                    const adminStats = await getAdminStats();
                    emitAdminDashboardUpdate(adminStats);
                }
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

// Helper function to calculate and emit dashboard updates
const emitDashboardUpdates = async (appointment = null, isDeletion = false) => {
    try {
        console.log('=== emitDashboardUpdates START ===');
        console.log('emitDashboardUpdates called with appointment:', appointment ? {
            id: appointment._id,
            doctorId: appointment.doctorId,
            patientId: appointment.patientId,
            status: appointment.status
        } : 'null');
        console.log('isDeletion:', isDeletion);

        // Calculate admin dashboard stats
        let allAppointments = await appointmentModel.find().populate('slotId');
        
        // If this is a deletion, exclude the appointment being deleted from the count
        if (isDeletion && appointment) {
            allAppointments = allAppointments.filter(apt => apt._id.toString() !== appointment._id.toString());
        }
        
        console.log('Total appointments found:', allAppointments.length);
        
        const adminStats = {
            totalAppointments: allAppointments.length,
            todayAppointments: allAppointments.filter(apt => {
                if (!apt.slotId?.date) return false;
                const [day, month, year] = apt.slotId.date.split('/');
                const appointmentDate = new Date(year, month - 1, day);
                return isToday(appointmentDate);
            }).length,
            confirmedAppointments: allAppointments.filter(apt => apt.status === 'Confirmed').length,
            completedAppointments: allAppointments.filter(apt => apt.status === 'Completed').length
        };

        // Get user stats for admin
        const totalUsers = await userModel.countDocuments();
        const verifiedUsers = await userModel.countDocuments({ isVerified: true });
        const doctors = await userModel.countDocuments({ role: 'doctor' });
        const patients = await userModel.countDocuments({ role: 'patient' });

        adminStats.totalUsers = totalUsers;
        adminStats.verifiedUsers = verifiedUsers;
        adminStats.doctors = doctors;
        adminStats.patients = patients;

        // Emit admin dashboard update
        emitAdminDashboardUpdate(adminStats);
        console.log('Sent admin dashboard update:', adminStats);

        // If we have a specific appointment, calculate role-specific updates
        if (appointment) {
            console.log('Processing role-specific updates for appointment:', appointment._id);
            console.log('Appointment doctorId type:', typeof appointment.doctorId, 'value:', appointment.doctorId);
            console.log('Appointment patientId type:', typeof appointment.patientId, 'value:', appointment.patientId);
            
            // Doctor dashboard update
            let doctorAppointments = await appointmentModel.find({ 
                doctorId: appointment.doctorId 
            }).populate('slotId');
            
            // If this is a deletion, exclude the appointment being deleted
            if (isDeletion) {
                doctorAppointments = doctorAppointments.filter(apt => apt._id.toString() !== appointment._id.toString());
            }
            
            console.log('Found doctor appointments:', doctorAppointments.length, 'for doctorId:', appointment.doctorId);
            
            const doctorStats = {
                totalAppointments: doctorAppointments.length,
                todayAppointments: doctorAppointments.filter(apt => {
                    if (!apt.slotId?.date) return false;
                    const [day, month, year] = apt.slotId.date.split('/');
                    const appointmentDate = new Date(year, month - 1, day);
                    return isToday(appointmentDate);
                }).length,
                confirmedAppointments: doctorAppointments.filter(apt => apt.status === 'Confirmed').length,
                completedAppointments: doctorAppointments.filter(apt => apt.status === 'Completed').length
            };

            // Get doctor's total patients
            const uniquePatients = new Set(doctorAppointments.map(apt => apt.patientId.toString()));
            doctorStats.totalPatients = uniquePatients.size;

            console.log('Doctor stats calculated:', doctorStats);
            emitDoctorDashboardUpdate(appointment.doctorId.toString(), doctorStats);
            console.log('Sent doctor dashboard update for doctorId:', appointment.doctorId.toString(), 'stats:', doctorStats);

            // Patient dashboard update
            let patientAppointments = await appointmentModel.find({ 
                patientId: appointment.patientId 
            }).populate('slotId');
            
            // If this is a deletion, exclude the appointment being deleted
            if (isDeletion) {
                patientAppointments = patientAppointments.filter(apt => apt._id.toString() !== appointment._id.toString());
            }
            
            console.log('Found patient appointments:', patientAppointments.length, 'for patientId:', appointment.patientId);
            
            const patientStats = {
                totalAppointments: patientAppointments.length,
                todayAppointments: patientAppointments.filter(apt => {
                    if (!apt.slotId?.date) return false;
                    const [day, month, year] = apt.slotId.date.split('/');
                    const appointmentDate = new Date(year, month - 1, day);
                    return isToday(appointmentDate);
                }).length,
                confirmedAppointments: patientAppointments.filter(apt => apt.status === 'Confirmed').length,
                completedAppointments: patientAppointments.filter(apt => apt.status === 'Completed').length
            };

            console.log('Patient stats calculated:', patientStats);
            emitPatientDashboardUpdate(appointment.patientId.toString(), patientStats);
            console.log('Sent patient dashboard update for patientId:', appointment.patientId.toString(), 'stats:', patientStats);
        }
        console.log('=== emitDashboardUpdates END ===');
    } catch (error) {
        console.error('Error emitting dashboard updates:', error);
        console.error('Error stack:', error.stack);
    }
};

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
    
    // Parse the date properly to avoid timezone issues
    let dateObj;
    if (typeof date === 'string') {
        const [year, month, day] = date.split('T')[0].split('-');
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
        dateObj = new Date(date);
    }
    
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
    
    const startTime24 = to24(startTime);
    const [startHours, startMinutes] = startTime24.split(':');
    const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    const now = new Date();
    return now < start;
}

// Create a new appointment
export const createAppointment = async (req, res) => {
    try {
        const { doctorId, slotId, notes } = req.body;
        const patientId = req.user.userId;
        const { io, userSocketMap } = req;

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

        const patient = await userModel.findById(patientId);
        const doctor = await userModel.findById(doctorId);

        // Notify doctor and admins
        const messageToDoctor = `New appointment booked by ${patient.name}.`;
        const notificationToDoctor = new notificationModel({
            userId: doctorId,
            message: messageToDoctor,
            type: 'appointment',
            targetId: appointment._id,
        });
        await notificationToDoctor.save();

        const doctorSocketId = userSocketMap[doctorId];
        console.log('Sending notification to doctor:', {
            doctorId,
            doctorSocketId,
            message: messageToDoctor,
            userSocketMap: Object.keys(userSocketMap)
        });
        
        if (doctorSocketId) {
            io.to(doctorSocketId).emit('notification', notificationToDoctor);
            console.log('Notification sent to doctor via socket');
        } else {
            console.log('Doctor not connected to socket');
        }

        const admins = await userModel.find({ role: 'Admin' });
        for (const admin of admins) {
            const messageToAdmin = `New appointment booked for Dr. ${doctor.name} by ${patient.name}.`;
            const notificationToAdmin = new notificationModel({
                userId: admin._id,
                message: messageToAdmin,
                type: 'appointment',
                targetId: appointment._id,
            });
            await notificationToAdmin.save();
            const adminSocketId = userSocketMap[admin._id.toString()];
            if (adminSocketId) {
                io.to(adminSocketId).emit('notification', notificationToAdmin);
            }
        }

        // Emit dashboard updates for all roles
        await emitDashboardUpdates(appointment);

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
        const { status } = req.body;
        const { io, userSocketMap } = req;

        const appointment = await appointmentModel.findById(appointmentId).populate('patientId doctorId');
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }
        
        appointment.status = status;
        
        await appointment.save();
        
        // Populate the updated appointment with slot details
        const updatedAppointment = await appointmentModel.findById(appointmentId)
            .populate('doctorId', 'name email specialization clinicName')
            .populate('patientId', 'name email')
            .populate('slotId');

        // Create a copy of the appointment with correct ID structure for emitDashboardUpdates
        const appointmentForUpdates = {
            ...updatedAppointment.toObject(),
            doctorId: updatedAppointment.doctorId._id,
            patientId: updatedAppointment.patientId._id
        };

        // Emit dashboard updates for all roles
        await emitDashboardUpdates(appointmentForUpdates);
        
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
        const patientId = req.user.userId;
        const { io, userSocketMap } = req;

        const appointment = await appointmentModel.findById(appointmentId).populate('patientId doctorId');
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointment.patientId._id.toString() !== patientId && appointment.doctorId._id.toString() !== patientId) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this appointment' });
        }

        const deletedByDoctor = appointment.doctorId._id.toString() === patientId;

        // Create a copy of the appointment with correct ID structure for emitDashboardUpdates
        const appointmentForUpdates = {
            ...appointment.toObject(),
            doctorId: appointment.doctorId._id,
            patientId: appointment.patientId._id
        };

        // Emit dashboard updates for all roles BEFORE deleting the appointment
        await emitDashboardUpdates(appointmentForUpdates, true);

        await appointmentModel.findByIdAndDelete(appointmentId);

        // Notify doctor and admins
        const messageToDoctor = `Appointment with ${appointment.patientId.name} has been canceled by the patient.`;
        const notificationToDoctor = new notificationModel({
            userId: appointment.doctorId._id,
            message: messageToDoctor,
            type: 'appointment',
            targetId: appointment._id,
        });
        await notificationToDoctor.save();

        const doctorSocketId = userSocketMap[appointment.doctorId._id.toString()];
        if (doctorSocketId) {
            io.to(doctorSocketId).emit('notification', notificationToDoctor);
        }

        // Notify patient if deleted by doctor
        if (deletedByDoctor) {
            const messageToPatient = `Your appointment with Dr. ${appointment.doctorId.name} has been canceled by the doctor.`;
            const notificationToPatient = new notificationModel({
                userId: appointment.patientId._id,
                message: messageToPatient,
                type: 'appointment',
                targetId: appointment._id,
            });
            await notificationToPatient.save();
            const patientSocketId = userSocketMap[appointment.patientId._id.toString()];
            if (patientSocketId) {
                io.to(patientSocketId).emit('notification', notificationToPatient);
            }
        }

        // Notify admins
        const admins = await userModel.find({ role: 'Admin' });
        for (const admin of admins) {
            const messageToAdmin = deletedByDoctor
                ? `Appointment for Dr. ${appointment.doctorId.name} with ${appointment.patientId.name} has been canceled by the doctor.`
                : `Appointment for Dr. ${appointment.doctorId.name} with ${appointment.patientId.name} has been canceled by the patient.`;
            const notificationToAdmin = new notificationModel({
                userId: admin._id,
                message: messageToAdmin,
                type: 'appointment',
                targetId: appointment._id,
            });
            await notificationToAdmin.save();
            const adminSocketId = userSocketMap[admin._id.toString()];
            if (adminSocketId) {
                io.to(adminSocketId).emit('notification', notificationToAdmin);
            }
        }

        res.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
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
            // Parse the date properly to avoid timezone issues
            const [year, month, day] = slot.date.split('T')[0].split('-');
            const slotDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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

        // Notify patient if slot is booked
        if (slot.isBooked) {
            const appointment = await appointmentModel.findOne({ slotId: slot._id }).populate('patientId doctorId');
            if (appointment) {
                const io = getIO();
                const userSocketMap = getUserSocketMap();
                const message = `Your appointment with Dr. ${appointment.doctorId.name} has changed. New time: ${date} ${startTime12} - ${endTime12}`;
                const notification = new notificationModel({
                    userId: appointment.patientId._id,
                    message: message,
                    type: 'appointment',
                    targetId: appointment._id,
                });
                await notification.save();
                const patientSocketId = userSocketMap[appointment.patientId._id.toString()];
                if (patientSocketId) {
                    io.to(patientSocketId).emit('notification', notification);
                }
            }
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
        const { date, startTime, endTime, status } = req.body;

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

        // Notify patient if appointment is booked
        if (appointment.status === 'Confirmed') {
            const io = getIO();
            const userSocketMap = getUserSocketMap();
            const patient = await userModel.findById(appointment.patientId);
            const doctor = await userModel.findById(appointment.doctorId);
            const message = `Your appointment with Dr. ${doctor.name} has changed. New time: ${date} ${startTime12} - ${endTime12}`;
            const notification = new notificationModel({
                userId: patient._id,
                message: message,
                type: 'appointment',
                targetId: appointment._id,
            });
            await notification.save();
            const patientSocketId = userSocketMap[patient._id.toString()];
            if (patientSocketId) {
                io.to(patientSocketId).emit('notification', notification);
            }
        }

        // Update the appointment
        appointment.status = status;
        await appointment.save();

        // Populate the updated appointment with slot details
        const updatedAppointment = await appointmentModel.findById(appointmentId)
            .populate('doctorId', 'name email specialization clinicName')
            .populate('patientId', 'name email')
            .populate('slotId');

        // Create a copy of the appointment with correct ID structure for emitDashboardUpdates
        const appointmentForUpdates = {
            ...updatedAppointment.toObject(),
            doctorId: updatedAppointment.doctorId._id,
            patientId: updatedAppointment.patientId._id
        };

        // Emit dashboard updates for all roles
        await emitDashboardUpdates(appointmentForUpdates);

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

// Admin: Delete a specific appointment
export const adminDeleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { io, userSocketMap } = req;

        const appointment = await appointmentModel.findById(appointmentId).populate('patientId doctorId');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Store the IDs before deleting the appointment
        const doctorId = appointment.doctorId._id;
        const patientId = appointment.patientId._id;

        // Update the slot availability
        await availableSlotModel.findByIdAndUpdate(
            appointment.slotId,
            { isBooked: false }
        );
        
        // Create a copy of the appointment with correct ID structure for emitDashboardUpdates
        const appointmentForUpdates = {
            ...appointment.toObject(),
            doctorId: doctorId,
            patientId: patientId
        };
        
        // Emit dashboard updates for all roles BEFORE deleting the appointment
        await emitDashboardUpdates(appointmentForUpdates, true);
        
        await appointmentModel.findByIdAndDelete(appointmentId);

        // Notify patient and doctor
        const messageToPatient = `Your appointment with Dr. ${appointment.doctorId.name} has been canceled by the admin.`;
        const notificationToPatient = new notificationModel({
            userId: appointment.patientId._id,
            message: messageToPatient,
            type: 'appointment',
            targetId: appointment._id,
        });
        await notificationToPatient.save();
        const patientSocketId = userSocketMap[appointment.patientId._id.toString()];
        if (patientSocketId) {
            io.to(patientSocketId).emit('notification', notificationToPatient);
        }

        const messageToDoctor = `Your appointment with ${appointment.patientId.name} has been canceled by the admin.`;
        const notificationToDoctor = new notificationModel({
            userId: appointment.doctorId._id,
            message: messageToDoctor,
            type: 'appointment',
            targetId: appointment._id,
        });
        await notificationToDoctor.save();
        const doctorSocketId = userSocketMap[appointment.doctorId._id.toString()];
        if (doctorSocketId) {
            io.to(doctorSocketId).emit('notification', notificationToDoctor);
        }

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

// Admin: Get all slots for a specific doctor
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

// Add/Update doctor's comment on an appointment
export const updateDoctorComment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { doctorComment } = req.body;
        const { io, userSocketMap } = req;

        const appointment = await appointmentModel.findById(appointmentId).populate('patientId doctorId');

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const isNewComment = !appointment.doctorComment;
        appointment.doctorComment = doctorComment;
        await appointment.save();
        
        // Notify patient
        const message = isNewComment
            ? `Dr. ${appointment.doctorId.name} left a comment on your appointment.`
            : `Dr. ${appointment.doctorId.name} updated the comment on your appointment.`;
        
        const notification = new notificationModel({
            userId: appointment.patientId._id,
            message: message,
            type: 'appointment',
            targetId: appointment._id,
        });
        await notification.save();

        const patientSocketId = userSocketMap[appointment.patientId._id.toString()];
        if (patientSocketId) {
            io.to(patientSocketId).emit('notification', notification);
        }

        res.json({ success: true, message: 'Comment updated successfully', appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



// --- Appointment Reminder Scheduler ---
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

const sendAppointmentReminders = async () => {
    try {
        console.log('Running appointment reminder check...');
        const now = new Date();
        const oneDayLater = new Date(now.getTime() + MS_PER_DAY);
        const startWindow = new Date(oneDayLater.getTime() - MS_PER_HOUR); // 1 hour window before 24h
        const endWindow = new Date(oneDayLater.getTime() + MS_PER_HOUR);   // 1 hour window after 24h

        console.log('Checking for appointments between:', startWindow, 'and', endWindow);

        // Find all confirmed appointments
        const appointments = await appointmentModel.find({ status: 'Confirmed' })
            .populate('slotId')
            .populate('doctorId', 'name email')
            .populate('patientId', 'name email');

        console.log('Found', appointments.length, 'confirmed appointments');

        for (const appointment of appointments) {
            if (!appointment.slotId || !appointment.slotId.date) {
                console.log('Skipping appointment without slot or date:', appointment._id);
                continue;
            }

            console.log('Processing appointment:', appointment._id);
            console.log('Slot date:', appointment.slotId.date);
            console.log('Slot start time:', appointment.slotId.startTime);

            // Parse the slot date properly to avoid timezone issues
            let slotDate;
            if (typeof appointment.slotId.date === 'string') {
                // If it's a string in dd/MM/yyyy format, parse it
                if (appointment.slotId.date.includes('/')) {
                    const [day, month, year] = appointment.slotId.date.split('/');
                    slotDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                } else {
                    // If it's in ISO format (YYYY-MM-DD), parse it
                    const [year, month, day] = appointment.slotId.date.split('T')[0].split('-');
                    slotDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                }
            } else {
                // If it's a Date object, create a new date with the same components
                const dateObj = new Date(appointment.slotId.date);
                slotDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
            }

            // Parse the start time (12-hour format like "09:00 AM")
            let startHour = 0, startMinute = 0;
            if (appointment.slotId.startTime) {
                const timeMatch = appointment.slotId.startTime.match(/(\d+):(\d+) (AM|PM)/);
                if (timeMatch) {
                    startHour = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);
                    const period = timeMatch[3];
                    
                    if (period === 'PM' && startHour !== 12) {
                        startHour += 12;
                    } else if (period === 'AM' && startHour === 12) {
                        startHour = 0;
                    }
                    startMinute = minutes;
                }
            }

            slotDate.setHours(startHour, startMinute, 0, 0);
            console.log('Calculated appointment time:', slotDate);

            if (slotDate >= startWindow && slotDate <= endWindow) {
                console.log('Appointment is within reminder window, sending reminders...');
                
                // Check if already reminded
                const existingNotif = await notificationModel.findOne({
                    userId: appointment.patientId._id,
                    type: 'reminder',
                    targetId: appointment._id
                });
                
                if (existingNotif) {
                    console.log('Reminder already sent for appointment:', appointment._id);
                    continue;
                }

                // Send email to patient
                console.log('Sending reminder email to patient:', appointment.patientId.email);
                await sendAppointmentReminderEmail(
                    appointment.patientId.email,
                    appointment.patientId.name,
                    appointment.slotId.date,
                    appointment.slotId.startTime + ' - ' + appointment.slotId.endTime,
                    appointment.doctorId.name,
                    'Patient'
                );

                // Send email to doctor
                console.log('Sending reminder email to doctor:', appointment.doctorId.email);
                await sendAppointmentReminderEmail(
                    appointment.doctorId.email,
                    appointment.doctorId.name,
                    appointment.slotId.date,
                    appointment.slotId.startTime + ' - ' + appointment.slotId.endTime,
                    appointment.patientId.name,
                    'Doctor'
                );

                // Create notification for patient
                const notifPatient = new notificationModel({
                    userId: appointment.patientId._id,
                    message: `Reminder: You have an appointment with Dr. ${appointment.doctorId.name} tomorrow at ${appointment.slotId.startTime}.`,
                    type: 'reminder',
                    targetId: appointment._id
                });
                await notifPatient.save();

                // Create notification for doctor
                const notifDoctor = new notificationModel({
                    userId: appointment.doctorId._id,
                    message: `Reminder: You have an appointment with patient ${appointment.patientId.name} tomorrow at ${appointment.slotId.startTime}.`,
                    type: 'reminder',
                    targetId: appointment._id
                });
                await notifDoctor.save();

                // Real-time notification (if online)
                try {
                    const { io, userSocketMap } = require('../socket.js');
                    const patientSocketId = userSocketMap[appointment.patientId._id.toString()];
                    if (patientSocketId) io.to(patientSocketId).emit('notification', notifPatient);
                    const doctorSocketId = userSocketMap[appointment.doctorId._id.toString()];
                    if (doctorSocketId) io.to(doctorSocketId).emit('notification', notifDoctor);
                } catch (socketError) {
                    console.log('Socket notification failed:', socketError.message);
                }

                console.log('Reminders sent successfully for appointment:', appointment._id);
            } else {
                console.log('Appointment not in reminder window:', slotDate);
            }
        }
    } catch (error) {
        console.error('Error sending appointment reminders:', error);
    }
};
setInterval(sendAppointmentReminders, 60 * 60 * 1000); // Run every hour