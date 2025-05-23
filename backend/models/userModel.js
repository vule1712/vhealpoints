import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'Doctor', 'Patient'],
        required: true
    },
    
    // Doctor specific fields
    specialization: {
        type: String,
        required: function() {
            return this.role === 'Doctor';
        }
    },
    clinicName: {
        type: String,
        required: function() {
            return this.role === 'Doctor';
        }
    },
    clinicAddress: {
        type: String,
        required: function() {
            return this.role === 'Doctor';
        }
    },

    // Patient specific fields
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: function() {
            return this.role === 'Patient';
        }
    },
    medicalHistory: {
        type: [{
            condition: {
                type: String,
                required: true
            },
            diagnosisDate: {
                type: Date,
                required: true
            },
            status: {
                type: String,
                enum: ['Active', 'Resolved', 'Chronic'],
                required: true
            },
            notes: String
        }],
        default: function() {
            return this.role === 'Patient' ? [] : undefined;
        }
    },
    verifyOtp: {
        type: String,
        default: ''
    },
    verifyOtpExpireAt: {
        type: Number,
        default: 0
    },
    isAccountVerified: {
        type: Boolean,
        default: false
    },
    resetOtp: {
        type: String,
        default: ''
    },
    resetOtpExpireAt: {
        type: Number,
        default: 0
    },
})

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;