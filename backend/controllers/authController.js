import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import userModel from '../models/userModel.js';
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from '../config/nodemailer.js';

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req, res) => {
    const {name, email, password, role} = req.body;

    if (!name || !email || !password || !role) {
        return res.json({success: false, message: 'Please fill all the fields'});
    }

    try {
        // Check if user already exists
        const existingUser = await userModel.findOne({email});
        if (existingUser) {
            return res.json({success: false, message: 'User already exists'});
        }

        // encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userModel({
            name,
            email,
            password: hashedPassword,
            role
        });
        await user.save();

        // Generate JWT token
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn:'7d'});
        res.cookie('token', token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day
            path: '/'
        });

        // Send welcome email
        await sendWelcomeEmail(email, name);

        res.json({success: true, message: 'Registration successful'});
        
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.json({success: false, message: 'Please fill all the fields'});
    }

    try {
        // Check if user exists
        const user = await userModel.findOne({email});
        if (!user) {
            return res.json({success: false, message: 'Invalid email address'});
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({success: false, message: 'Invalid password'});
        }

        // Generate JWT token
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn:'7d'});
        console.log('Login - Generated token:', token);
        console.log('Login - NODE_ENV:', process.env.NODE_ENV);
        
        res.cookie('token', token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day
            path: '/'
        });
        
        console.log('Login - Cookie set with options:', {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true, 
            message: 'Login successful',
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                isAccountVerified: user.isAccountVerified
            }
        });

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        return res.json({success: true, message: 'Logout successful'});

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

// Send OTP for email verification
export const sendVerifyOtp = async (req, res) => {
    try {
        const {userId} = req.user;

        // find user from db
        const user = await userModel.findById(userId);

        if(user.isAccountVerified) {
            return res.json({success: false, message: 'Account already verified'});
        }

        // Generate OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digit OTP

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

        await user.save();

        // Send OTP email
        await sendVerificationEmail(user.email, user.name, otp);

        res.json({success: true, message: 'OTP sent successfully'});

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

// Verify OTP for email verification
export const verifyEmail = async (req, res) => {
        const {userId} = req.user;
        const {otp} = req.body;

        if (!userId || !otp) {
            return res.json({success: false, message: 'Missing details'});
        }

        try {
            const user = await userModel.findById(userId);

            if (!user) {
                return res.json({success: false, message: 'User not found'});
            }

            if (user.verifyOtp === '' || user.verifyOtp !== otp) {
                return res.json({success: false, message: 'Invalid OTP'});
            }

            if (user.verifyOtpExpireAt < Date.now()) {
                return res.json({success: false, message: 'OTP expired'});
            }

            user.isAccountVerified = true;
            user.verifyOtp = '';
            user.verifyOtpExpireAt = 0;

            await user.save();
            return res.json({
                success: true, 
                message: 'Account verified successfully',
                user: {
                    role: user.role
                }
            });

        } catch (error) {
            return res.json({success: false, message: error.message});
        }
}

// Check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        console.log('isAuthenticated - req.user:', req.user);
        const {userId} = req.user;
        console.log('isAuthenticated - userId:', userId);
        
        // Get user data to return verification status
        const user = await userModel.findById(userId).select('-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt');
        console.log('isAuthenticated - user found:', user ? 'yes' : 'no');
        
        if (!user) {
            console.log('isAuthenticated - User not found in database');
            return res.json({success: false, message: 'User not found'});
        }
        
        console.log('isAuthenticated - Returning user data:', {
            success: true,
            message: 'User is authenticated',
            userData: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAccountVerified: user.isAccountVerified
            }
        });
        
        return res.json({
            success: true, 
            message: 'User is authenticated',
            userData: user
        });
    } catch (error) {
        console.log('isAuthenticated - Error:', error.message);
        return res.json({success: false, message: error.message});
        
    }
}

// Send OTP for password reset
export const sendResetOtp = async (req, res) => {
    try {
        const {email} = req.body;

        const user = await userModel.findOne({email});
        if (!user) {
            return res.json({success: false, message: 'User not found'});
        }

        // Generate OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digit OTP

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

        await user.save();

        // Send OTP email
        await sendPasswordResetEmail(user.email, user.name, otp);

        res.json({success: true, message: 'OTP sent successfully'});

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

// Reset user password
export const resetPassword = async (req, res) => {
    const {email, otp, newPassword} = req.body;

    if (!email || !otp || !newPassword) {
        return res.json({success: false, message: 'Please fill all the fields'});
    }

    try {
        
        const user = await userModel.findOne({email});

        if (!user) {
            return res.json({success: false, message: 'User not found'});
        }

        if (user.resetOtp === '' || user.resetOtp !== otp) {
            return res.json({success: false, message: 'Invalid OTP'});
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({success: false, message: 'OTP expired'});
        }

        // Encrypt new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;
        
        await user.save();
        return res.json({success: true, message: 'Password has been reset successfully'});

    } catch (error) {
        return res.json({success: false, message: error.message});
        
    }
}

// Google OAuth Login
export const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.json({ success: false, message: 'Google token is required' });
        }

        // Get user info from Google using access token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!userInfoResponse.ok) {
            return res.json({ success: false, message: 'Failed to get user info from Google' });
        }

        const userInfo = await userInfoResponse.json();
        const { id: googleId, email, name, picture } = userInfo;

        // Check if user already exists with this Google ID
        let user = await userModel.findOne({ googleId });

        if (!user) {
            // Check if user exists with this email but different login method
            user = await userModel.findOne({ email });
            
            if (user) {
                // User exists but hasn't linked Google account
                if (user.googleId) {
                    return res.json({ success: false, message: 'Account already exists with different login method' });
                }
                
                // Link Google account to existing user
                user.googleId = googleId;
                user.googleEmail = email;
                user.avatar = picture;
                // Keep existing verification status - don't auto-verify
                await user.save();
            } else {
                // Create new user with Google OAuth - always as Patient
                user = new userModel({
                    name,
                    email,
                    googleId,
                    googleEmail: email,
                    avatar: picture,
                    role: 'Patient', // Always create as Patient
                    isAccountVerified: false // Require manual verification
                });
                await user.save();

                // Send welcome email
                await sendWelcomeEmail(email, name);
            }
        }

        // Generate JWT token
        const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        return res.json({
            success: true,
            message: 'Google login successful',
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                isAccountVerified: user.isAccountVerified,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Google login error:', error);
        return res.json({ success: false, message: 'Google login failed' });
    }
};