import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, isToday, parseISO, isValid } from 'date-fns';

const DoctorDashboard = () => {
    const { backendUrl, userData } = useContext(AppContext);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        todayAppointments: 0,
        totalPatients: 0,
        pendingPrescriptions: 0,
        confirmedAppointments: 0,
        pendingAppointments: 0,
        canceledAppointments: 0
    });
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelForm, setShowCancelForm] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Fetch appointments
                const appointmentsResponse = await axios.get(`${backendUrl}/api/appointments/doctor`, {
                    withCredentials: true
                });

                if (appointmentsResponse.data.success) {
                    const appointments = appointmentsResponse.data.appointments;
                    
                    // Calculate statistics
                    const stats = {
                        totalAppointments: appointments.length,
                        todayAppointments: appointments.filter(apt => 
                            apt.slotId?.date && isToday(parseISO(apt.slotId.date))
                        ).length,
                        confirmedAppointments: appointments.filter(apt => 
                            apt.status === 'Confirmed'
                        ).length,
                        pendingAppointments: appointments.filter(apt => 
                            apt.status === 'Pending'
                        ).length,
                        canceledAppointments: appointments.filter(apt => 
                            apt.status === 'Canceled'
                        ).length
                    };

                    // Get recent appointments (last 5)
                    const recent = appointments
                        .filter(apt => apt.slotId?.date)
                        .sort((a, b) => new Date(b.slotId.date) - new Date(a.slotId.date))
                        .slice(0, 5);

                    // Get today's schedule
                    const today = appointments
                        .filter(apt => apt.slotId?.date && isToday(parseISO(apt.slotId.date)))
                        .sort((a, b) => new Date(a.slotId.startTime) - new Date(b.slotId.startTime));

                    setRecentAppointments(recent);
                    setTodaySchedule(today);
                    setStats(prev => ({ ...prev, ...stats }));
                }

                // Fetch total patients count
                const patientsResponse = await axios.get(`${backendUrl}/api/user/doctor-total-patients`, {
                    withCredentials: true
                });
                if (patientsResponse.data.success) {
                    setStats(prev => ({
                        ...prev,
                        totalPatients: patientsResponse.data.count
                    }));
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [backendUrl]);

    const formatDate = (dateString) => {
        try {
            const date = parseISO(dateString);
            return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
        } catch (error) {
            return 'Invalid date';
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

    const formatTime = (timeString) => {
        try {
            return format(new Date(timeString), 'hh:mm a');
        } catch (error) {
            return 'Invalid time';
        }
    };

    const statCards = [
        {
            title: 'Total Appointments',
            value: stats.totalAppointments,
            icon: '📅',
            color: 'bg-blue-500'
        },
        {
            title: "Today's Appointments",
            value: stats.todayAppointments,
            icon: '📊',
            color: 'bg-green-500'
        },
        {
            title: 'Total Patients',
            value: stats.totalPatients,
            icon: '👥',
            color: 'bg-purple-500'
        },
        {
            title: 'Confirmed Appointments',
            value: stats.confirmedAppointments,
            icon: '✅',
            color: 'bg-emerald-500'
        },
        {
            title: 'Pending Appointments',
            value: stats.pendingAppointments,
            icon: '⏳',
            color: 'bg-yellow-600'
        },
        {
            title: 'Canceled Appointments',
            value: stats.canceledAppointments,
            icon: '❌',
            color: 'bg-gray-300'
        }
    ];

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
                // Update the local state with the new appointment data
                const updatedAppointment = response.data.appointment;
                
                // Update recent appointments
                setRecentAppointments(prev => 
                    prev.map(apt => apt._id === updatedAppointment._id ? updatedAppointment : apt)
                );
                
                // Update today's schedule
                setTodaySchedule(prev => 
                    prev.map(apt => apt._id === updatedAppointment._id ? updatedAppointment : apt)
                );

                // Update stats
                setStats(prev => {
                    const newStats = { ...prev };
                    // Decrement old status count
                    if (selectedAppointment.status === 'Confirmed') newStats.confirmedAppointments--;
                    if (selectedAppointment.status === 'Pending') newStats.pendingAppointments--;
                    if (selectedAppointment.status === 'Canceled') newStats.canceledAppointments--;
                    // Increment new status count
                    if (status === 'Confirmed') newStats.confirmedAppointments++;
                    if (status === 'Pending') newStats.pendingAppointments++;
                    if (status === 'Canceled') newStats.canceledAppointments++;
                    return newStats;
                });

                // Show success message
                toast.success(response.data.message || 'Appointment status updated successfully');
                
                // Close modal and reset form
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
                <h1 className="text-2xl font-bold text-gray-800">Welcome, Dr. {userData?.name}</h1>
                <p className="text-gray-600">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">{stat.title}</p>
                                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-full text-white`}>
                                <span className="text-2xl">{stat.icon}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Appointments */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Appointments</h2>
                    <div className="space-y-4">
                        {recentAppointments.length > 0 ? (
                            recentAppointments.map((appointment) => (
                                <div
                                    key={appointment._id}
                                    onClick={() => handleAppointmentClick(appointment)}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                    <div>
                                        <p className="font-medium">{appointment.patientId?.name || 'Unknown Patient'}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatDateTime(appointment.slotId?.date)}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${
                                        appointment.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                        appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                        appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {appointment.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center">No recent appointments</p>
                        )}
                    </div>
                </div>

                {/* Today's Schedule */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
                    <div className="space-y-4">
                        {todaySchedule.length > 0 ? (
                            todaySchedule.map((appointment) => (
                                <div
                                    key={appointment._id}
                                    onClick={() => handleAppointmentClick(appointment)}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                    <div>
                                        <p className="font-medium">{appointment.patientId?.name || 'Unknown Patient'}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatTime(appointment.slotId?.startTime)} - 
                                            {formatTime(appointment.slotId?.endTime)}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${
                                        appointment.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                        appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                        appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {appointment.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center">No appointments scheduled for today</p>
                        )}
                    </div>
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

export default DoctorDashboard; 