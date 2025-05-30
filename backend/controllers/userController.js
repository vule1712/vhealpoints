import userModel from "../models/userModel.js";
import appointmentModel from "../models/appointmentModel.js";

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

export const getDoctorPatients = async(req, res) => {
    try {
        const doctorId = req.user.userId;

        // Get all appointments for this doctor
        const appointments = await appointmentModel.find({ doctorId })
            .populate('patientId', 'name email bloodType')
            .select('patientId status');

        // Get unique patients who have appointments with this doctor
        const uniquePatients = appointments.reduce((acc, appointment) => {
            const patientId = appointment.patientId._id.toString();
            if (!acc[patientId]) {
                acc[patientId] = {
                    ...appointment.patientId.toObject(),
                    appointmentCount: 1,
                    lastAppointmentStatus: appointment.status
                };
            } else {
                acc[patientId].appointmentCount++;
                acc[patientId].lastAppointmentStatus = appointment.status;
            }
            return acc;
        }, {});

        const patients = Object.values(uniquePatients);
        
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

export const getDoctorTotalPatients = async(req, res) => {
    try {
        const doctorId = req.user.userId;
        
        // Get count of unique patients who have appointments with this doctor
        const uniquePatients = await appointmentModel.distinct('patientId', { doctorId });
        const count = uniquePatients.length;
        
        res.json({
            success: true,
            count
        });
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

export const getAllDoctors = async (req, res) => {
    try {
        const doctors = await userModel.find({ role: 'Doctor' })
            .select('-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt')
            .sort({ name: 1 });
        
        res.json({
            success: true,
            doctors
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching doctors'
        });
    }
};

export const updateProfile = async(req, res) => {
    try {
        const { userId } = req.user;
        const { name, specialization, clinicName, clinicAddress, bloodType, targetUserId } = req.body;

        // If targetUserId is provided, this is an admin update
        const userToUpdate = targetUserId ? await userModel.findById(targetUserId) : await userModel.findById(userId);
        
        if (!userToUpdate) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Update name if provided
        if (name) {
            userToUpdate.name = name;
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