import userModel from "../models/userModel.js";

export const getUserData = async(req, res) => {
    try {
        const {userId} = req.user;

        const user = await userModel.findById(userId).select('-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt');

        if (!user) {
            return res.json({success: false, message: 'User not found'});
        }

        res.json({
            success: true,
            userData: user
        });

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

export const getAllPatients = async(req, res) => {
    try {
        const patients = await userModel.find({ role: 'Patient' }).select('-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt');
        
        res.json({
            success: true,
            patients
        });
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

export const getTotalPatients = async(req, res) => {
    try {
        const count = await userModel.countDocuments({ role: 'Patient' });
        
        res.json({
            success: true,
            count
        });
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

export const getAllDoctors = async(req, res) => {
    try {
        const doctors = await userModel.find({ role: 'Doctor' }).select('-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt');
        
        res.json({
            success: true,
            doctors
        });
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

export const updateProfile = async(req, res) => {
    try {
        const { userId } = req.user;
        const { specialization, clinicName, clinicAddress, bloodType, targetUserId } = req.body;

        // If targetUserId is provided, this is an admin update
        const userToUpdate = targetUserId ? await userModel.findById(targetUserId) : await userModel.findById(userId);
        
        if (!userToUpdate) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Update fields based on user role
        if (userToUpdate.role === 'Doctor') {
            userToUpdate.specialization = specialization;
            userToUpdate.clinicName = clinicName;
            userToUpdate.clinicAddress = clinicAddress;
        } else if (userToUpdate.role === 'Patient') {
            userToUpdate.bloodType = bloodType;
        }

        await userToUpdate.save();

        // Return the complete updated user data
        res.json({
            success: true,
            message: 'Profile updated successfully',
            userData: userToUpdate
        });

    } catch (error) {
        console.error('Profile update error:', error);
        return res.json({ success: false, message: error.message });
    }
}

export const getUserById = async(req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(id).select('-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt');
        
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            userData: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.json({ success: false, message: error.message });
    }
}