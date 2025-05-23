import express from 'express';
import { getUserData, getAllPatients, getTotalPatients, getAllDoctors, updateProfile, getUserById, getDoctorPatients, getDoctorTotalPatients } from '../controllers/userController.js';
import { userAuth } from '../middleware/userAuth.js';

const userRouter = express.Router();

userRouter.get('/data', userAuth, getUserData);

userRouter.get('/patient', userAuth, getAllPatients);
userRouter.get('/patient/count', userAuth, getTotalPatients);

// Doctor specific routes
userRouter.get('/doctor-patients', userAuth, getDoctorPatients);
userRouter.get('/doctor-total-patients', userAuth, getDoctorTotalPatients);

userRouter.get('/doctor', userAuth, getAllDoctors);

userRouter.put('/update-profile', userAuth, updateProfile);

// Get a specific user's details
userRouter.get('/:id', userAuth, getUserById);

export default userRouter;