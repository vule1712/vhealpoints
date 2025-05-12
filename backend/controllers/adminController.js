import User from '../models/userModel.js';

export const getAllUsers = async (req, res) => {
    try {
        // Verify admin role
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        const users = await User.find({}, '-password'); // Exclude password from the response
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        // Verify admin role
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        const totalUsers = await User.countDocuments();
        const verifiedUsers = await User.countDocuments({ isAccountVerified: true });
        const pendingVerifications = await User.countDocuments({ isAccountVerified: false });

        res.status(200).json({
            totalUsers,
            verifiedUsers,
            pendingVerifications
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard statistics' });
    }
}; 