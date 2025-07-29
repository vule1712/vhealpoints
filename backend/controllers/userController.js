import userModel from "../models/userModel.js";
import appointmentModel from "../models/appointmentModel.js";

export const getUserData = async(req, res) => {
    try {
        const {userId} = req.user;
        console.log('getUserData: Fetching user with ID:', userId);

        const user = await userModel.findById(userId).select('-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt');
        console.log('getUserData: Found user:', user);

        if (!user) {
            console.log('getUserData: User not found');
            return res.json({success: false, message: 'User not found'});
        }

        console.log('getUserData: Returning user data:', user);
        res.json({
            success: true,
            userData: user
        });

    } catch (error) {
        console.error('getUserData: Error:', error);
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
            // Defensive: skip if patientId is not populated
            if (!appointment.patientId || !appointment.patientId._id) return acc;
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
        
        // Get all appointments for this doctor
        const appointments = await appointmentModel.find({ doctorId }).select('patientId');
        // Filter out appointments with unpopulated or missing patientId
        const validPatientIds = appointments
            .filter(app => app.patientId)
            .map(app => app.patientId.toString());
        // Get unique patient IDs
        const uniquePatientIds = Array.from(new Set(validPatientIds));
        const count = uniquePatientIds.length;
        
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
        const { name, specialization, clinicName, clinicAddress, bloodType, targetUserId, aboutMe, phone } = req.body;
        
        console.log('updateProfile: Request body:', req.body);
        console.log('updateProfile: User ID:', userId);
        console.log('updateProfile: Target user ID:', targetUserId);

        // If targetUserId is provided, this is an admin update
        const userToUpdate = targetUserId ? await userModel.findById(targetUserId) : await userModel.findById(userId);
        
        if (!userToUpdate) {
            console.log('updateProfile: User not found');
            return res.json({ success: false, message: 'User not found' });
        }

        console.log('updateProfile: Found user to update:', userToUpdate);
        console.log('updateProfile: User role:', userToUpdate.role);

        // Update name if provided
        if (name !== undefined) {
            console.log('updateProfile: Updating name from', userToUpdate.name, 'to', name);
            userToUpdate.name = name;
        }

        // Update phone number if provided
        if (phone !== undefined) {
            console.log('updateProfile: Updating phone from', userToUpdate.phone, 'to', phone);
            userToUpdate.phone = phone;
        }

        // Update fields based on user role
        if (userToUpdate.role === 'Doctor') {
            if (specialization !== undefined) {
                console.log('updateProfile: Updating specialization from', userToUpdate.specialization, 'to', specialization);
                userToUpdate.specialization = specialization;
            }
            if (clinicName !== undefined) {
                console.log('updateProfile: Updating clinicName from', userToUpdate.clinicName, 'to', clinicName);
                userToUpdate.clinicName = clinicName;
            }
            if (clinicAddress !== undefined) {
                console.log('updateProfile: Updating clinicAddress from', userToUpdate.clinicAddress, 'to', clinicAddress);
                userToUpdate.clinicAddress = clinicAddress;
            }
            if (aboutMe !== undefined) {
                console.log('updateProfile: Updating aboutMe from', userToUpdate.aboutMe, 'to', aboutMe);
                userToUpdate.aboutMe = aboutMe;
            }
        } else if (userToUpdate.role === 'Patient') {
            if (bloodType !== undefined) {
                console.log('updateProfile: Updating bloodType from', userToUpdate.bloodType, 'to', bloodType);
                userToUpdate.bloodType = bloodType;
            }
        }

        console.log('Saving user data:', userToUpdate);
        await userToUpdate.save();
        console.log('User data saved successfully');

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