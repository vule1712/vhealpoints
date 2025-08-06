import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../context/AppContext';
import { format, parseISO } from 'date-fns';
import AppointmentDetailsModal from './AppointmentDetailsModal';

const AppointmentHistory = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { backendUrl } = useContext(AppContext);
    const [selectedDoctor, setSelectedDoctor] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

    const formatTime = (timeString) => {
        try {
            if (/^\d{2}:\d{2}$/.test(timeString)) {
                return timeString;
            }
            const date = new Date(timeString);
            return format(date, 'hh:mm a');
        } catch (error) {
            return timeString;
        }
    };

    const formatDate = (dateString) => {
        try {
            return format(parseISO(dateString), 'MMM d, yyyy');
        } catch (error) {
            return dateString;
        }
    };

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${backendUrl}/api/appointments/patient`, {
                withCredentials: true
            });
            if (response.data.success) {
                setAppointments(response.data.appointments || []);
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
        fetchAppointments();
    };

    // Extract unique doctors
    const doctorOptions = appointments
        ? Array.from(new Set(appointments.map(a => a.doctorId?.name)))
        : [];

    // Filter and sort appointments
    const filteredAppointments = appointments
        .filter(a => selectedDoctor === 'all' || a.doctorId?.name === selectedDoctor)
        .sort((a, b) => {
            const dateA = new Date(a.slotId?.date.split('/').reverse().join('-'));
            const dateB = new Date(b.slotId?.date.split('/').reverse().join('-'));
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-6">Appointment History</h2>
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
                <h2 className="text-2xl font-semibold mb-6">Appointment History</h2>
                <div className="text-red-500 text-center py-4">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-6">Appointment History</h2>
            <div className="flex flex-wrap gap-4 mb-4 items-center">
                <label className="flex items-center gap-2">
                    <span className="font-medium">Doctor:</span>
                    <select
                        className="border border-gray-300 rounded px-2 py-1"
                        value={selectedDoctor}
                        onChange={e => setSelectedDoctor(e.target.value)}
                    >
                        <option value="all">All</option>
                        {doctorOptions.map(name => (
                            <option key={name} value={name}>Dr. {name}</option>
                        ))}
                    </select>
                </label>
                <label className="flex items-center gap-2">
                    <span className="font-medium">Sort by date:</span>
                    <select
                        className="border border-gray-300 rounded px-2 py-1"
                        value={sortOrder}
                        onChange={e => setSortOrder(e.target.value)}
                    >
                        <option value="desc">Newest first</option>
                        <option value="asc">Oldest first</option>
                    </select>
                </label>
            </div>
            <div className="space-y-4">
                {filteredAppointments && filteredAppointments.length > 0 ? (
                    filteredAppointments.map((appointment) => (
                        <div 
                            key={appointment._id} 
                            className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                            onClick={() => handleAppointmentClick(appointment)}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        Dr. {appointment.doctorId?.name || 'Unknown Doctor'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {appointment.doctorId.specialization}
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
                    <p className="text-gray-500 text-center py-4">No appointments found</p>
                )}
            </div>

            {selectedAppointment && (
                <AppointmentDetailsModal
                    appointment={selectedAppointment}
                    showModal={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedAppointment(null);
                    }}
                    onAppointmentUpdate={handleAppointmentUpdate}
                />
            )}
        </div>
    );
};

export default AppointmentHistory; 