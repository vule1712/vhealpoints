import mongoose from "mongoose";

const availableSlotSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    date: {
        type: Date,
        required: true,
        get: (date) => {
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    },
    startTime: {
        type: String,
        required: true,
        // Time should be in 12-hour format (e.g., "02:30 PM")
        validate: {
            validator: function(v) {
                return /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(v);
            },
            message: props => `${props.value} is not a valid 12-hour time format!`
        }
    },
    endTime: {
        type: String,
        required: true,
        // Time should be in 12-hour format (e.g., "02:30 PM")
        validate: {
            validator: function(v) {
                return /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(v);
            },
            message: props => `${props.value} is not a valid 12-hour time format!`
        }
    },
    isBooked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

const availableSlotModel = mongoose.models.availableSlot || mongoose.model('availableSlot', availableSlotSchema);

export default availableSlotModel; 