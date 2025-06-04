import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import '../styles/components.css';

const Profile = () => {
    const navigate = useNavigate();
    const { userData, backendUrl, setUserData } = useContext(AppContext);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: userData?.name || '',
        specialization: userData?.specialization || '',
        clinicName: userData?.clinicName || '',
        clinicAddress: userData?.clinicAddress || '',
        aboutMe: userData?.aboutMe || '',
        bloodType: userData?.bloodType || ''
    });

    const bloodTypes = [
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    ];

    if (!userData) {
        navigate('/login');
        return null;
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await axios.put(
                `${backendUrl}/api/user/update-profile`,
                formData,
                { withCredentials: true }
            );
            
            if (response.data.success) {
                setUserData(response.data.userData);
                toast.success('Profile updated successfully');
                setIsEditing(false);
            } else {
                toast.error(response.data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="absolute left-0 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 text-center">My Profile</h1>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
                        <div className="flex items-center">
                            <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-blue-500 text-4xl font-bold">
                                {userData.name.charAt(0)}
                            </div>
                            <div className="ml-6 text-white">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="text-2xl font-bold bg-white/10 border border-white/20 rounded px-2 py-1 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="Enter your name"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold">{userData.name}</h2>
                                )}
                                <p className="text-blue-100">{userData.email}</p>
                                <div className="mt-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-400 bg-opacity-20">
                                        {userData.role}
                                    </span>
                                    <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        userData.isAccountVerified 
                                            ? 'bg-green-400 bg-opacity-20 text-green-100' 
                                            : 'bg-yellow-400 bg-opacity-20 text-yellow-100'
                                    }`}>
                                        {userData.isAccountVerified ? 'Verified' : 'Not Verified'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    {userData.role !== 'Admin' ? (
                        <div className="p-6">
                            {userData.role === 'Doctor' ? (
                                <div className="space-y-6">
                                    {/* About Me Section */}
                                    <div className="mb-8">
                                        <label className="block text-xl font-semibold text-gray-900 mb-4">
                                            About Me
                                        </label>
                                        {isEditing ? (
                                            <textarea
                                                name="aboutMe"
                                                value={formData.aboutMe}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                                placeholder="Tell us about yourself, your experience, and what makes you unique as a doctor..."
                                                rows="6"
                                            />
                                        ) : (
                                            <div className="px-6 py-4 bg-gray-50 rounded-lg">
                                                <p className="text-gray-700 text-lg whitespace-pre-wrap leading-relaxed">
                                                    {userData.aboutMe || 'No information provided yet.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Specialization
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="specialization"
                                                        value={formData.specialization}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter your specialization"
                                                    />
                                                ) : (
                                                    <div className="px-4 py-2 bg-gray-50 rounded-md">
                                                        {userData.specialization || 'Not set'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Clinic Name
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="clinicName"
                                                        value={formData.clinicName}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter your clinic name"
                                                    />
                                                ) : (
                                                    <div className="px-4 py-2 bg-gray-50 rounded-md">
                                                        {userData.clinicName || 'Not set'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Clinic Address
                                            </label>
                                            {isEditing ? (
                                                <textarea
                                                    name="clinicAddress"
                                                    value={formData.clinicAddress}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Enter your clinic address"
                                                    rows="3"
                                                />
                                            ) : (
                                                <div className="px-4 py-2 bg-gray-50 rounded-md">
                                                    {userData.clinicAddress || 'Not set'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : userData.role === 'Patient' ? (
                                <div className="space-y-6">
                                    <div className="max-w-md mx-auto">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Blood Type
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    name="bloodType"
                                                    value={formData.bloodType}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="">Select Blood Type</option>
                                                    {bloodTypes.map(type => (
                                                        <option key={type} value={type}>
                                                            {type}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="px-4 py-2 bg-gray-50 rounded-md">
                                                    {userData.bloodType || 'Not set'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex justify-center space-x-4 pt-4 border-t mt-6">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFormData({
                                                    name: userData.name,
                                                    specialization: userData.specialization || '',
                                                    clinicName: userData.clinicName || '',
                                                    clinicAddress: userData.clinicAddress || '',
                                                    aboutMe: userData.aboutMe || '',
                                                    bloodType: userData.bloodType || ''
                                                });
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center space-x-4 p-6 border-t">
                            {isEditing ? (
                                <>
                                    <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            name: userData.name,
                                            specialization: userData.specialization || '',
                                            clinicName: userData.clinicName || '',
                                            clinicAddress: userData.clinicAddress || '',
                                            aboutMe: userData.aboutMe || '',
                                            bloodType: userData.bloodType || ''
                                        });
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile; 