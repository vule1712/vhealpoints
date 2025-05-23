import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, isToday, parseISO, isValid } from 'date-fns';

const PatientDashboard = () => {
    const { backendUrl, userData } = useContext(AppContext);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        upcomingAppointments: 0,
        completedAppointments: 0,
        canceledAppointments: 0,
        totalPrescriptions: 0,
        pendingPrescriptions: 0
    });
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [recentPrescriptions, setRecentPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Fetch appointments
                const appointmentsResponse = await axios.get(`${backendUrl}/api/appointments/patient`, {
                    withCredentials: true
                });

                if (appointmentsResponse.data.success) {
                    const appointments = appointmentsResponse.data.appointments;
                    
                    // Calculate statistics
                    const stats = {
                        totalAppointments: appointments.length,
                        upcomingAppointments: appointments.filter(apt => 
                            apt.status === 'Confirmed' && new Date(apt.slotId.date) > new Date()
                        ).length,
                        completedAppointments: appointments.filter(apt => 
                            apt.status === 'Completed'
                        ).length,
                        canceledAppointments: appointments.filter(apt => 
                            apt.status === 'Canceled'
                        ).length
                    };

                    // Get recent appointments (last 5)
                    const recent = appointments
                        .sort((a, b) => new Date(b.slotId.date) - new Date(a.slotId.date))
                        .slice(0, 5);

                    // Get upcoming appointments
                    const upcoming = appointments
                        .filter(apt => apt.status === 'Confirmed' && new Date(apt.slotId.date) > new Date())
                        .sort((a, b) => new Date(a.slotId.date) - new Date(b.slotId.date))
                        .slice(0, 5);

                    setRecentAppointments(recent);
                    setUpcomingAppointments(upcoming);
                    setStats(prev => ({ ...prev, ...stats }));
                }

                // Fetch prescriptions
                try {
                    const prescriptionsResponse = await axios.get(`${backendUrl}/api/prescriptions/patient`, {
                        withCredentials: true
                    });
                    if (prescriptionsResponse.data.success) {
                        const prescriptions = prescriptionsResponse.data.prescriptions;
                        setStats(prev => ({
                            ...prev,
                            totalPrescriptions: prescriptions.length,
                            pendingPrescriptions: prescriptions.filter(pres => pres.status === 'Pending').length
                        }));

                        // Get recent prescriptions (last 5)
                        const recent = prescriptions
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .slice(0, 5);
                        setRecentPrescriptions(recent);
                    }
                } catch (error) {
                    console.log('Prescriptions endpoint not available yet');
                    // Set default values for prescriptions
                    setStats(prev => ({
                        ...prev,
                        totalPrescriptions: 0,
                        pendingPrescriptions: 0
                    }));
                    setRecentPrescriptions([]);
                }

            } catch (error) {
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
            title: 'Upcoming Appointments',
            value: stats.upcomingAppointments,
            icon: '⏳',
            color: 'bg-yellow-600'
        },
        {
            title: 'Completed Appointments',
            value: stats.completedAppointments,
            icon: '✅',
            color: 'bg-green-500'
        },
        {
            title: 'Canceled Appointments',
            value: stats.canceledAppointments,
            icon: '❌',
            color: 'bg-red-300'
        },
        {
            title: 'Total Prescriptions',
            value: stats.totalPrescriptions,
            icon: '💊',
            color: 'bg-purple-500'
        },
        {
            title: 'Pending Prescriptions',
            value: stats.pendingPrescriptions,
            icon: '📋',
            color: 'bg-orange-500'
        }
    ];

    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
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
                fetchDashboardData(); // Refresh the dashboard data
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel appointment');
        }
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
                <h1 className="text-2xl font-bold text-gray-800">Welcome, {userData?.name}</h1>
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
                                        <p className="font-medium">Dr. {appointment.doctorId.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatDateTime(appointment.slotId.date)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-sm ${
                                            appointment.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                            appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                            appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {appointment.status}
                                        </span>
                                        {(appointment.status === 'Confirmed' || appointment.status === 'Pending') && 
                                        new Date(appointment.slotId.date) > new Date()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center">No recent appointments</p>
                        )}
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
                    <div className="space-y-4">
                        {upcomingAppointments.length > 0 ? (
                            upcomingAppointments.map((appointment) => (
                                <div
                                    key={appointment._id}
                                    onClick={() => handleAppointmentClick(appointment)}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                    <div>
                                        <p className="font-medium">Dr. {appointment.doctorId.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(appointment.slotId.date)}
                                            <br />
                                            {formatTime(appointment.slotId.startTime)} - 
                                            {formatTime(appointment.slotId.endTime)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                            Confirmed
                                        </span>
                                        <button
                                            onClick={(e) => handleCancelClick(e, appointment)}
                                            className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center">No upcoming appointments</p>
                        )}
                    </div>
                </div>

                {/* Recent Prescriptions */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Prescriptions</h2>
                    <div className="space-y-4">
                        {recentPrescriptions.length > 0 ? (
                            recentPrescriptions.map((prescription) => (
                                <div
                                    key={prescription._id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <div>
                                        <p className="font-medium">Dr. {prescription.doctorId.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(prescription.createdAt)}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {prescription.medications?.length || 0} medications prescribed
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${
                                        prescription.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                        prescription.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {prescription.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center">No recent prescriptions</p>
                        )}
                    </div>
                </div>
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

export default PatientDashboard;