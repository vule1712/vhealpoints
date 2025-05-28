import express from 'express';
import { userAuth, adminAuth } from '../middleware/userAuth.js';
import {
    createAppointment,
    getDoctorAppointments,
    getPatientAppointments,
    updateAppointmentStatus,
    getAvailableSlots,
    getDoctorSlots,
    addSlot,
    updateSlot,
    deleteSlot,
    getAllAppointments,
    getRecentAppointments,
    deleteAppointment,
    adminUpdateAppointment,
    adminDeleteAppointment,
    getDoctorSlotsAdmin,
    addSlotAdmin,
    updateSlotAdmin,
    deleteSlotAdmin,
    getDoctorRecentAppointments,
    getPatientRecentAppointments
} from '../controllers/appointmentController.js';

const appointmentRouter = express.Router();

// Create a new appointment
appointmentRouter.post('/create', userAuth, createAppointment);

// Get doctor's appointments
appointmentRouter.get('/doctor', userAuth, getDoctorAppointments);
appointmentRouter.get('/doctor/recent', userAuth, getDoctorRecentAppointments);

// Get patient's appointments
appointmentRouter.get('/patient', userAuth, getPatientAppointments);
appointmentRouter.get('/patient/recent', userAuth, getPatientRecentAppointments);

// Get available slots for a doctor
appointmentRouter.get('/available-slots/:doctorId', userAuth, getAvailableSlots);

// Doctor's slot management
appointmentRouter.get('/doctor-slots', userAuth, getDoctorSlots);
appointmentRouter.post('/add-slot', userAuth, addSlot);
appointmentRouter.put('/slot/:slotId', userAuth, updateSlot);
appointmentRouter.delete('/slot/:slotId', userAuth, deleteSlot);

// Update appointment status
appointmentRouter.put('/:appointmentId/status', userAuth, updateAppointmentStatus);

// Cancel appointment (using deleteAppointment)
appointmentRouter.delete('/:appointmentId', userAuth, deleteAppointment);

// Admin routes
appointmentRouter.get('/admin/all', adminAuth, getAllAppointments);
appointmentRouter.get('/admin/recent', adminAuth, getRecentAppointments);
appointmentRouter.put('/admin/:appointmentId', adminAuth, adminUpdateAppointment);
appointmentRouter.delete('/admin/:appointmentId', adminAuth, adminDeleteAppointment);

// Admin slot management routes
appointmentRouter.get('/doctor-slots/:doctorId', adminAuth, getDoctorSlotsAdmin);
appointmentRouter.post('/add-slot/:doctorId', adminAuth, addSlotAdmin);
appointmentRouter.put('/admin/slot/:slotId', adminAuth, updateSlotAdmin);
appointmentRouter.delete('/admin/slot/:slotId', adminAuth, deleteSlotAdmin);

export default appointmentRouter; 