import { sendContactFormEmail } from '../config/nodemailer.js';

export const submitContactForm = async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.json({ success: false, message: 'Please fill all the fields' });
    }

    try {
        const emailSent = await sendContactFormEmail(name, email, message);
        
        if (emailSent) {
            res.json({ success: true, message: 'Message sent successfully' });
        } else {
            res.json({ success: false, message: 'Failed to send message' });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}; 