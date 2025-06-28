import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaStar, FaStarHalfAlt, FaUserMd, FaClinicMedical, FaMapMarkerAlt, FaInfoCircle, FaHistory, FaUser, FaTint, FaPhone, FaEnvelope, FaIdCard } from 'react-icons/fa';
import '../styles/components.css';
import DoctorPersonalRatingStats from '../components/doctor/DoctorPersonalRatingStats';
import AppointmentHistory from '../components/patient/AppointmentHistory';

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
        bloodType: userData?.bloodType || '',
        phone: userData?.phone || ''
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="absolute left-0 flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 text-center">My Profile</h1>
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-28 w-28 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-5xl font-bold border-4 border-white/20 shadow-lg">
                                    {userData.name.charAt(0)}
                                </div>
                                <div className="ml-8 text-white">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="text-2xl font-bold bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 w-full"
                                            placeholder="Enter your name"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-bold">{userData.name}</h2>
                                            {userData.role === 'Doctor' && ratings.length > 0 && (
                                                <div className="flex items-center gap-1.5 bg-yellow-100/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-yellow-200/30">
                                                    <FaStar className="text-yellow-300" />
                                                    <span className="text-sm font-medium text-yellow-100">
                                                        {(ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-blue-100 mt-1 text-lg">{userData.email}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20">
                                            {userData.role}
                                        </span>
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                                            userData.isAccountVerified 
                                                ? 'bg-green-100/20 text-green-100 border border-green-200/30' 
                                                : 'bg-yellow-100/20 text-yellow-100 border border-yellow-200/30'
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
                                            className="px-5 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                    bloodType: userData.bloodType || '',
                                                    phone: userData.phone || '',
                                                    allergies: userData.allergies || '',
                                                    medicalConditions: userData.medicalConditions || '',
                                                    medications: userData.medications || ''
                                                });
                                            }}
                                            className="px-5 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 font-medium border border-white/20"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-5 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    {userData.role !== 'Admin' ? (
                        <div className="p-8">
                            {userData.role === 'Doctor' ? (
                                <div className="space-y-8">
                                    {/* Personal Information Card */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <FaUser className="text-blue-500 text-xl" />
                                            <label className="text-xl font-semibold text-gray-900">
                                                Personal Information
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Name */}
                                            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaIdCard className="text-blue-500" />
                                                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter your name"
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 font-medium">{userData.name}</p>
                                                )}
                                            </div>

                                            {/* Email */}
                                            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaEnvelope className="text-blue-500" />
                                                    <label className="text-sm font-medium text-gray-700">Email</label>
                                                </div>
                                                <p className="text-gray-900 font-medium">{userData.email}</p>
                                            </div>

                                            {/* Phone */}
                                            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaPhone className="text-blue-500" />
                                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter your phone number"
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 font-medium">{userData.phone || 'Not set'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Information Card */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <FaUserMd className="text-blue-500 text-xl" />
                                            <label className="text-xl font-semibold text-gray-900">
                                                Professional Information
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Specialization */}
                                            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaClinicMedical className="text-blue-500" />
                                                    <label className="text-sm font-medium text-gray-700">Specialization</label>
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="specialization"
                                                        value={formData.specialization || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter your specialization"
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 font-medium">{userData.specialization || 'Not set'}</p>
                                                )}
                                            </div>

                                            {/* Clinic Name */}
                                            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaClinicMedical className="text-blue-500" />
                                                    <label className="text-sm font-medium text-gray-700">Clinic Name</label>
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="clinicName"
                                                        value={formData.clinicName || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter your clinic name"
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 font-medium">{userData.clinicName || 'Not set'}</p>
                                                )}
                                            </div>

                                            {/* Clinic Address */}
                                            <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaMapMarkerAlt className="text-blue-500" />
                                                    <label className="text-sm font-medium text-gray-700">Clinic Address</label>
                                                </div>
                                                {isEditing ? (
                                                    <textarea
                                                        name="clinicAddress"
                                                        value={formData.clinicAddress || ''}
                                                        onChange={handleInputChange}
                                                        rows="3"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter your clinic address"
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 font-medium">{userData.clinicAddress || 'Not set'}</p>
                                                )}
                                            </div>

                                            {/* About Me */}
                                            <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaInfoCircle className="text-blue-500" />
                                                    <label className="text-sm font-medium text-gray-700">About Me</label>
                                                </div>
                                                {isEditing ? (
                                                    <textarea
                                                        name="aboutMe"
                                                        value={formData.aboutMe || ''}
                                                        onChange={handleInputChange}
                                                        rows="4"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Tell us about yourself"
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 font-medium whitespace-pre-wrap">{userData.aboutMe || 'Not set'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating Statistics */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <FaStar className="text-blue-500 text-xl" />
                                            <label className="text-xl font-semibold text-gray-900">
                                                Rating Statistics
                                            </label>
                                        </div>
                                        <DoctorPersonalRatingStats doctorId={userData._id} />
                                    </div>

                                    {/* Recent Feedbacks */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <FaStar className="text-blue-500 text-xl" />
                                            <label className="text-xl font-semibold text-gray-900">
                                                Recent Patient Feedbacks
                                            </label>
                                        </div>
                                        {ratings.length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500">No feedbacks yet</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {ratings.slice(0, 5).map((rating) => (
                                                    <div key={rating._id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                                                    {rating.patientId?.name?.charAt(0) || 'P'}
                                                                </div>
                                                                <span className="font-medium text-gray-900">
                                                                    {rating.patientId?.name || 'Anonymous Patient'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, index) => {
                                                                    const starValue = index + 1;
                                                                    const isHalfStar = rating.rating % 1 !== 0 && 
                                                                        Math.ceil(rating.rating) === starValue;
                                                                    const isFullStar = rating.rating >= starValue;
                                                                    
                                                                    return isHalfStar ? (
                                                                        <FaStarHalfAlt
                                                                            key={index}
                                                                            className="text-yellow-400 w-4 h-4"
                                                                        />
                                                                    ) : (
                                                                        <FaStar
                                                                            key={index}
                                                                            className={`w-4 h-4 ${
                                                                                isFullStar ? 'text-yellow-400' : 'text-gray-300'
                                                                            }`}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                        {rating.feedback && (
                                                            <p className="text-gray-600 text-sm mt-2">
                                                                {rating.feedback}
                                                            </p>
                                                        )}
                                                        <p className="text-gray-400 text-xs mt-2">
                                                            {new Date(rating.createdAt).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : userData.role === 'Patient' ? (
                                <div className="space-y-8">
                                    {/* Personal Information Card */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <FaUser className="text-blue-500 text-xl" />
                                            <label className="text-xl font-semibold text-gray-900">
                                                Personal Information
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Name */}
                                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaIdCard className="text-blue-500" />
                                                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter your name"
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 font-medium">{userData.name}</p>
                                                )}
                                            </div>

                                            {/* Email */}
                                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaEnvelope className="text-blue-500" />
                                                    <label className="text-sm font-medium text-gray-700">Email</label>
                                                </div>
                                                <p className="text-gray-900 font-medium">{userData.email}</p>
                                            </div>

                                            {/* Phone */}
                                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaPhone className="text-blue-500" />
                                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter your phone number"
                                                    />
                                                ) : (
                                                    <p className="text-gray-900 font-medium">{userData.phone || 'Not set'}</p>
                                                )}
                                            </div>

                                            {/* Blood Type */}
                                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaTint className="text-blue-500" />
                                                    <label className="text-sm font-medium text-gray-700">Blood Type</label>
                                                </div>
                                            {isEditing ? (
                                                <select
                                                    name="bloodType"
                                                    value={formData.bloodType}
                                                    onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="">Select Blood Type</option>
                                                    {bloodTypes.map(type => (
                                                            <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                    <p className="text-gray-900 font-medium">{userData.bloodType || 'Not set'}</p>
                                                )}
                                                </div>
                                        </div>
                                    </div>

                                    {/* Appointment History Section */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <FaHistory className="text-blue-500 text-xl" />
                                            <label className="text-xl font-semibold text-gray-900">
                                                Appointment History
                                            </label>
                                        </div>
                                        <AppointmentHistory />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6">
                                    {/* Add admin-specific content here */}
                                    <div className="space-y-8">
                                        {/* Personal Information Card */}
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                            <div className="flex items-center gap-2 mb-6">
                                                <FaUser className="text-blue-500 text-xl" />
                                                <label className="text-xl font-semibold text-gray-900">
                                                    Personal Information
                                                </label>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Name */}
                                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FaIdCard className="text-blue-500" />
                                                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                                                    </div>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={formData.name}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Enter your name"
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900 font-medium">{userData.name}</p>
                                                    )}
                                                </div>

                                                {/* Email */}
                                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FaEnvelope className="text-blue-500" />
                                                        <label className="text-sm font-medium text-gray-700">Email</label>
                                                    </div>
                                                    <p className="text-gray-900 font-medium">{userData.email}</p>
                                                </div>

                                                {/* Phone */}
                                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FaPhone className="text-blue-500" />
                                                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                                    </div>
                                                    {isEditing ? (
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={formData.phone || ''}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Enter your phone number"
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900 font-medium">{userData.phone || 'Not set'}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Add admin-specific content here */}
                            <div className="space-y-8">
                                {/* Personal Information Card */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <FaUser className="text-blue-500 text-xl" />
                                        <label className="text-xl font-semibold text-gray-900">
                                            Personal Information
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaIdCard className="text-blue-500" />
                                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                            </div>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Enter your name"
                                                />
                                            ) : (
                                                <p className="text-gray-900 font-medium">{userData.name}</p>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaEnvelope className="text-blue-500" />
                                                <label className="text-sm font-medium text-gray-700">Email</label>
                                            </div>
                                            <p className="text-gray-900 font-medium">{userData.email}</p>
                                        </div>

                                        {/* Phone */}
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaPhone className="text-blue-500" />
                                                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                            </div>
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Enter your phone number"
                                                />
                                            ) : (
                                                <p className="text-gray-900 font-medium">{userData.phone || 'Not set'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile; 