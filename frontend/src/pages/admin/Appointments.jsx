import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../context/AppContext';
import { format, parseISO } from 'date-fns';
import AppointmentDetailsModal from '../../components/admin/AppointmentDetailsModal';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [doctorFilter, setDoctorFilter] = useState('all');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { backendUrl } = useContext(AppContext);
    const [statusFilter, setStatusFilter] = useState('All');
    const statusOptions = ['All', 'Confirmed', 'Canceled', 'Completed'];

    const formatTime = (timeString) => {
        try {
            // If the time is already in 12-hour format, return it
            if (/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(timeString)) {
                return timeString;
            }
            
            // If it's in HH:mm format, convert to 12-hour format
            if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
                return format(new Date(`2000-01-01 ${timeString}`), 'hh:mm a');
            }
            
            // If it's a full date string, extract and format the time
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'Confirmed':
                return 'bg-green-100 text-green-800';
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
        const doctors = appointments
            .filter(app => app.doctorId) // Only include if doctorId exists
            .map(app => ({
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

    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
    };

    const handleAppointmentUpdate = () => {
        // Refresh appointments data
        fetchAppointments();
    };

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
        const statusMatch = statusFilter === 'All' || appointment.status === statusFilter;
        const doctorMatch = doctorFilter === 'all' || (appointment.doctorId && appointment.doctorId._id === doctorFilter);
        return statusMatch && doctorMatch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="h-96 bg-gray-200 rounded"></div>
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
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {statusOptions.map(status => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
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
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAppointments.length > 0 ? (
                                    filteredAppointments.map((appointment) => (
                                        <tr 
                                            key={appointment._id} 
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => handleAppointmentClick(appointment)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 text-lg">👨‍⚕️</span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{appointment.doctorId?.name || 'N/A'}</div>
                                                        <div className="text-sm text-gray-500">{appointment.doctorId?.specialization || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                        <span className="text-green-600 text-lg">👤</span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm text-gray-900">{appointment.patientId?.name || 'N/A'}</div>
                                                        <div className="text-sm text-gray-500">{appointment.patientId?.email || 'N/A'}</div>
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
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                                    {appointment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
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

            <AppointmentDetailsModal
                appointment={selectedAppointment}
                showModal={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedAppointment(null);
                }}
                onAppointmentUpdate={handleAppointmentUpdate}
            />
        </div>
    );
};

export default Appointments; 