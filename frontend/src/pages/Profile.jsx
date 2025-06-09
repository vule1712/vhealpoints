import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import '../styles/components.css';

const Profile = () => {
    const navigate = useNavigate();
    const { userData, backendUrl, setUserData } = useContext(AppContext);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [ratings, setRatings] = useState([]);
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

    useEffect(() => {
        const fetchRatings = async () => {
            if (userData?.role === 'Doctor') {
                try {
                    const response = await axios.get(`${backendUrl}/api/doctor-ratings/${userData._id}`, {
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.data.success) {
                        setRatings(response.data.ratings);
                    }
                } catch (err) {
                    console.error('Error fetching ratings:', err);
                }
            }
        };

        fetchRatings();
    }, [userData?._id, userData?.role, backendUrl]);

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
                        <div className="flex items-center justify-between">
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
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold">{userData.name}</h2>
                                            {userData.role === 'Doctor' && ratings.length > 0 && (
                                                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                                                    <FaStar className="text-yellow-500" />
                                                    <span className="text-sm font-medium text-yellow-800">
                                                        {(ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
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
                            <div className="flex items-center gap-3">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors duration-200 font-medium"
                                        >
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </button>
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
                                            className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors duration-200 font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors duration-200 font-medium"
                                    >
                                        Edit Profile
                                    </button>
                                )}
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

                            {/* Patient Feedback Section for Doctors */}
                            {userData.role === 'Doctor' && (
                                <div className="mt-12 border-t pt-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Patient Feedback</h2>
                                            <p className="text-gray-600 mt-1">What your patients are saying about you</p>
                                        </div>
                                        {ratings.length > 0 && (
                                            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                                                <span className="font-medium text-blue-900">
                                                    {ratings.length} {ratings.length === 1 ? 'Feedback' : 'Feedbacks'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {ratings.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-6">
                                            {ratings.map((rating) => (
                                                <div 
                                                    key={rating._id} 
                                                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                                                {rating.patientId?.name?.charAt(0) || 'P'}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">
                                                                    {rating.patientId?.name || 'Anonymous Patient'}
                                                                </p>
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    {[...Array(5)].map((_, index) => {
                                                                        const ratingValue = index + 1;
                                                                        const halfStar = rating.rating - index === 0.5;
                                                                        const fullStar = rating.rating >= ratingValue;
                                                                        
                                                                        return (
                                                                            <span key={index} className="text-yellow-500">
                                                                                {halfStar ? (
                                                                                    <FaStarHalfAlt className="w-4 h-4" />
                                                                                ) : fullStar ? (
                                                                                    <FaStar className="w-4 h-4" />
                                                                                ) : (
                                                                                    <FaStar className="w-4 h-4 text-gray-300" />
                                                                                )}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                    <span className="ml-2 text-sm font-medium text-gray-600">
                                                                        {rating.rating}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                                            {new Date(rating.createdAt).toLocaleDateString(undefined, {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                        <p className="text-gray-700 leading-relaxed">{rating.feedback}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                                <FaStar className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                                            <p className="text-gray-600 max-w-sm mx-auto">
                                                You haven't received any patient feedback yet. Reviews will appear here once patients rate their experience with you.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-center space-x-4 pt-4 border-t mt-6">
                                {/* Remove the edit buttons from here */}
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center space-x-4 p-6 border-t">
                            {/* Remove the edit buttons from here */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile; 