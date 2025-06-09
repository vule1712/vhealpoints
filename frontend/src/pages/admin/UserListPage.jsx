import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import '../../styles/components.css';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter } from 'react-icons/fa';

const UserListPage = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const { backendUrl } = useContext(AppContext);
    const navigate = useNavigate();

    // Fetch user list from the backend
    const fetchUsers = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/admin/users', {
                withCredentials: true
            });
            if (response.data.success) {
                setUsers(response.data.users || []);
                setFilteredUsers(response.data.users || []);
            } else {
                setError(response.data.message || 'Failed to fetch users');
                setUsers([]);
                setFilteredUsers([]);
            }
            setError(null);
        } catch (error) {
            console.error('Error fetching users:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch users. Please try again later.';
            setError(errorMessage);
            toast.error(errorMessage);
            setUsers([]);
            setFilteredUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [backendUrl]);

    // Filter users based on search term and selected role
    useEffect(() => {
        let filtered = users;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by role
        if (selectedRole !== 'all') {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        setFilteredUsers(filtered);
    }, [searchTerm, selectedRole, users]);

    const handleUserClick = (user) => {
        navigate(`/admin/user-profile/${user._id}`);
    };

    const handleProfileClose = () => {
        setSelectedUser(null);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleRoleFilterChange = (e) => {
        setSelectedRole(e.target.value);
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
            
            {/* Search and Filter Section */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                </div>

                {/* Role Filter */}
                <div className="w-full md:w-48">
                    <div className="relative">
                        <select
                            value={selectedRole}
                            onChange={handleRoleFilterChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                        >
                            <option value="all">All Roles</option>
                            <option value="Doctor">Doctors</option>
                            <option value="Patient">Patients</option>
                            <option value="Admin">Admins</option>
                        </select>
                        <FaFilter className="absolute left-3 top-3 text-gray-400" />
                        <div className="absolute right-3 top-3 pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} users
            </div>

            <div className="admin-card">
                {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        {searchTerm || selectedRole !== 'all' 
                            ? 'No users found matching your search criteria'
                            : 'No users found'}
                    </div>
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
                            {filteredUsers.map((user, index) => (
                                <tr 
                                    key={user._id || index} 
                                    className="admin-table-row cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleUserClick(user)}
                                >
                                    <td className="admin-table-cell">{index + 1}</td>
                                    <td className="admin-table-cell admin-table-cell-bold">{user.name || 'N/A'}</td>
                                    <td className="admin-table-cell">{user.email || 'N/A'}</td>
                                    <td className="admin-table-cell">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            user.role === 'Doctor' ? 'bg-blue-100 text-blue-800' :
                                            user.role === 'Patient' ? 'bg-green-100 text-green-800' :
                                            'bg-purple-100 text-purple-800'
                                        }`}>
                                            {user.role || 'N/A'}
                                        </span>
                                    </td>
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