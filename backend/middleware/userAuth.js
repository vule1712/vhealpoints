import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const userAuth = async (req, res, next) => {
    // Try to get token from cookies first, then from Authorization header
    let token = req.cookies.token;
    
    if (!token) {
        // Try Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

    console.log('userAuth middleware - cookies:', req.cookies);
    console.log('userAuth middleware - auth header:', req.headers.authorization);
    console.log('userAuth middleware - token:', token);

    if (!token) {
        console.log('userAuth middleware - No token found');
        return res.json({success: false, message: 'Unauthorized. Please login again'});
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        console.log('userAuth middleware - tokenDecode:', tokenDecode);

        if(tokenDecode.id) {
            // Get user data to check verification status
            const user = await userModel.findById(tokenDecode.id);
            console.log('userAuth middleware - user found:', user ? 'yes' : 'no');
            
            if (!user) {
                console.log('userAuth middleware - User not found in database');
                return res.json({success: false, message: 'User not found'});
            }
            
            // Add user data to request
            req.user = { 
                userId: tokenDecode.id,
                isVerified: user.isAccountVerified,
                role: user.role
            };
            console.log('userAuth middleware - req.user set:', req.user);
        } else {
            console.log('userAuth middleware - No id in token');
            return res.json({success: false, message: 'Unauthorized. Please login again'});
        }
        next();

    } catch (error) {
        console.log('userAuth middleware - Error:', error.message);
        return res.json({success: false, message: error.message});
    }
}

const adminAuth = async (req, res, next) => {
    // Try to get token from cookies first, then from Authorization header
    let token = req.cookies.token;
    
    if (!token) {
        // Try Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

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

const doctorAuth = async (req, res, next) => {
    try {
        // Check if user and role exist
        if (!req.user || !req.user.role) {
            return res.json({
                success: false,
                message: 'User role not found'
            });
        }

        if (req.user.role !== 'Doctor') {
            return res.json({
                success: false,
                message: 'Not authorized as doctor'
            });
        }
        next();
    } catch (error) {
        console.error('Error in doctorAuth middleware:', error);
        res.json({
            success: false,
            message: 'Not authorized as doctor'
        });
    }
}

export { userAuth, adminAuth, doctorAuth };