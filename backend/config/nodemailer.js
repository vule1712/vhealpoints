import nodemailer from 'nodemailer';
import { getWelcomeEmailTemplate, getVerificationEmailTemplate, getPasswordResetEmailTemplate } from '../utils/emailTemplates.js';

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
    try {
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to vHealPoints!',
            html: getWelcomeEmailTemplate(name)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};

// Send verification email
const sendVerificationEmail = async (email, name, otp) => {
    try {
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Verify Your Email - vHealPoints',
            html: getVerificationEmailTemplate(name, otp)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, otp) => {
    try {
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Password Reset Request - vHealPoints',
            html: getPasswordResetEmailTemplate(name, otp)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};

export { transporter, sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail };