import mongoose from "mongoose";

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
        enum: ['Pending', 'Confirmed', 'Canceled', 'Completed'],
        default: 'Pending'
    },
    notes: {
        type: String
    },
    cancelReason: {
        type: String
    }
}, {
    timestamps: true
});

const appointmentModel = mongoose.models.appointment || mongoose.model('appointment', appointmentSchema);

export default appointmentModel; 