import React, { useState, useContext, useMemo } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../context/AppContext';
import DeleteConfirmationModal from '../DeleteConfirmationModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DoctorFeedbackModal = ({ doctor, onClose, onFeedbackDeleted }) => {
    const { backendUrl } = useContext(AppContext);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState(null);

    // Prepare data for the line chart
    const chartData = useMemo(() => {
        if (!doctor.ratings || doctor.ratings.length === 0) return [];
        
        // Sort ratings by date
        const sortedRatings = [...doctor.ratings].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        );

        // Create data points for the chart
        return sortedRatings.map((rating, index) => ({
            date: format(parseISO(rating.createdAt), 'MMM dd'),
            rating: rating.rating,
            // Calculate running average up to this point
            averageRating: sortedRatings
                .slice(0, index + 1)
                .reduce((sum, r) => sum + r.rating, 0) / (index + 1)
        }));
    }, [doctor.ratings]);

    const handleDeleteFeedback = async () => {
        try {
            const response = await axios.delete(`${backendUrl}/api/doctor-ratings/${doctor._id}/${feedbackToDelete}`, {
                withCredentials: true
            });

            if (response.data.success) {
                toast.success('Feedback deleted successfully');
                // Update the doctor's ratings list by removing the deleted feedback
                const updatedRatings = doctor.ratings.filter(rating => rating._id !== feedbackToDelete);
                doctor.ratings = updatedRatings;
                // Recalculate average rating
                const totalRating = updatedRatings.reduce((sum, rating) => sum + rating.rating, 0);
                doctor.averageRating = updatedRatings.length > 0 ? totalRating / updatedRatings.length : 0;
                onFeedbackDeleted(feedbackToDelete);
            }
        } catch (err) {
            console.error('Error deleting feedback:', err);
            toast.error('Failed to delete feedback');
        } finally {
            setShowDeleteModal(false);
            setFeedbackToDelete(null);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
        }
        if (hasHalfStar) {
            stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<FaRegStar key={`empty-${i}`} className="text-gray-300" />);
        }
        return stars;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl flex flex-col max-h-[90vh]">
                {/* Header - Fixed */}
                <div className="p-6 border-b border-gray-200 bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Doctor Feedback</h2>
                            <p className="text-gray-600 mt-1">Dr. {doctor.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Rating Trend Chart */}
                {chartData.length > 0 && (
                    <div className="p-6 border-b border-gray-200 bg-white">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Rating Trend</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{ fontSize: 12 }}
                                        tickMargin={10}
                                    />
                                    <YAxis 
                                        domain={[0, 5]} 
                                        tickCount={6}
                                        tick={{ fontSize: 12 }}
                                        tickMargin={10}
                                    />
                                    <Tooltip 
                                        formatter={(value) => value.toFixed(1)}
                                        labelFormatter={(label) => `Date: ${label}`}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="rating" 
                                        stroke="#F59E0B" 
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                        name="Rating"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="averageRating" 
                                        stroke="#3B82F6" 
                                        strokeWidth={2}
                                        dot={false}
                                        name="Average Rating"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Individual Ratings</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Average Rating</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {doctor.ratings.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No feedback available for this doctor.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {doctor.ratings.map((rating, index) => (
                                <div 
                                    key={index} 
                                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-medium text-gray-800">
                                                {rating.patientId?.name || 'Anonymous Patient'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {format(new Date(rating.createdAt), 'MMMM dd, yyyy')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center">
                                                <div className="flex mr-2">
                                                    {renderStars(rating.rating)}
                                                </div>
                                                <span className="text-lg font-semibold text-gray-700">
                                                    {rating.rating.toFixed(1)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setFeedbackToDelete(rating._id);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                                title="Delete feedback"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">{rating.feedback}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer - Fixed */}
                <div className="p-6 border-t border-gray-200 bg-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-600">
                                Total Feedback: {doctor.ratings.length}
                            </p>
                            <p className="text-sm text-gray-600">
                                Average Rating: {doctor.averageRating.toFixed(1)} / 5.0
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <DeleteConfirmationModal
                        showModal={showDeleteModal}
                        onClose={() => {
                            setShowDeleteModal(false);
                            setFeedbackToDelete(null);
                        }}
                        onConfirm={handleDeleteFeedback}
                        title="Delete Feedback"
                        message="Are you sure you want to delete this feedback? This action cannot be undone."
                    />
                )}
            </div>
        </div>
    );
};

export default DoctorFeedbackModal; 