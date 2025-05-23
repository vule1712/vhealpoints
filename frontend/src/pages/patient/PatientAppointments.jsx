import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, parseISO, isValid } from 'date-fns';

const PatientAppointments = () => {
    const { backendUrl } = useContext(AppContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, upcoming, past, canceled
    const [sortBy, setSortBy] = useState('date'); // date, status
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/api/appointments/patient`, {
                withCredentials: true
            });

            if (response.data.success) {
                setAppointments(response.data.appointments);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (e, appointment) => {
        if (e) {
            e.stopPropagation();
        }
        setSelectedAppointment(appointment);
        setShowCancelForm(true);
    };

    const handleCancelSubmit = async () => {
        if (!cancelReason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }

        try {
            const response = await axios.delete(
                `${backendUrl}/api/appointments/${selectedAppointment._id}`,
                { 
                    data: { cancelReason },
                    withCredentials: true 
                }
            );

            if (response.data.success) {
                toast.success('Appointment canceled successfully');
                setShowCancelForm(false);
                setCancelReason('');
                fetchAppointments(); // Refresh the list
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel appointment');
        }
    };

    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
    };

    const formatDate = (dateString) => {
        try {
            const date = parseISO(dateString);
            return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
        } catch (error) {
            return 'Invalid date';
        }
    };

    const formatTime = (timeString) => {
        try {
            return format(new Date(timeString), 'hh:mm a');
        } catch (error) {
            return 'Invalid time';
        }
    };

    const formatDateTime = (dateString) => {
        try {
            const date = parseISO(dateString);
            return isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : 'Invalid date';
        } catch (error) {
            return 'Invalid date';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-blue-100 text-blue-800';
            case 'Confirmed':
                return 'bg-green-100 text-green-800';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Canceled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredAppointments = appointments
        .filter(appointment => {
            const appointmentDate = new Date(appointment.slotId.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (filter) {
                case 'upcoming':
                    return appointment.status === 'Confirmed' && appointmentDate >= today;
                case 'past':
                    return appointmentDate < today || appointment.status === 'Completed';
                case 'canceled':
                    return appointment.status === 'Canceled';
                default:
                    return true;
            }
        })
        .sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.slotId.date) - new Date(a.slotId.date);
            } else {
                return a.status.localeCompare(b.status);
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
                <div className="flex gap-4">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Appointments</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                        <option value="canceled">Canceled</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="status">Sort by Status</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {filteredAppointments.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                        {filteredAppointments.map((appointment) => (
                            <div
                                key={appointment._id}
                                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => handleAppointmentClick(appointment)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span className="text-xl">👨‍⚕️</span>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Dr. {appointment.doctorId.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(appointment.slotId.date)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatTime(appointment.slotId.startTime)} - 
                                                    {formatTime(appointment.slotId.endTime)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(appointment.status)}`}>
                                            {appointment.status}
                                        </span>
                                        {(appointment.status === 'Confirmed' || appointment.status === 'Pending') && 
                                        new Date(appointment.slotId.date) > new Date() && (
                                            <button
                                                onClick={(e) => handleCancelClick(e, appointment)}
                                                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {appointment.notes && (
                                    <div className="mt-4 text-sm text-gray-600">
                                        <p className="font-medium">Notes:</p>
                                        <p>{appointment.notes}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-gray-500">
                        No appointments found
                    </div>
                )}
            </div>

            {/* Appointment Details Modal */}
            {showModal && selectedAppointment && !showCancelForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ marginTop: '-82px' }}>
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-bold mb-6">Appointment Details</h2>
                        <div className="space-y-6">
                            <div>
                                <p className="text-gray-600 text-sm">Doctor Name</p>
                                <p className="font-semibold text-lg">Dr. {selectedAppointment.doctorId.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">Date & Time</p>
                                <p className="font-semibold text-lg">
                                    {formatDateTime(selectedAppointment.slotId.date)}
                                </p>
                                <p className="text-gray-500">
                                    {formatTime(selectedAppointment.slotId.startTime)} - 
                                    {formatTime(selectedAppointment.slotId.endTime)}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">Status</p>
                                <p className={`font-semibold text-lg ${
                                    selectedAppointment.status === 'Completed' ? 'text-blue-600' :
                                    selectedAppointment.status === 'Confirmed' ? 'text-green-600' :
                                    selectedAppointment.status === 'Pending' ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {selectedAppointment.status}
                                </p>
                            </div>
                            {selectedAppointment.notes && (
                                <div>
                                    <p className="text-gray-600 text-sm">Notes</p>
                                    <p className="font-semibold text-lg">{selectedAppointment.notes}</p>
                                </div>
                            )}
                            {selectedAppointment.status === 'Canceled' && (
                                <div>
                                    <p className="text-gray-600 text-sm">Cancellation Reason</p>
                                    <p className="font-semibold text-lg text-red-600">
                                        {selectedAppointment.cancelReason || 'No reason provided'}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="mt-8 flex justify-end space-x-4">
                            {(selectedAppointment.status === 'Confirmed' || selectedAppointment.status === 'Pending') && 
                             new Date(selectedAppointment.slotId.date) > new Date() && (
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        handleCancelClick(null, selectedAppointment);
                                    }}
                                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Cancel Appointment
                                </button>
                            )}
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Appointment Modal */}
            {showCancelForm && selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ marginTop: '-82px' }}>
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative">
                        <button
                            onClick={() => {
                                setShowCancelForm(false);
                                setCancelReason('');
                            }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-bold mb-6">Cancel Appointment</h2>
                        <div className="space-y-6">
                            <div>
                                <p className="text-gray-600 text-sm">Doctor Name</p>
                                <p className="font-semibold text-lg">Dr. {selectedAppointment.doctorId.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">Date & Time</p>
                                <p className="font-semibold text-lg">
                                    {formatDateTime(selectedAppointment.slotId.date)}
                                </p>
                                <p className="text-gray-500">
                                    {formatTime(selectedAppointment.slotId.startTime)} - 
                                    {formatTime(selectedAppointment.slotId.endTime)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm mb-2">
                                    Reason for Cancellation
                                </label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="4"
                                    placeholder="Please provide a reason for canceling this appointment..."
                                    required
                                />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end space-x-4">
                            <button
                                onClick={() => {
                                    setShowCancelForm(false);
                                    setCancelReason('');
                                }}
                                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCancelSubmit}
                                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Confirm Cancellation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientAppointments; 