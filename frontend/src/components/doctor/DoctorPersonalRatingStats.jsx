import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const DoctorPersonalRatingStats = ({ doctorId }) => {
    const { backendUrl } = useContext(AppContext);
    const [stats, setStats] = useState({
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: {
            '5': 0,
            '4': 0,
            '3': 0,
            '2': 0,
            '1': 0
        },
        timeSeriesData: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!doctorId) {
            setError('Doctor ID is required');
            setLoading(false);
            return;
        }
        
        // Validate doctorId format
        if (typeof doctorId !== 'string' || doctorId.length < 10) {
            setError('Invalid Doctor ID format');
            setLoading(false);
            return;
        }
        
        fetchRatingStats();
    }, [doctorId, backendUrl]);

    const fetchRatingStats = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching rating stats for doctorId:', doctorId);
            
            const response = await axios.get(`${backendUrl}/api/doctor-ratings/${doctorId}`, {
                withCredentials: true
            });

            console.log('Rating stats response:', response.data);

            if (response.data.success) {
                const { ratings, averageRating } = response.data;
                console.log('Processing ratings:', ratings);
                
                const ratingDistribution = {
                    '5': 0,
                    '4': 0,
                    '3': 0,
                    '2': 0,
                    '1': 0
                };

                // Process ratings for distribution
                ratings.forEach(rating => {
                    const roundedRating = Math.round(rating.rating);
                    if (ratingDistribution[roundedRating] !== undefined) {
                        ratingDistribution[roundedRating]++;
                    }
                });

                // Process ratings for time series
                const last6Months = Array.from({ length: 6 }, (_, i) => {
                    const date = subMonths(new Date(), i);
                    return {
                        month: format(date, 'MMM yyyy'),
                        startDate: startOfMonth(date),
                        endDate: endOfMonth(date),
                        ratings: {
                            '5': 0,
                            '4': 0,
                            '3': 0,
                            '2': 0,
                            '1': 0
                        }
                    };
                }).reverse();

                // Count ratings for each month
                ratings.forEach(rating => {
                    try {
                        const ratingDate = parseISO(rating.createdAt);
                        const monthData = last6Months.find(month => 
                            ratingDate >= month.startDate && ratingDate <= month.endDate
                        );
                        if (monthData) {
                            const roundedRating = Math.round(rating.rating).toString();
                            if (monthData.ratings[roundedRating] !== undefined) {
                                monthData.ratings[roundedRating]++;
                            }
                        }
                    } catch (dateError) {
                        console.error('Error processing rating date:', dateError, rating);
                    }
                });

                // Calculate average rating for each month
                const timeSeriesData = last6Months.map(month => {
                    const totalRatings = Object.values(month.ratings).reduce((a, b) => a + b, 0);
                    const averageRating = totalRatings > 0
                        ? Object.entries(month.ratings).reduce((acc, [rating, count]) => 
                            acc + (parseInt(rating) * count), 0) / totalRatings
                        : 0;

                    return {
                        month: month.month,
                        averageRating: parseFloat(averageRating.toFixed(1)),
                        ...month.ratings
                    };
                });

                const statsData = {
                    averageRating,
                    totalRatings: ratings.length,
                    ratingDistribution,
                    timeSeriesData
                };

                console.log('Setting stats:', statsData);
                setStats(statsData);
            } else {
                console.error('Failed to fetch rating stats:', response.data.message);
                setError(response.data.message || 'Failed to fetch rating statistics');
            }
        } catch (error) {
            console.error('Error fetching rating stats:', error);
            console.error('Error response:', error.response?.data);
            setError(error.response?.data?.message || 'Failed to fetch rating statistics');
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

    const chartData = Object.entries(stats.ratingDistribution)
        .map(([rating, count]) => ({
            rating: `${rating} Stars`,
            count,
            percentage: (count / stats.totalRatings) * 100
        }))
        .reverse();

    const colors = {
        '5': '#10B981', // green
        '4': '#3B82F6', // blue
        '3': '#F59E0B', // yellow
        '2': '#F97316', // orange
        '1': '#EF4444', // red
        averageRating: '#6366F1' // indigo
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    if (stats.totalRatings === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Rating Statistics</h2>
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <FaStar className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Ratings Yet</h3>
                    <p className="text-gray-500">You haven't received any patient ratings yet. Ratings will appear here once patients rate your services.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Rating Statistics</h2>
            
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm">
                    <h3 className="text-sm font-medium text-blue-600 mb-2">Average Rating</h3>
                    <div className="flex items-center">
                        <div className="flex mr-3">
                            {renderStars(stats.averageRating)}
                        </div>
                        <span className="text-3xl font-bold text-blue-700">
                            {stats.averageRating.toFixed(1)}
                        </span>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm">
                    <h3 className="text-sm font-medium text-green-600 mb-2">Total Ratings</h3>
                    <p className="text-3xl font-bold text-green-700">{stats.totalRatings}</p>
                </div>
            </div>

            {/* Rating Trends Chart */}
            <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-gray-800">Rating Trends (Last 6 Months)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={stats.timeSeriesData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="month" 
                                stroke="#666"
                                tick={{ fill: '#666' }}
                            />
                            <YAxis 
                                stroke="#666"
                                tick={{ fill: '#666' }}
                                domain={[0, 5]}
                                label={{ 
                                    value: 'Rating', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    style: { fill: '#666' }
                                }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value, name) => {
                                    if (name === 'averageRating') {
                                        return [`${value.toFixed(1)} stars`, 'Average Rating'];
                                    }
                                    return [`${value} ratings`, `${name} Stars`];
                                }}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="averageRating" 
                                name="Average Rating"
                                stroke={colors.averageRating}
                                strokeWidth={3}
                                dot={{ fill: colors.averageRating, strokeWidth: 2 }}
                                activeDot={{ r: 8, fill: colors.averageRating }}
                            />
                            {['5', '4', '3', '2', '1'].map(rating => (
                                <Line 
                                    key={rating}
                                    type="monotone" 
                                    dataKey={rating} 
                                    name={`${rating} Stars`}
                                    stroke={colors[rating]}
                                    strokeWidth={2}
                                    dot={{ fill: colors[rating], strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: colors[rating] }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Rating Distribution Bars */}
            <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">Detailed Distribution</h3>
                <div className="space-y-3">
                    {Object.entries(stats.ratingDistribution).reverse().map(([rating, count]) => (
                        <div key={rating} className="flex items-center">
                            <div className="w-16 flex items-center">
                                <span className="text-gray-600 font-medium">{rating}</span>
                                <FaStar className="text-yellow-400 ml-1" />
                            </div>
                            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                                    style={{
                                        width: `${(count / stats.totalRatings) * 100}%`
                                    }}
                                />
                            </div>
                            <span className="ml-3 text-gray-600 w-12 text-right font-medium">{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DoctorPersonalRatingStats; 