const getWelcomeEmailTemplate = (name) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #38B6FF;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 0 0 5px 5px;
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #38B6FF;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welcome to vHealPoints!</h1>
        </div>
        <div class="content">
            <p>Dear ${name},</p>
            <p>Welcome to vHealPoints! We're excited to have you join our healthcare platform. With vHealPoints, you can:</p>
            <ul>
                <li>Find and book appointments with qualified doctors</li>
                <li>Manage your medical appointments easily</li>
                <li>Receive appointment reminders</li>
                <li>Track your medical history</li>
            </ul>
            <p>To get started, please verify your email address by clicking the button below:</p>
            <a href="${process.env.FRONTEND_URL}/email-verify" class="button">Verify Email</a>
            <p>If you have any questions or need assistance, our support team is here to help.</p>
            <p>Best regards,<br>The vHealPoints Team</p>
        </div>
        <div class="footer">
            <p>This email was sent to you because you registered on vHealPoints.</p>
            <p>© 2025 vHealPoints. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
};

const getVerificationEmailTemplate = (name, otp) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #38B6FF;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 0 0 5px 5px;
            }
            .otp-box {
                background-color: #fff;
                border: 2px solid #38B6FF;
                padding: 15px;
                text-align: center;
                font-size: 24px;
                font-weight: bold;
                margin: 20px 0;
                border-radius: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <p>Dear ${name},</p>
            <p>Thank you for registering with vHealPoints. To complete your registration, please use the following OTP to verify your email address:</p>
            <div class="otp-box">
                ${otp}
            </div>
            <p>This OTP will expire in 5 minutes.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
            <p>Best regards,<br>The vHealPoints Team</p>
        </div>
        <div class="footer">
            <p>This email was sent to you because you registered on vHealPoints.</p>
            <p>© 2025 vHealPoints. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
};

const getPasswordResetEmailTemplate = (name, otp) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #38B6FF;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 0 0 5px 5px;
            }
            .otp-box {
                background-color: #fff;
                border: 2px solid #38B6FF;
                padding: 15px;
                text-align: center;
                font-size: 24px;
                font-weight: bold;
                margin: 20px 0;
                border-radius: 5px;
            }
            .warning {
                color: #dc2626;
                font-size: 14px;
                margin-top: 20px;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Dear ${name},</p>
            <p>We received a request to reset your password. Please use the following OTP to reset your password:</p>
            <div class="otp-box">
                ${otp}
            </div>
            <p>This OTP will expire in 5 minutes.</p>
            <p class="warning">If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
            <p>Best regards,<br>The vHealPoints Team</p>
        </div>
        <div class="footer">
            <p>This email was sent to you because you requested a password reset on vHealPoints.</p>
            <p>© 2025 vHealPoints. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
};

const getContactFormEmailTemplate = (name, email, message) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #38B6FF;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 0 0 5px 5px;
            }
            .message-box {
                background-color: #fff;
                border: 2px solid #38B6FF;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
            <p>You have received a new message from the contact form:</p>
            <div class="message-box">
                <p><strong>From:</strong> ${name} (${email})</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            </div>
            <p>Please respond to this inquiry as soon as possible.</p>
        </div>
        <div class="footer">
            <p>This email was sent from the vHealPoints contact form.</p>
            <p>© 2025 vHealPoints. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
};

const getAccountDeletionEmailTemplate = (name, role) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #dc2626;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 0 0 5px 5px;
            }
            .warning {
                color: #dc2626;
                font-size: 14px;
                margin-top: 20px;
                padding: 15px;
                background-color: #fee2e2;
                border-radius: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Account Deletion Notice</h1>
        </div>
        <div class="content">
            <p>Dear ${name},</p>
            <p>This email is to inform you that your ${role} account on vHealPoints has been deleted by an administrator.</p>
            <div class="warning">
                <p><strong>Important:</strong> All your data associated with this account has been permanently removed from our system.</p>
            </div>
            <p>If you believe this action was taken in error, please contact our support team immediately.</p>
            <p>If you wish to create a new account in the future, you may do so by registering again on our platform.</p>
            <p>Best regards,<br>The vHealPoints Team</p>
        </div>
        <div class="footer">
            <p>This email was sent to you because your vHealPoints account was deleted.</p>
            <p>© 2025 vHealPoints. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
};

const getAppointmentReminderEmailTemplate = (recipientName, appointmentDate, appointmentTime, otherPartyName, role) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #38B6FF; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Appointment Reminder</h1>
        </div>
        <div class="content">
            <p>Dear ${recipientName},</p>
            <p>This is a friendly reminder that you have an upcoming appointment ${role === 'Doctor' ? 'with patient' : 'with Dr.'} <b>${otherPartyName}</b>.</p>
            <p><b>Date:</b> ${appointmentDate}<br/>
            <b>Time:</b> ${appointmentTime}</p>
            <p>Please make sure to be available at the scheduled time.</p>
            <p>Best regards,<br/>The vHealPoints Team</p>
        </div>
        <div class="footer">
            <p>This is an automated reminder from vHealPoints.</p>
            <p>© 2025 vHealPoints. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
};

export {
    getWelcomeEmailTemplate,
    getVerificationEmailTemplate,
    getPasswordResetEmailTemplate,
    getContactFormEmailTemplate,
    getAccountDeletionEmailTemplate,
    getAppointmentReminderEmailTemplate
}; 