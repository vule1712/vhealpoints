import mongoose from "mongoose";

const availableSlotSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    isBooked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const availableSlotModel = mongoose.models.availableSlot || mongoose.model('availableSlot', availableSlotSchema);

export default availableSlotModel; 