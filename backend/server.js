import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import http from 'http';
import { initSocket, getIO, getUserSocketMap } from './socket.js';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import appointmentRouter from './routes/appointmentRoutes.js';
import doctorRouter from './routes/doctorRoutes.js';
import contactRouter from './routes/contactRoutes.js';
import doctorRatingRoutes from './routes/doctorRatingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
const server = http.createServer(app);
const io = initSocket(server);
const PORT = process.env.PORT || 5000;
connectDB();

const allowedOrigins = [
        'http://localhost:5173',
        'https://vhealpoints.vercel.app',
        'https://vhealpoints.onrender.com'
    ];

// Add Vercel preview domains dynamically
const vercelPreviewPattern = /^https:\/\/vhealpoints-.*-vulephuonganhs-projects\.vercel\.app$/;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin
        if (!origin) return callback(null, true);
        
        // Allow localhost and main Vercel domain
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Allow Vercel preview domains
        if (vercelPreviewPattern.test(origin)) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use((req, res, next) => {
    req.io = getIO();
    req.userSocketMap = getUserSocketMap();
    next();
});

// API Endpoints
app.get('/', (req, res) => {
    res.send('API working!');
});
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/contact', contactRouter);
app.use('/api/doctor-ratings', doctorRatingRoutes);
app.use('/api/notifications', notificationRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});