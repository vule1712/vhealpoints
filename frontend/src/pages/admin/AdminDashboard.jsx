import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import '../../styles/components.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        verifiedUsers: 0,
        pendingVerifications: 0
    });
    const [loading, setLoading] = useState(true);
    const { backendUrl, userData } = useContext(AppContext);

    // Fetch dashboard statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(backendUrl + '/api/admin/stats', {
                    withCredentials: true
                });
                if (response.data.success) {
                    setStats({
                        totalUsers: response.data.stats.totalUsers || 0,
                        verifiedUsers: response.data.stats.verifiedUsers || 0,
                        pendingVerifications: response.data.stats.totalUsers - response.data.stats.verifiedUsers || 0
                    });
                } else {
                    toast.error(response.data.message || 'Failed to load dashboard statistics');
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                toast.error('Failed to load dashboard statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [backendUrl]);

    if (loading) {
        return (
            <div className="admin-loading-spinner">
                <div className="admin-spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Welcome, Admin {userData?.name}</h1>
                <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="admin-card">
                    <h3 className="admin-card-title">Total Users</h3>
                    <p className="admin-card-value blue">{stats.totalUsers}</p>
                </div>
                <div className="admin-card">
                    <h3 className="admin-card-title">Verified Users</h3>
                    <p className="admin-card-value green">{stats.verifiedUsers}</p>
                </div>
                <div className="admin-card">
                    <h3 className="admin-card-title">Pending Verifications</h3>
                    <p className="admin-card-value yellow">{stats.pendingVerifications}</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 