import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import '../../styles/components.css';

const PatientList = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { backendUrl } = useContext(AppContext);

    // Fetch patient list from the backend
    const fetchPatients = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/user/patient', {
                withCredentials: true
            });
            if (response.data.success) {
                setPatients(response.data.patients || []);
            } else {
                setError(response.data.message || 'Failed to fetch patients');
                setPatients([]);
            }
            setError(null);
        } catch (error) {
            console.error('Error fetching patients:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch patients. Please try again later.';
            setError(errorMessage);
            toast.error(errorMessage);
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [backendUrl]);

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
            <h1 className="admin-page-title">Patient List</h1>
            <div className="admin-card">
                {patients.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No patients found</div>
                ) : (
                    <table className="admin-table">
                        <thead className="admin-table-header">
                            <tr>
                                <th className="admin-table-header-cell">No.</th>
                                <th className="admin-table-header-cell">Patient Name</th>
                                <th className="admin-table-header-cell">Contact Email</th>
                                <th className="admin-table-header-cell">Blood Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((patient, index) => (
                                <tr 
                                    key={patient._id || index} 
                                    className="admin-table-row"
                                >
                                    <td className="admin-table-cell">{index + 1}</td>
                                    <td className="admin-table-cell admin-table-cell-bold">{patient.name || 'N/A'}</td>
                                    <td className="admin-table-cell">{patient.email || 'N/A'}</td>
                                    <td className="admin-table-cell">
                                        <span className={`px-2 py-1 rounded-full text-sm ${
                                            patient.bloodType ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {patient.bloodType || 'Not Set'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PatientList; 