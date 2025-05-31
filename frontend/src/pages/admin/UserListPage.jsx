import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import '../../styles/components.css';
import { useNavigate } from 'react-router-dom';

const UserListPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const {backendUrl} = useContext(AppContext);
    const navigate = useNavigate();

    // Fetch user list from the backend
    const fetchUsers = async () => {
        try {
            const response = await axios.get(backendUrl +'/api/admin/users', {
                withCredentials: true
            });
            if (response.data.success) {
                setUsers(response.data.users || []);
            } else {
                setError(response.data.message || 'Failed to fetch users');
                setUsers([]);
            }
            setError(null);
        } catch (error) {
            console.error('Error fetching users:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch users. Please try again later.';
            setError(errorMessage);
            toast.error(errorMessage);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [backendUrl]);

    const handleUserClick = (user) => {
        navigate(`/admin/user-profile/${user._id}`);
    };

    const handleProfileClose = () => {
        setSelectedUser(null);
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const { data } = await axios.put(`${backendUrl}/api/admin/users/${userId}/role`, {
                role: newRole
            }, { withCredentials: true });
            
            if (data.success) {
                toast.success('User role updated successfully');
                fetchUsers(); // Refresh the list
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const { data } = await axios.delete(`${backendUrl}/api/admin/users/${userId}`, {
                withCredentials: true
            });
            
            if (data.success) {
                toast.success('User deleted successfully');
                setSelectedUser(null); // Close the modal
                fetchUsers(); // Refresh the list
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    if (loading) {
        return (
            <div className="admin-loading-spinner">
                <div className="admin-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-loading-spinner">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="admin-page-title">User List</h1>
            <div className="admin-card">
                {users.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No users found</div>
                ) : (
                    <table className="admin-table">
                        <thead className="admin-table-header">
                            <tr>
                                <th className="admin-table-header-cell">No.</th>
                                <th className="admin-table-header-cell">User Name</th>
                                <th className="admin-table-header-cell">Contact Email</th>
                                <th className="admin-table-header-cell">Role</th>
                                <th className="admin-table-header-cell">Auth Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr 
                                    key={user._id || index} 
                                    className="admin-table-row cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleUserClick(user)}
                                >
                                    <td className="admin-table-cell">{index + 1}</td>
                                    <td className="admin-table-cell admin-table-cell-bold">{user.name || 'N/A'}</td>
                                    <td className="admin-table-cell">{user.email || 'N/A'}</td>
                                    <td className="admin-table-cell">{user.role || 'N/A'}</td>
                                    <td className="admin-table-cell">
                                        <span className={`admin-status-badge ${user.isAccountVerified ? 'verified' : 'not-verified'}`}>
                                            {user.isAccountVerified ? 'Verified' : 'Not Verified'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* User Profile Modal */}
            {selectedUser && (
                <div className="user-profile-modal">
                    <div className="user-profile-content">
                        <div className="user-profile-header">
                            <h2>User Profile</h2>
                            <button onClick={handleProfileClose} className="close-button">&times;</button>
                        </div>
                        
                        <div className="user-profile-details">
                            <div className="profile-field">
                                <label>Name:</label>
                                <span>{selectedUser.name}</span>
                            </div>
                            <div className="profile-field">
                                <label>Email:</label>
                                <span>{selectedUser.email}</span>
                            </div>
                            <div className="profile-field">
                                <label>Role:</label>
                                <select 
                                    value={selectedUser.role} 
                                    onChange={(e) => handleRoleChange(selectedUser._id, e.target.value)}
                                    className="role-select"
                                >
                                    <option value="Patient">Patient</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div className="profile-field">
                                <label>Account Status:</label>
                                <span className={selectedUser.isAccountVerified ? 'status-verified' : 'status-unverified'}>
                                    {selectedUser.isAccountVerified ? 'Verified' : 'Unverified'}
                                </span>
                            </div>
                        </div>

                        <div className="user-profile-actions">
                            <button 
                                onClick={() => handleDeleteUser(selectedUser._id)}
                                className="delete-button"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserListPage; 