import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../context/AppContext';
import { format, parseISO } from 'date-fns';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [doctorFilter, setDoctorFilter] = useState('all');
    const { backendUrl } = useContext(AppContext);

    const formatTime = (timeString) => {
        try {
            // If the time is already in HH:mm format, return it directly
            if (/^\d{2}:\d{2}$/.test(timeString)) {
                return timeString;
            }
            
            // If it's a full date string, extract just the time part
            const date = new Date(timeString);
            return format(date, 'HH:mm');
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'Confirmed':
                return 'bg-green-100 text-green-800';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Canceled':
                return 'bg-red-100 text-red-800';
            case 'Completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Get unique doctors from appointments
    const getUniqueDoctors = () => {
        const doctors = appointments.map(app => ({
            id: app.doctorId._id,
            name: app.doctorId.name,
            specialization: app.doctorId.specialization
        }));
        return Array.from(new Set(doctors.map(d => JSON.stringify(d))))
            .map(d => JSON.parse(d));
    };

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${backendUrl}/api/appointments/admin/all`, {
                withCredentials: true
            });
            if (response.data.success) {
                setAppointments(response.data.data || []);
            } else {
                setError(response.data.message || 'Failed to fetch appointments');
                toast.error(response.data.message || 'Failed to fetch appointments');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error fetching appointments');
            toast.error(error.response?.data?.message || 'Error fetching appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [backendUrl]);

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        try {
            const response = await axios.put(
                `${backendUrl}/api/appointments/admin/${appointmentId}`,
                { status: newStatus },
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success('Appointment status updated successfully');
                fetchAppointments();
            } else {
                toast.error(response.data.message || 'Failed to update appointment status');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating appointment status');
        }
    };

    const handleDelete = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to delete this appointment?')) return;

        try {
            const response = await axios.delete(
                `${backendUrl}/api/appointments/admin/${appointmentId}`,
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success('Appointment deleted successfully');
                fetchAppointments();
            } else {
                toast.error(response.data.message || 'Failed to delete appointment');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error deleting appointment');
        }
    };

    const filteredAppointments = appointments.filter(appointment => {
        const statusMatch = filter === 'all' || appointment.status === filter;
        const doctorMatch = doctorFilter === 'all' || appointment.doctorId._id === doctorFilter;
        return statusMatch && doctorMatch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="border-b border-gray-200 pb-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="text-red-500 text-center py-4">{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Appointments</h1>
                    <div className="flex space-x-4">
                        <select
                            value={doctorFilter}
                            onChange={(e) => setDoctorFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Doctors</option>
                            {getUniqueDoctors().map(doctor => (
                                <option key={doctor.id} value={doctor.id}>
                                    Dr. {doctor.name} ({doctor.specialization})
                                </option>
                            ))}
                        </select>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Canceled">Canceled</option>
                        </select>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAppointments.length > 0 ? (
                                    filteredAppointments.map((appointment) => (
                                        <tr key={appointment._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 text-lg">👨‍⚕️</span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{appointment.doctorId.name}</div>
                                                        <div className="text-sm text-gray-500">{appointment.doctorId.specialization}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                        <span className="text-green-600 text-lg">👤</span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm text-gray-900">{appointment.patientId.name}</div>
                                                        <div className="text-sm text-gray-500">{appointment.patientId.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatDate(appointment.slotId.date)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatTime(appointment.slotId.startTime)} - {formatTime(appointment.slotId.endTime)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={appointment.status}
                                                    onChange={(e) => handleStatusUpdate(appointment._id, e.target.value)}
                                                    className={`text-sm rounded-full px-3 py-1 font-medium ${getStatusColor(appointment.status)} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Confirmed">Confirmed</option>
                                                    <option value="Canceled">Canceled</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDelete(appointment._id)}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                                >
                                                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-lg font-medium">No appointments found</p>
                                                <p className="text-sm text-gray-500 mt-1">Try changing your filter or check back later</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Appointments; 