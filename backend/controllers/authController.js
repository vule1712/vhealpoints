import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';

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
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 day
        });

        // Send welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to vHealPoints!',
            text:   `Hello ${name}!
                    \n\nWelcome to vHealPoints! We are glad to have you on board.
                    \n\nYour account has been successfully created with email: ${email}.
                    \n\nBest regards,\nvHealPoints Team`
        }

        await transporter.sendMail(mailOptions);

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
        res.cookie('token', token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 day
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
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
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
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP for account verification is ${otp}. It is valid for 5 minutes.`
        }
        await transporter.sendMail(mailOption);

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
        return res.json({success: true, message: 'User is authenticated'});
    } catch (error) {
        return res.json({success: false, message: error.message});
        
    }
}

// Send password reset OTP
export const sendResetOtp = async (req, res) => {
    const {email} = req.body;

    if (!email) {
        return res.json({success: false, message: 'Email is required'});
    }

    try {

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
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is ${otp}. It is valid for 5 minutes.`
        };
        await transporter.sendMail(mailOption);

        return res.json({success: true, message: 'OTP sent to your email'});

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