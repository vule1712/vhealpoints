import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import '../../styles/components.css';

const UserProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { backendUrl } = useContext(AppContext);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editedUser, setEditedUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/admin/users/${userId}`, {
                    withCredentials: true
                });
                if (response.data.success) {
                    setUser(response.data.userData);
                    setEditedUser(response.data.userData);
                } else {
                    setError(response.data.message);
                    toast.error(response.data.message);
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Failed to fetch user details';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, [userId, backendUrl]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (!editedUser) return;

        setIsSaving(true);
        try {
            // First update role if changed
            if (editedUser.role !== user.role) {
                console.log('Updating role to:', editedUser.role);
                const roleResponse = await axios.put(`${backendUrl}/api/admin/users/${userId}/role`, 
                    JSON.stringify({ role: editedUser.role }), 
                    { 
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (!roleResponse.data.success) {
                    toast.error(roleResponse.data.message);
                    setIsSaving(false);
                    return;
                }
            }

            // Then update profile data
            const profileData = {
                targetUserId: userId // Add the target user ID for admin updates
            };
            
            if (editedUser.role === 'Doctor') {
                profileData.specialization = editedUser.specialization;
                profileData.clinicName = editedUser.clinicName;
                profileData.clinicAddress = editedUser.clinicAddress;
                profileData.aboutMe = editedUser.aboutMe;
            } else if (editedUser.role === 'Patient') {
                profileData.bloodType = editedUser.bloodType;
            }

            const profileResponse = await axios.put(
                `${backendUrl}/api/user/update-profile`,
                profileData,
                { withCredentials: true }
            );

            if (profileResponse.data.success) {
                setUser(profileResponse.data.userData);
                toast.success('User details updated successfully');
                setIsEditing(false);
            } else {
                toast.error(profileResponse.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user details');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const { data } = await axios.delete(`${backendUrl}/api/admin/users/${userId}`, {
                withCredentials: true
            });
            
            if (data.success) {
                toast.success('User deleted successfully');
                navigate('/admin/users');
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

    if (!user) {
        return (
            <div className="admin-loading-spinner">
                <div className="text-red-500">User not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-white">User Profile</h1>
                            <button 
                                onClick={() => navigate('/admin/users')}
                                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-md transition-colors"
                            >
                                Back to User List
                            </button>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="p-6">
                        {/* Basic Information */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">Name</label>
                                        <div className="mt-1 text-gray-900">{user.name}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">Email</label>
                                        <div className="mt-1 text-gray-900">{user.email}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">Phone Number</label>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={editedUser?.phone || ''}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Enter phone number"
                                            />
                                        ) : (
                                            <div className="mt-1 text-gray-900">{user.phone || 'Not set'}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">Role</label>
                                        {isEditing ? (
                                            <select 
                                                name="role"
                                                value={editedUser?.role || user.role} 
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="Patient">Patient</option>
                                                <option value="Doctor">Doctor</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        ) : (
                                            <div className="mt-1">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                    {user.role}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">Account Status</label>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                user.isAccountVerified 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {user.isAccountVerified ? 'Verified' : 'Not Verified'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Role-specific Information */}
                        {editedUser?.role === 'Doctor' && (
                            <div className="mb-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Doctor Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <label className="block text-sm font-medium text-gray-600">Specialization</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="specialization"
                                                value={editedUser.specialization || ''}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Enter specialization"
                                            />
                                        ) : (
                                            <div className="mt-1 text-gray-900">{user.specialization || 'Not set'}</div>
                                        )}
                                    </div>
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <label className="block text-sm font-medium text-gray-600">Clinic Name</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="clinicName"
                                                value={editedUser.clinicName || ''}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Enter clinic name"
                                            />
                                        ) : (
                                            <div className="mt-1 text-gray-900">{user.clinicName || 'Not set'}</div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm">
                                        <label className="block text-sm font-medium text-gray-600">Clinic Address</label>
                                        {isEditing ? (
                                            <textarea
                                                name="clinicAddress"
                                                value={editedUser.clinicAddress || ''}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Enter clinic address"
                                            />
                                        ) : (
                                            <div className="mt-1 text-gray-900">{user.clinicAddress || 'Not set'}</div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm">
                                        <label className="block text-sm font-medium text-gray-600">About</label>
                                        {isEditing ? (
                                            <textarea
                                                name="aboutMe"
                                                value={editedUser.aboutMe || ''}
                                                onChange={handleInputChange}
                                                rows="4"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Enter about information"
                                            />
                                        ) : (
                                            <div className="mt-1 text-gray-900 whitespace-pre-wrap">{user.aboutMe || 'Not set'}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {editedUser?.role === 'Patient' && (
                            <div className="mb-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    Patient Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <label className="block text-sm font-medium text-gray-600">Blood Type</label>
                                        {isEditing ? (
                                            <select
                                                name="bloodType"
                                                value={editedUser.bloodType || ''}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="">Select Blood Type</option>
                                                {bloodTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="mt-1">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                    user.bloodType ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {user.bloodType || 'Not set'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4 mt-8">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedUser(user);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Delete User
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage; 