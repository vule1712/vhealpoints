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
    phone: {
        type: String,
        default: ''
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
    aboutMe: {
        type: String,
        default: ''
    },

    // Patient specific fields
    bloodType: {
        type: String,
        enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        default: ''
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