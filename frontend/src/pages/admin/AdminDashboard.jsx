import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, isToday, parseISO, isValid } from 'date-fns';
import AppointmentDetailsModal from '../../components/admin/AppointmentDetailsModal';
import RecentAppointments from '../../components/admin/RecentAppointments';
import TodaySchedule from '../../components/admin/TodaySchedule';

const AdminDashboard = () => {
    const { backendUrl, userData } = useContext(AppContext);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        todayAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        totalUsers: 0,
        verifiedUsers: 0,
        doctors: 0,
        patients: 0
    });
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch appointments
            const appointmentsResponse = await axios.get(`${backendUrl}/api/appointments/admin/all`, {
                withCredentials: true
            });

            // Fetch user statistics
            const statsResponse = await axios.get(`${backendUrl}/api/admin/stats`, {
                withCredentials: true
            });

            if (!appointmentsResponse.data.success || !Array.isArray(appointmentsResponse.data.data)) {
                console.error('Invalid response format:', appointmentsResponse.data);
                toast.error('Invalid response format from server');
                // Set default values
                setTodaySchedule([]);
                setStats({
                    totalAppointments: 0,
                    todayAppointments: 0,
                    confirmedAppointments: 0,
                    completedAppointments: 0,
                    totalUsers: 0,
                    verifiedUsers: 0,
                    doctors: 0,
                    patients: 0
                });
                return;
            }

            const appointments = appointmentsResponse.data.data;
            
            // Calculate appointment statistics
            const appointmentStats = {
                totalAppointments: appointments.length,
                todayAppointments: appointments.filter(apt => {
                    if (!apt.slotId?.date) return false;
                    const [day, month, year] = apt.slotId.date.split('/');
                    const appointmentDate = new Date(year, month - 1, day);
                    return isToday(appointmentDate);
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
                    const appointmentDate = new Date(year, month - 1, day);
                    return isToday(appointmentDate);
                })
                .sort((a, b) => {
                    const [aDay, aMonth, aYear] = a.slotId.date.split('/');
                    const [bDay, bMonth, bYear] = b.slotId.date.split('/');
                    const aDate = new Date(aYear, aMonth - 1, aDay);
                    const bDate = new Date(bYear, bMonth - 1, bDay);
                    return aDate - bDate;
                });

            setTodaySchedule(today);
            setStats(prev => ({ 
                ...prev, 
                ...appointmentStats,
                ...statsResponse.data.stats 
            }));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
            // Set default values on error
            setTodaySchedule([]);
            setStats({
                totalAppointments: 0,
                todayAppointments: 0,
                confirmedAppointments: 0,
                completedAppointments: 0,
                totalUsers: 0,
                verifiedUsers: 0,
                doctors: 0,
                patients: 0
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [backendUrl]);

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
            title: 'Total Users',
            value: stats.totalUsers,
            icon: '👥',
            color: 'bg-purple-500'
        },
        {
            title: 'Verified Users',
            value: stats.verifiedUsers,
            icon: '✅',
            color: 'bg-green-500'
        },
        {
            title: 'Total Doctors',
            value: stats.doctors,
            icon: '👨‍⚕️',
            color: 'bg-blue-500'
        },
        {
            title: 'Total Patients',
            value: stats.patients,
            icon: '👤',
            color: 'bg-indigo-500'
        },
        {
            title: 'Total Appointments',
            value: stats.totalAppointments,
            icon: '📅',
            color: 'bg-pink-500'
        },
        {
            title: "Today's Appointments",
            value: stats.todayAppointments,
            icon: '📊',
            color: 'bg-yellow-500'
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
                <h1 className="text-2xl font-bold text-gray-800">Welcome, {userData?.name}!</h1>
                <p className="text-gray-600">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

export default AdminDashboard; 