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
            <h1 className="admin-page-title">Find Doctors</h1>
            <div className="admin-card">
                {doctors.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No doctors found</div>
                ) : (
                    <table className="admin-table">
                        <thead className="admin-table-header">
                            <tr>
                                <th className="admin-table-header-cell">No.</th>
                                <th className="admin-table-header-cell">Doctor Name</th>
                                <th className="admin-table-header-cell">Specialization</th>
                                <th className="admin-table-header-cell">Clinic Name</th>
                                <th className="admin-table-header-cell">Contact Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.map((doctor, index) => (
                                <tr 
                                    key={doctor._id || index} 
                                    className="admin-table-row cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleDoctorClick(doctor._id)}
                                >
                                    <td className="admin-table-cell">{index + 1}</td>
                                    <td className="admin-table-cell admin-table-cell-bold">{doctor.name || 'N/A'}</td>
                                    <td className="admin-table-cell">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                            {doctor.specialization || 'Not specified'}
                                        </span>
                                    </td>
                                    <td className="admin-table-cell">{doctor.clinicName || 'Not specified'}</td>
                                    <td className="admin-table-cell">{doctor.email || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DoctorList; 