import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';

const DoctorAppointmentHistory = () => {
    const { backendUrl } = useContext(AppContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, canceled

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

    const handleUpdateStatus = async (status) => {
        try {
            const response = await axios.put(
                `${backendUrl}/api/appointments/${selectedAppointment._id}/status`,
                { 
                    status,
                    cancelReason: status === 'Canceled' ? cancelReason : undefined
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message || 'Appointment status updated successfully');
                fetchAppointments();
                setShowModal(false);
                setCancelReason('');
                setShowCancelForm(false);
            } else {
                toast.error(response.data.message || 'Failed to update appointment status');
            }
        } catch (error) {
            console.error('Error updating appointment status:', error);
            toast.error(error.response?.data?.message || 'Failed to update appointment status');
        }
    };

    const handleCancelClick = () => {
        setShowCancelForm(true);
    };

    const handleCancelSubmit = () => {
        if (!cancelReason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }
        handleUpdateStatus('Canceled');
    };

    const formatDateTime = (dateString) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'MMM d, yyyy h:mm a');
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

    const filteredAppointments = appointments.filter(appointment => {
        if (filter === 'all') return true;
        return appointment.status === filter;
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
                <div className="flex space-x-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Appointments</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Canceled">Canceled</option>
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
                                        <div className="text-sm text-gray-900">
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
                                            appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Appointment Details Modal */}
            {showModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ marginTop: '-82px' }}>
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative">
                        <button
                            onClick={() => {
                                setShowModal(false);
                                setShowCancelForm(false);
                                setCancelReason('');
                            }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-bold mb-6">Appointment Details</h2>
                        <div className="space-y-6">
                            <div>
                                <p className="text-gray-600 text-sm">Patient Name</p>
                                <p className="font-semibold text-lg">{selectedAppointment.patientId?.name || 'Unknown Patient'}</p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">Date & Time</p>
                                <p className="font-semibold text-lg">
                                    {formatDateTime(selectedAppointment.slotId?.date)}
                                </p>
                                <p className="text-gray-500">
                                    {formatTime(selectedAppointment.slotId?.startTime)} - 
                                    {formatTime(selectedAppointment.slotId?.endTime)}
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
                            {selectedAppointment.status === 'Canceled' && (
                                <div>
                                    <p className="text-gray-600 text-sm">Cancellation Reason</p>
                                    <p className="font-semibold text-lg text-red-600">
                                        {selectedAppointment.cancelReason || 'No reason provided'}
                                    </p>
                                </div>
                            )}
                            {selectedAppointment.notes && (
                                <div>
                                    <p className="text-gray-600 text-sm">Notes</p>
                                    <p className="font-semibold text-lg">{selectedAppointment.notes}</p>
                                </div>
                            )}
                        </div>

                        {showCancelForm && (
                            <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
                                <p className="text-red-600 font-medium mb-2">Please provide a reason for cancellation:</p>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full p-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    rows="3"
                                    placeholder="Enter reason for cancellation..."
                                />
                                <div className="mt-2 flex justify-end space-x-2">
                                    <button
                                        onClick={() => {
                                            setShowCancelForm(false);
                                            setCancelReason('');
                                        }}
                                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCancelSubmit}
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end space-x-4">
                            {selectedAppointment.status === 'Pending' && (
                                <>
                                    <button
                                        onClick={() => handleUpdateStatus('Confirmed')}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={handleCancelClick}
                                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        Cancel with Reason
                                    </button>
                                </>
                            )}
                            {selectedAppointment.status === 'Confirmed' && (
                                <>
                                    <button
                                        onClick={() => handleUpdateStatus('Completed')}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        Mark as Completed
                                    </button>
                                    <button
                                        onClick={handleCancelClick}
                                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        Cancel with Reason
                                    </button>
                                </>
                            )}
                            {selectedAppointment.status === 'Completed' && (
                                <p className="text-green-600 font-medium">This appointment has been completed</p>
                            )}
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setShowCancelForm(false);
                                    setCancelReason('');
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorAppointmentHistory; 