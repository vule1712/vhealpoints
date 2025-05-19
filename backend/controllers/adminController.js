import User from '../models/userModel.js';
import mongoose from 'mongoose';

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password from the response
        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching users' 
        });
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        if (!['Admin', 'Doctor', 'Patient'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent changing the role of the last admin
        if (user.role === 'Admin' && role !== 'Admin') {
            const adminCount = await User.countDocuments({ role: 'Admin' });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot change role of the last admin'
                });
            }
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User role updated successfully'
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role'
        });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting the last admin
        if (user.role === 'Admin') {
            const adminCount = await User.countDocuments({ role: 'Admin' });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the last admin'
                });
            }
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const verifiedUsers = await User.countDocuments({ isAccountVerified: true });
        const doctors = await User.countDocuments({ role: 'Doctor' });
        const patients = await User.countDocuments({ role: 'Patient' });

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                verifiedUsers,
                doctors,
                patients
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching dashboard statistics' 
        });
    }
};

// Get single user details
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const user = await User.findById(userId, '-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            userData: user
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details'
        });
    }
}; 