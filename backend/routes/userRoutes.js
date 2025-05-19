import express from 'express';
import { getUserData, getAllPatients, getTotalPatients, getAllDoctors, updateProfile, getUserById } from '../controllers/userController.js';
import { userAuth } from '../middleware/userAuth.js';

const userRouter = express.Router();

userRouter.get('/data', userAuth, getUserData);

userRouter.get('/patient', userAuth, getAllPatients);
userRouter.get('/patient/count', userAuth, getTotalPatients);

userRouter.get('/doctor', userAuth, getAllDoctors);

userRouter.put('/update-profile', userAuth, updateProfile);

// Get a specific user's details
userRouter.get('/:id', userAuth, getUserById);

export default userRouter;