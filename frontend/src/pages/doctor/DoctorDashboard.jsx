import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format, isToday, parseISO, isValid } from 'date-fns';
import AppointmentDetailsModal from '../../components/doctor/AppointmentDetailsModal';
import RecentAppointments from '../../components/doctor/RecentAppointments';
import TodaySchedule from '../../components/doctor/TodaySchedule';
import refreshIcon from '../../assets/refresh_icon.png';

const DoctorDashboard = () => {
    const { backendUrl, userData, socket } = useContext(AppContext);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        todayAppointments: 0,
        totalPatients: 0,
        pendingPrescriptions: 0,
        confirmedAppointments: 0,
        completedAppointments: 0
    });
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Separate function to fetch only today's schedule
    const fetchTodayScheduleOnly = useCallback(async () => {
        try {
            const appointmentsResponse = await axios.get(`${backendUrl}/api/appointments/doctor`, {
                withCredentials: true
            });

            if (appointmentsResponse.data.success) {
                const appointments = appointmentsResponse.data.appointments;
                
                // Get today's schedule only
                const today = appointments
                    .filter(apt => {
                        if (!apt.slotId?.date) return false;
                        const [day, month, year] = apt.slotId.date.split('/');
                        const slotDate = new Date(year, month - 1, day);
                        return isToday(slotDate);
                    })
                    .sort((a, b) => new Date(a.slotId.startTime) - new Date(b.slotId.startTime));

                setTodaySchedule(today);
            }
        } catch (error) {
            console.error('Error fetching today\'s schedule:', error);
        }
    }, [backendUrl]);

    // Connect to socket and listen for dashboard updates
    useEffect(() => {
        console.log('DoctorDashboard: useEffect triggered with userData:', userData?._id, 'socket.connected:', socket.connected);
        
        if (userData?._id && socket.connected) {
            console.log('DoctorDashboard: Setting up socket listener for doctor:', userData._id);
            console.log('DoctorDashboard: Socket connected:', socket.connected);
            console.log('DoctorDashboard: Socket ID:', socket.id);
            
            // Listen for doctor dashboard updates
            const handleDashboardUpdate = (updatedStats) => {
                console.log('DoctorDashboard: Received real-time stats update:', updatedStats);
                console.log('DoctorDashboard: Current stats before update:', stats);
                setStats(prev => {
                    const newStats = { ...prev, ...updatedStats };
                    console.log('DoctorDashboard: New stats after update:', newStats);
                    return newStats;
                });
                // Only refresh today's schedule, not all stats
                fetchTodayScheduleOnly();
            };
            
            socket.on('doctor-dashboard-update', handleDashboardUpdate);

            return () => {
                console.log('DoctorDashboard: Cleaning up socket listener');
                socket.off('doctor-dashboard-update', handleDashboardUpdate);
            };
        } else if (userData?._id && !socket.connected) {
            console.log('DoctorDashboard: Socket not connected yet, waiting...');
            // Wait for socket to connect
            const handleConnect = () => {
                console.log('DoctorDashboard: Socket connected, setting up listener');
                const handleDashboardUpdate = (updatedStats) => {
                    console.log('DoctorDashboard: Received real-time stats update:', updatedStats);
                    console.log('DoctorDashboard: Current stats before update:', stats);
                    setStats(prev => {
                        const newStats = { ...prev, ...updatedStats };
                        console.log('DoctorDashboard: New stats after update:', newStats);
                        return newStats;
                    });
                    // Only refresh today's schedule, not all stats
                    fetchTodayScheduleOnly();
                };
                
                socket.on('doctor-dashboard-update', handleDashboardUpdate);
            };
            
            socket.on('connect', handleConnect);
            
            return () => {
                console.log('DoctorDashboard: Cleaning up socket listener');
                socket.off('connect', handleConnect);
                socket.off('doctor-dashboard-update');
            };
        }
    }, [userData, socket.connected, fetchTodayScheduleOnly]);

    // Move fetchDashboardData outside useEffect
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
                    todayAppointments: appointments.filter(apt => {
                        if (!apt.slotId?.date) return false;
                        const [day, month, year] = apt.slotId.date.split('/');
                        const slotDate = new Date(year, month - 1, day);
                        return isToday(slotDate);
                    }).length,
                    confirmedAppointments: appointments.filter(apt => 
                        apt.status === 'Confirmed'
                    ).length,
                    completedAppointments: appointments.filter(apt => 
                        apt.status === 'Completed'
                    ).length
                };

                // Get today's schedule
                const today = appointments
                    .filter(apt => {
                        if (!apt.slotId?.date) return false;
                        const [day, month, year] = apt.slotId.date.split('/');
                        const slotDate = new Date(year, month - 1, day);
                        return isToday(slotDate);
                    })
                    .sort((a, b) => new Date(a.slotId.startTime) - new Date(b.slotId.startTime));

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

    useEffect(() => {
        fetchDashboardData();
    }, [backendUrl]);

    // Debug: Log stats changes
    useEffect(() => {
        console.log('DoctorDashboard: Stats state changed:', stats);
    }, [stats]);

    const formatTime = (timeString) => {
        try {
            // If the time is already in 12-hour format, return it
            if (/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(timeString)) {
                return timeString;
            }
            
            // If it's in HH:mm format, convert to 12-hour format
            if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
                const [hours, minutes] = timeString.split(':');
                const hour = parseInt(hours, 10);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
            }
            
            return 'Invalid time';
        } catch (error) {
            console.error('Error formatting time:', error);
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
            title: 'Upcoming Appointments',
            value: stats.confirmedAppointments,
            icon: '✅',
            color: 'bg-emerald-500'
        },
        {
            title: 'Completed Appointments',
            value: stats.completedAppointments,
            icon: '🎯',
            color: 'bg-blue-600'
        }
    ];

    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
    };

    const handleAppointmentUpdate = () => {
        // Refresh appointments data
        fetchDashboardData();
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
                <h1 className="text-2xl font-bold text-gray-800">Welcome, Dr. {userData?.name}!</h1>
                <div className="flex items-center space-x-4">
                    <p className="text-gray-600">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                    <button
                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                        onClick={fetchDashboardData}
                    >
                        <img src={refreshIcon} alt="Refresh" className="w-5 h-5" />
                    </button>
                </div>
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
                <RecentAppointments />

                {/* Today's Schedule */}
                <TodaySchedule 
                    todaySchedule={todaySchedule}
                    onAppointmentClick={handleAppointmentClick}
                    formatTime={formatTime}
                />
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

export default DoctorDashboard; 