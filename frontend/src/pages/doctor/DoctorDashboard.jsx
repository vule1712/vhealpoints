import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const DoctorDashboard = () => {
    const { backendUrl, userData } = useContext(AppContext);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        todayAppointments: 0,
        totalPatients: 0,
        pendingPrescriptions: 0
    });

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                axios.defaults.withCredentials = true;
                // Fetch total patients count
                const patientsResponse = await axios.get(`${backendUrl}/api/user/patient/count`);
                if (patientsResponse.data.success) {
                    setStats(prev => ({
                        ...prev,
                        totalPatients: patientsResponse.data.count
                    }));
                }

                // Fetch other stats
                const { data } = await axios.get(`${backendUrl}/api/doctor/dashboard-stats`);
                if (data.success) {
                    setStats(prev => ({
                        ...prev,
                        totalAppointments: data.stats.totalAppointments,
                        todayAppointments: data.stats.todayAppointments,
                        pendingPrescriptions: data.stats.pendingPrescriptions
                    }));
                }
            } catch (error) {
                toast.error(error.message);
            }
        };

        fetchDashboardStats();
    }, [backendUrl]);

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
            title: 'Pending Prescriptions',
            value: stats.pendingPrescriptions,
            icon: '💊',
            color: 'bg-yellow-500'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Welcome, Dr. {userData?.name}</h1>
                <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
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
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Appointments</h2>
                    <div className="space-y-4">
                        {/* Add appointment list later */}
                        <p className="text-gray-500 text-center">No recent appointments</p>
                    </div>
                </div>

                {/* Upcoming Schedule */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
                    <div className="space-y-4">
                        {/* Add schedule list later */}
                        <p className="text-gray-500 text-center">No appointments scheduled for today</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard; 