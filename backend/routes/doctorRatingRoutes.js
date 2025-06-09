import express from 'express';
import { userAuth } from '../middleware/userAuth.js';
import * as doctorRatingController from '../controllers/doctorRatingController.js';

const router = express.Router();

// Check if patient can rate doctor
router.get('/can-rate/:doctorId', userAuth, doctorRatingController.canRateDoctor);

// Submit a rating
router.post('/:doctorId', userAuth, doctorRatingController.submitRating);

// Update a rating
router.put('/:doctorId', userAuth, doctorRatingController.updateRating);

// Get doctor's ratings
router.get('/:doctorId', userAuth, doctorRatingController.getDoctorRatings);

// Delete a rating
router.delete('/:doctorId/:ratingId', userAuth, doctorRatingController.deleteRating);

export default router; 