import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import '../../styles/components.css';

const DoctorList = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { backendUrl } = useContext(AppContext);
    const navigate = useNavigate();

    // Fetch doctor list from the backend
    const fetchDoctors = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/user/doctor', {
                withCredentials: true
            });
            if (response.data.success) {
                setDoctors(response.data.doctors || []);
            } else {
                setError(response.data.message || 'Failed to fetch doctors');
                setDoctors([]);
            }
            setError(null);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch doctors. Please try again later.';
            setError(errorMessage);
            toast.error(errorMessage);
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, [backendUrl]);

    const handleDoctorClick = (doctorId) => {
        navigate(`/patient/doctor/${doctorId}`);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Find Doctors</h2>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="border-b border-gray-200 pb-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Find Doctors</h2>
                <div className="text-red-500 text-center py-4">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Find Doctors</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors && doctors.length > 0 ? (
                    doctors.map((doctor) => (
                        <div
                            key={doctor._id}
                            onClick={() => handleDoctorClick(doctor._id)}
                            className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Dr. {doctor.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {doctor.specialization}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    doctor.isAccountVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {doctor.isAccountVerified ? 'Verified' : 'Pending'}
                                </span>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Clinic:</span> {doctor.clinicName || 'Not specified'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Email:</span> {doctor.email}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center col-span-full py-4">No doctors found</p>
                )}
            </div>
        </div>
    );
};

export default DoctorList; 