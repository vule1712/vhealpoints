import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import DoctorFeedbackModal from './DoctorFeedbackModal';

const DoctorRatingStats = () => {
    const { backendUrl } = useContext(AppContext);
    const [stats, setStats] = useState({
        topRatedDoctors: [],
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: {
            '5': 0,
            '4': 0,
            '3': 0,
            '2': 0,
            '1': 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        fetchRatingStats();
    }, [backendUrl]);

    const fetchRatingStats = async () => {
        try {
            setLoading(true);
            // Get all doctors
            const doctorsResponse = await axios.get(`${backendUrl}/api/user/doctor`, {
                withCredentials: true
            });

            if (!doctorsResponse.data.success) {
                throw new Error('Failed to fetch doctors');
            }

            const doctors = doctorsResponse.data.doctors;
            const doctorStats = [];
            let totalRatings = 0;
            let totalRatingSum = 0;
            const ratingDistribution = {
                '5': 0,
                '4': 0,
                '3': 0,
                '2': 0,
                '1': 0
            };

            // Get ratings for each doctor
            for (const doctor of doctors) {
                const ratingsResponse = await axios.get(`${backendUrl}/api/doctor-ratings/${doctor._id}`, {
                    withCredentials: true
                });

                if (ratingsResponse.data.success) {
                    const { ratings, averageRating } = ratingsResponse.data;
                    totalRatings += ratings.length;
                    totalRatingSum += averageRating * ratings.length;

                    // Update rating distribution
                    ratings.forEach(rating => {
                        const roundedRating = Math.round(rating.rating);
                        ratingDistribution[roundedRating]++;
                    });

                    if (ratings.length > 0) {
                        doctorStats.push({
                            doctorId: doctor._id,
                            name: doctor.name,
                            averageRating,
                            totalRatings: ratings.length,
                            ratings
                        });
                    }
                }
            }

            // Sort doctors by average rating
            doctorStats.sort((a, b) => b.averageRating - a.averageRating);

            setStats({
                topRatedDoctors: doctorStats.slice(0, 5), // Top 5 doctors
                averageRating: totalRatings > 0 ? totalRatingSum / totalRatings : 0,
                totalRatings,
                ratingDistribution
            });
        } catch (error) {
            console.error('Error fetching rating stats:', error);
            toast.error('Failed to fetch rating statistics');
        } finally {
            setLoading(false);
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
        return stars;
    };

    const handleDoctorClick = (doctor) => {
        setSelectedDoctor(doctor);
    };

    const handleFeedbackDeleted = (ratingId) => {
        // Refresh the rating stats after feedback is deleted
        fetchRatingStats();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Doctor Rating Statistics</h2>
            
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-600">Average Rating</h3>
                    <div className="flex items-center mt-2">
                        <div className="flex mr-2">
                            {renderStars(stats.averageRating)}
                        </div>
                        <span className="text-2xl font-bold text-blue-700">
                            {stats.averageRating.toFixed(1)}
                        </span>
                    </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-600">Total Ratings</h3>
                    <p className="text-2xl font-bold text-green-700 mt-2">{stats.totalRatings}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600">Rated Doctors</h3>
                    <p className="text-2xl font-bold text-purple-700 mt-2">{stats.topRatedDoctors.length}</p>
                </div>
            </div>

            {/* Rating Distribution */}
            <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Rating Distribution</h3>
                <div className="space-y-3">
                    {Object.entries(stats.ratingDistribution).reverse().map(([rating, count]) => (
                        <div key={rating} className="flex items-center">
                            <div className="w-16 flex items-center">
                                <span className="text-gray-600">{rating}</span>
                                <FaStar className="text-yellow-400 ml-1" />
                            </div>
                            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-400"
                                    style={{
                                        width: `${(count / stats.totalRatings) * 100}%`
                                    }}
                                />
                            </div>
                            <span className="ml-3 text-gray-600 w-12 text-right">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Rated Doctors */}
            <div>
                <h3 className="text-lg font-medium mb-4">Top Rated Doctors</h3>
                <div className="space-y-4">
                    {stats.topRatedDoctors.map((doctor) => (
                        <div 
                            key={doctor.doctorId} 
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleDoctorClick(doctor)}
                        >
                            <div>
                                <h4 className="font-medium">{doctor.name}</h4>
                                <div className="flex items-center mt-1">
                                    <div className="flex mr-2">
                                        {renderStars(doctor.averageRating)}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        ({doctor.totalRatings} ratings)
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-blue-600">
                                    {doctor.averageRating.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feedback Modal */}
            {selectedDoctor && (
                <DoctorFeedbackModal
                    doctor={selectedDoctor}
                    onClose={() => setSelectedDoctor(null)}
                    onFeedbackDeleted={handleFeedbackDeleted}
                />
            )}
        </div>
    );
};

export default DoctorRatingStats; 