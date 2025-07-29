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
        required: function() {
            return !this.googleId; // Password is required only if not using Google OAuth
        }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    googleEmail: {
        type: String,
        unique: true,
        sparse: true
    },
    avatar: {
        type: String,
        default: ''
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
        default: ''
    },
    clinicName: {
        type: String,
        default: ''
    },
    clinicAddress: {
        type: String,
        default: ''
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