import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import appointmentRouter from './routes/appointmentRoutes.js';
import doctorRouter from './routes/doctorRoutes.js';
import './middleware/appointmentStatusUpdater.js';

const app = express();
const PORT = process.env.PORT || 5000;
connectDB();

const allowedOrigins = ['http://localhost:5173']; // Add frontend URL

app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials: true}));

// API Endpoints
app.get('/', (req, res) => {
    res.send('API working!');
});
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/doctor', doctorRouter);

app.listen(PORT, () => {console.log(`Server is running on port ${PORT}`);});