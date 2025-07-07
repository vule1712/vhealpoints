import express from 'express';
import { register, login, logout, sendVerifyOtp, verifyEmail, isAuthenticated, checkAuthStatus, sendResetOtp, resetPassword, googleLogin } from '../controllers/authController.js';
import { userAuth } from '../middleware/userAuth.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/google-login', googleLogin);
authRouter.post('/logout', logout);

authRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);
authRouter.post('/verify-account', userAuth, verifyEmail);
authRouter.get('/is-auth', checkAuthStatus);

authRouter.post('/send-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);

export default authRouter;