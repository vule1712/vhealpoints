import mongoose from 'mongoose';

const doctorRatingSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 0.5,
        max: 5,
        validate: {
            validator: function(v) {
                return v % 0.5 === 0;
            },
            message: 'Rating must be in increments of 0.5'
        }
    },
    feedback: {
        type: String,
        required: false,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a patient can only rate a doctor once
doctorRatingSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

export default mongoose.model('DoctorRating', doctorRatingSchema); 