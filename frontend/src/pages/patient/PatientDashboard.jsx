import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const PatientDashboard = () => {
    const { backendUrl, userData } = useContext(AppContext);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        upcomingAppointments: 0,
        totalPrescriptions: 0,
        activePrescriptions: 0
    });

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                axios.defaults.withCredentials = true;
                const { data } = await axios.get(`${backendUrl}/api/patient/dashboard-stats`);
                if (data.success) {
                    setStats(data.stats);
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
            title: 'Upcoming Appointments',
            value: stats.upcomingAppointments,
            icon: '📊',
            color: 'bg-green-500'
        },
        {
            title: 'Total Prescriptions',
            value: stats.totalPrescriptions,
            icon: '💊',
            color: 'bg-purple-500'
        },
        {
            title: 'Active Prescriptions',
            value: stats.activePrescriptions,
            icon: '📋',
            color: 'bg-yellow-500'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Welcome, {userData?.name}</h1>
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
                {/* Upcoming Appointments */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
                    <div className="space-y-4">
                        {/* Add appointment list here */}
                        <p className="text-gray-500 text-center">No upcoming appointments</p>
                    </div>
                </div>

                {/* Recent Prescriptions */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Prescriptions</h2>
                    <div className="space-y-4">
                        {/* Add prescription list here */}
                        <p className="text-gray-500 text-center">No recent prescriptions</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;