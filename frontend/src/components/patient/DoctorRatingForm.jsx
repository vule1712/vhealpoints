import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { AppContext } from '../../context/AppContext';

const DoctorRatingForm = ({ doctorId, onClose }) => {
    const navigate = useNavigate();
    const { backendUrl } = React.useContext(AppContext);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [canRate, setCanRate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkCanRate = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${backendUrl}/api/doctor-ratings/can-rate/${doctorId}`, { withCredentials: true });
                
                if (response.data.canRate === false) {
                    if (response.data.completedAppointments === 0) {
                        toast.error('You must have at least one completed appointment to rate this doctor.');
                    } else {
                        toast.error('You have already rated this doctor.');
                    }
                    if (onClose) onClose();
                }
                setCanRate(response.data.canRate);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to check rating eligibility.');
                if (onClose) onClose();
            } finally {
                setLoading(false);
            }
        };
        checkCanRate();
    }, [doctorId, backendUrl, onClose]);

    // Helper to render stars with half-star support
    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            const value = i;
            const halfValue = i - 0.5;
            let icon;
            let fillLevel = hover || rating;
            if (fillLevel >= value) {
                icon = <FaStar className="w-8 h-8 text-yellow-400" />;
            } else if (fillLevel >= halfValue) {
                icon = <FaStarHalfAlt className="w-8 h-8 text-yellow-400" />;
            } else {
                icon = <FaRegStar className="w-8 h-8 text-gray-300" />;
            }
            stars.push(
                <span key={i} className="relative inline-block">
                    {/* Left half (half star) */}
                    <button
                        type="button"
                        className="absolute left-0 top-0 w-4 h-8 z-10 focus:outline-none"
                        style={{ padding: 0, margin: 0 }}
                        onClick={() => setRating(halfValue)}
                        onMouseEnter={() => setHover(halfValue)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`Rate ${halfValue}`}
                    />
                    {/* Right half (full star) */}
                    <button
                        type="button"
                        className="absolute right-0 top-0 w-4 h-8 z-10 focus:outline-none"
                        style={{ padding: 0, margin: 0 }}
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHover(value)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`Rate ${value}`}
                    />
                    {/* Star icon (background) */}
                    {icon}
                </span>
            );
        }
        return stars;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            const response = await axios.post(
                `${backendUrl}/api/doctor-ratings/${doctorId}`,
                { rating, feedback: feedback.trim() },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Rating submitted successfully');
                if (onClose) onClose();
                else navigate(`/patient/doctor/${doctorId}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit rating');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (canRate === false) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">You cannot rate this doctor at this time.</p>
                <p className="text-sm text-gray-500 mt-2">You need to have at least one completed appointment to provide feedback.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Rate Your Doctor</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                    </label>
                    <div className="flex items-center space-x-1 relative">
                        {renderStars()}
                        <span className="ml-2 text-lg font-medium">
                            {rating > 0 ? `${rating.toFixed(1)} / 5` : 'Select rating'}
                        </span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feedback (Optional)
                    </label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="4"
                        placeholder="Share your experience with this doctor..."
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DoctorRatingForm; 