import { useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { AppContext } from '../../context/AppContext';

const EditFeedbackModal = ({ show, onClose, feedback, onUpdate }) => {
    const { backendUrl } = useContext(AppContext);
    const [rating, setRating] = useState(feedback.rating);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState(feedback.feedback);
    const [loading, setLoading] = useState(false);

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

        setLoading(true);

        try {
            const response = await axios.put(
                `${backendUrl}/api/doctor-ratings/${feedback.doctorId}`,
                {
                    rating,
                    feedback: comment.trim()
                },
                {
                    withCredentials: true
                }
            );

            if (response.data.success) {
                toast.success('Feedback updated successfully');
                onUpdate(response.data.rating);
                onClose();
            } else {
                toast.error(response.data.message || 'Failed to update feedback');
            }
        } catch (error) {
            console.error('Error updating feedback:', error);
            toast.error(error.response?.data?.message || 'Failed to update feedback');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ marginTop: '-82px' }}>
            <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">Edit Your Feedback</h2>
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
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
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
                                disabled={loading}
                                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update Feedback'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditFeedbackModal; 