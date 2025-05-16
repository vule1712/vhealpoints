import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const userAuth = async (req, res, next) => {
    const {token} = req.cookies;

    if (!token) {
        return res.json({success: false, message: 'Unauthorized. Please login again'});
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if(tokenDecode.id) {
            // Get user data to check verification status
            const user = await userModel.findById(tokenDecode.id);
            if (!user) {
                return res.json({success: false, message: 'User not found'});
            }
            
            // Add user data to request
            req.user = { 
                userId: tokenDecode.id,
                isVerified: user.isAccountVerified
            };
        } else {
            return res.json({success: false, message: 'Unauthorized. Please login again'});
        }
        next();

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

const adminAuth = async (req, res, next) => {
    const {token} = req.cookies;

    if (!token) {
        return res.json({success: false, message: 'Unauthorized. Please login again'});
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if(tokenDecode.id) {
            // Get user data to check admin role
            const user = await userModel.findById(tokenDecode.id);
            if (!user) {
                return res.json({success: false, message: 'User not found'});
            }
            
            // Check if user is admin
            if (user.role !== 'Admin') {
                return res.json({success: false, message: 'Access denied. Admin privileges required'});
            }
            
            // Add user data to request
            req.user = { 
                userId: tokenDecode.id,
                isVerified: user.isAccountVerified,
                role: user.role
            };
        } else {
            return res.json({success: false, message: 'Unauthorized. Please login again'});
        }
        next();

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

export { userAuth, adminAuth };