import nodemailer from 'nodemailer';
import { getWelcomeEmailTemplate, getVerificationEmailTemplate, getPasswordResetEmailTemplate, getContactFormEmailTemplate, getAccountDeletionEmailTemplate, getAppointmentReminderEmailTemplate } from '../utils/emailTemplates.js';

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

// Send contact form email
const sendContactFormEmail = async (name, email, message) => {
    try {
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: 'vulephuonganh@gmail.com',
            subject: 'New Contact Form Submission - vHealPoints',
            html: getContactFormEmailTemplate(name, email, message)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending contact form email:', error);
        return false;
    }
};

// Send account deletion email
const sendAccountDeletionEmail = async (email, name, role) => {
    try {
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Account Deletion Notice - vHealPoints',
            html: getAccountDeletionEmailTemplate(name, role)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending account deletion email:', error);
        return false;
    }
};

// Send appointment reminder email
const sendAppointmentReminderEmail = async (email, name, appointmentDate, appointmentTime, otherPartyName, role) => {
    try {
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Appointment Reminder - vHealPoints',
            html: getAppointmentReminderEmailTemplate(name, appointmentDate, appointmentTime, otherPartyName, role)
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending appointment reminder email:', error);
        return false;
    }
};

export { 
    transporter, 
    sendWelcomeEmail, 
    sendVerificationEmail, 
    sendPasswordResetEmail, 
    sendContactFormEmail,
    sendAccountDeletionEmail,
    sendAppointmentReminderEmail
};