import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import AppointmentDetailsModal from '../../components/doctor/AppointmentDetailsModal';

const DoctorAppointmentHistory = () => {
    const { backendUrl } = useContext(AppContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, canceled
    const [patientFilter, setPatientFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/appointments/doctor`, {
                withCredentials: true
            });

            if (response.data.success) {
                const sortedAppointments = response.data.appointments.sort((a, b) => 
                    new Date(b.slotId.date) - new Date(a.slotId.date)
                );
                setAppointments(sortedAppointments);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
    };

    const handleAppointmentUpdate = () => {
        fetchAppointments();
    };

    const formatDateTime = (dateString) => {
        try {
            console.log('Raw date string:', dateString);
            let date;
            
            // If date is already in dd/MM/yyyy format
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
                const [day, month, year] = dateString.split('/');
                date = new Date(year, month - 1, day);
            }
            // If date is in yyyy-MM-dd format
            else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                date = parseISO(dateString);
            }
            // If date is in dd-MM-yyyy format
            else if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
                const [day, month, year] = dateString.split('-');
                date = new Date(year, month - 1, day);
            }
            // Try parsing as is
            else {
                date = new Date(dateString);
            }

            console.log('Parsed date:', date);
            
            if (!isNaN(date.getTime())) {
                const dayOfWeek = format(date, 'EEEE');
                const formattedDate = format(date, 'dd/MM/yyyy');
                return `${dayOfWeek} (${formattedDate})`;
            }
            
            console.error('Invalid date after parsing:', dateString);
            return 'Invalid date';
        } catch (error) {
            console.error('Error formatting date:', error, 'Date value:', dateString);
            return 'Invalid date';
        }
    };

    const formatTime = (timeString) => {
        try {
            // If already in 12-hour format, return as is
            if (/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i.test(timeString)) {
                return timeString;
            }
            // If in 24-hour format, convert to 12-hour format
            if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
                const [hours, minutes] = timeString.split(':');
                const hour = parseInt(hours, 10);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
            }
            // If ISO or Date string, format accordingly
            if (typeof timeString === 'string' && timeString.includes('T')) {
                return format(new Date(timeString), 'hh:mm a');
            }
            // Fallback: try to parse as Date
            return format(new Date(timeString), 'hh:mm a');
        } catch (error) {
            return 'Invalid time';
        }
    };

    const getUniquePatients = () => {
        const patients = appointments.map(app => ({
            id: app.patientId?._id,
            name: app.patientId?.name || 'Unknown Patient'
        }));
        return Array.from(new Set(patients.map(p => p.id)))
            .map(id => patients.find(p => p.id === id))
            .filter(Boolean);
    };

    const filteredAppointments = appointments
        .filter(appointment => {
            const statusMatch = filter === 'all' || appointment.status === filter;
            const patientMatch = patientFilter === 'all' || appointment.patientId?._id === patientFilter;
            return statusMatch && patientMatch;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.slotId.date) - new Date(a.slotId.date);
                case 'patient':
                    return (a.patientId?.name || '').localeCompare(b.patientId?.name || '');
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });

    if (loading) {
        return (
            <div className="admin-loading-spinner">
                <div className="admin-spinner"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Appointment History</h1>
                <div className="flex space-x-4">
                    <select
                        value={patientFilter}
                        onChange={(e) => setPatientFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Patients</option>
                        {getUniquePatients().map((patient) => (
                            <option key={patient.id} value={patient.id}>
                                {patient.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Appointments</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Canceled">Canceled</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="patient">Sort by Patient</option>
                        <option value="status">Sort by Status</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Patient
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Notes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Doctor's Comment
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAppointments.map((appointment) => (
                                <tr
                                    key={appointment._id}
                                    onClick={() => handleAppointmentClick(appointment)}
                                    className="hover:bg-gray-50 cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {appointment.patientId?.name || 'Unknown Patient'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-l font-semibold text-gray-900">
                                            {formatDateTime(appointment.slotId?.date)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {formatTime(appointment.slotId?.startTime)} - 
                                            {formatTime(appointment.slotId?.endTime)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            appointment.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                            appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {appointment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 truncate max-w-xs">
                                            {appointment.notes || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 truncate max-w-xs">
                                            {appointment.doctorComment || '-'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

export default DoctorAppointmentHistory; 