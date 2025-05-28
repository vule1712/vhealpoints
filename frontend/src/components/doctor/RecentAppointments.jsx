import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { format, parseISO } from 'date-fns';

const RecentAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { backendUrl } = useContext(AppContext);

    const formatTime = (timeString) => {
        try {
            // If the time is already in HH:mm format, return it directly
            if (/^\d{2}:\d{2}$/.test(timeString)) {
                return timeString;
            }
            
            // If it's a full date string, extract just the time part
            const date = new Date(timeString);
            return format(date, 'hh:mm a');
        } catch (error) {
            return timeString; // Return original string if parsing fails
        }
    };

    const formatDate = (dateString) => {
        try {
            return format(parseISO(dateString), 'MMM d, yyyy');
        } catch (error) {
            return dateString;
        }
    };

    const fetchRecentAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${backendUrl}/api/appointments/doctor/recent`, {
                withCredentials: true
            });
            if (response.data.success) {
                setAppointments(response.data.data || []);
            } else {
                setError(response.data.message || 'Failed to fetch appointments');
                toast.error(response.data.message || 'Failed to fetch appointments');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error fetching recent appointments');
            toast.error(error.response?.data?.message || 'Error fetching recent appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecentAppointments();
    }, [backendUrl]);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Recent Appointments</h2>
                </div>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="border-b border-gray-200 pb-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Recent Appointments</h2>
                </div>
                <div className="text-red-500 text-center py-4">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Appointments</h2>
                <Link 
                    to="/doctor/appointment-history" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    View All
                </Link>
            </div>
            
            <div className="space-y-4">
                {appointments && appointments.length > 0 ? (
                    appointments.map((appointment) => (
                        <div 
                            key={appointment._id} 
                            className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {appointment.patientId.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Patient
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                    appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                    appointment.status === 'Canceled' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                    {appointment.status}
                                </span>
                            </div>
                            
                            <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                    Date: {formatDate(appointment.slotId.date)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Time: {formatTime(appointment.slotId.startTime)} - {formatTime(appointment.slotId.endTime)}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4">No recent appointments</p>
                )}
            </div>
        </div>
    );
};

export default RecentAppointments; 