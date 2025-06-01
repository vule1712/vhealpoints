import mongoose from "mongoose";
import availableSlotModel from "./availableSlotModel.js";

const appointmentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'availableSlot',
        required: true
    },
    status: {
        type: String,
        enum: ['Confirmed', 'Completed', 'Canceled'],
        default: 'Confirmed'
    },
    notes: {
        type: String
    },
    cancelReason: {
        type: String
    },
    doctorComment: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Add pre-find middleware to update slot status
appointmentSchema.pre('find', async function() {
    // Get all slots that are marked as booked
    const bookedSlots = await availableSlotModel.find({ isBooked: true });
    
    // For each booked slot, check if there's an active appointment
    for (const slot of bookedSlots) {
        const activeAppointment = await this.model.findOne({
            slotId: slot._id,
            status: { $in: ['Confirmed', 'Completed'] }
        });
        
        // If no active appointment exists, update slot status to available
        if (!activeAppointment) {
            await availableSlotModel.findByIdAndUpdate(slot._id, { isBooked: false });
        }
    }
});

const appointmentModel = mongoose.models.appointment || mongoose.model('appointment', appointmentSchema);

export default appointmentModel; 