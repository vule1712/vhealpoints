import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import '../../styles/components.css';

const DoctorProfile = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const { backendUrl } = useContext(AppContext);
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDoctorDetails = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/user/${doctorId}`, {
                    withCredentials: true
                });
                
                if (response.data.success) {
                    setDoctor(response.data.userData);
                } else {
                    setError(response.data.message || 'Failed to fetch doctor details');
                    toast.error(response.data.message || 'Failed to fetch doctor details');
                }
            } catch (error) {
                console.error('Error fetching doctor details:', error);
                const errorMessage = error.response?.data?.message || 'Failed to fetch doctor details';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorDetails();
    }, [doctorId, backendUrl]);

    const handleBookAppointment = () => {
        // TODO: Implement appointment booking functionality
        toast.info('Appointment booking feature coming soon!');
    };

    if (loading) {
        return (
            <div className="admin-loading-spinner">
                <div className="admin-spinner"></div>
            </div>
        );
    }

    if (error || !doctor) {
        return (
            <div className="admin-loading-spinner">
                <div className="text-red-500">{error || 'Doctor not found'}</div>
            </div>
        );
    }

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
                        Back to Doctors List
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 text-center">Doctor Profile</h1>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
                        <div className="flex items-center">
                            <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-blue-500 text-4xl font-bold">
                                {doctor.name.charAt(0)}
                            </div>
                            <div className="ml-6 text-white">
                                <h2 className="text-2xl font-bold">{doctor.name}</h2>
                                <p className="text-blue-100">{doctor.email}</p>
                                <div className="mt-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-400 bg-opacity-20">
                                        {doctor.specialization || 'General Practitioner'}
                                    </span>
                                    <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        doctor.isAccountVerified 
                                            ? 'bg-green-400 bg-opacity-20 text-green-100' 
                                            : 'bg-yellow-400 bg-opacity-20 text-yellow-100'
                                    }`}>
                                        {doctor.isAccountVerified ? 'Verified' : 'Not Verified'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Specialization</h3>
                                    <p className="mt-1 text-lg text-gray-900">
                                        {doctor.specialization || 'Not specified'}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Clinic Name</h3>
                                    <p className="mt-1 text-lg text-gray-900">
                                        {doctor.clinicName || 'Not specified'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Clinic Address</h3>
                                <p className="mt-1 text-lg text-gray-900">
                                    {doctor.clinicAddress || 'Not specified'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={handleBookAppointment}
                                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Book Appointment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorProfile; 