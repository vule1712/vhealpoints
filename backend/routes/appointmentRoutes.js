import express from 'express';
import { userAuth } from '../middleware/userAuth.js';
import {
    createAppointment,
    getDoctorAppointments,
    getPatientAppointments,
    updateAppointmentStatus,
    cancelAppointment,
    getAvailableSlots,
    getDoctorSlots,
    addSlot,
    deleteSlot
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

// Cancel appointment
appointmentRouter.delete('/:appointmentId', userAuth, cancelAppointment);

export default appointmentRouter; 