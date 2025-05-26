import express from 'express';
import { userAuth } from '../middleware/userAuth.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import {
    createAppointment,
    getDoctorAppointments,
    getPatientAppointments,
    updateAppointmentStatus,
    getAvailableSlots,
    getDoctorSlots,
    addSlot,
    deleteSlot,
    getAllAppointments,
    getRecentAppointments,
    deleteAppointment
} from '../controllers/appointmentController.js';

const appointmentRouter = express.Router();

// Create a new appointment
appointmentRouter.post('/create', userAuth, createAppointment);

// Get doctor's appointments
appointmentRouter.get('/doctor', userAuth, getDoctorAppointments);

// Get patient's appointments
appointmentRouter.get('/patient', userAuth, getPatientAppointments);

// Get available slots for a doctor
appointmentRouter.get('/available-slots/:doctorId', userAuth, getAvailableSlots);

// Doctor's slot management
appointmentRouter.get('/doctor-slots', userAuth, getDoctorSlots);
appointmentRouter.post('/add-slot', userAuth, addSlot);
appointmentRouter.delete('/slot/:slotId', userAuth, deleteSlot);

// Update appointment status
appointmentRouter.put('/:appointmentId/status', userAuth, updateAppointmentStatus);

// Cancel appointment (using deleteAppointment)
appointmentRouter.delete('/:appointmentId', userAuth, deleteAppointment);

// Admin routes
appointmentRouter.get('/admin/all', userAuth, isAdmin, getAllAppointments);
appointmentRouter.get('/admin/recent', userAuth, isAdmin, getRecentAppointments);
appointmentRouter.put('/admin/:appointmentId', userAuth, isAdmin, updateAppointmentStatus);
appointmentRouter.delete('/admin/:appointmentId', userAuth, isAdmin, deleteAppointment);

export default appointmentRouter; 