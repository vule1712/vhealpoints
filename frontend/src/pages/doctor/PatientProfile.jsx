import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import AppointmentDetailsModal from '../../components/doctor/AppointmentDetailsModal';
import { FaArrowLeft } from 'react-icons/fa';
import '../../styles/components.css';

const PatientProfile = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { backendUrl } = useContext(AppContext);
    const [patient, setPatient] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                setLoading(true);
                // Fetch patient details
                const patientResponse = await axios.get(`${backendUrl}/api/user/${patientId}`, {
                    withCredentials: true
                });

                if (patientResponse.data.success) {
                    setPatient(patientResponse.data.userData);
                } else {
                    setError(patientResponse.data.message);
                    toast.error(patientResponse.data.message);
                }

                // Fetch appointments with this patient
                const appointmentsResponse = await axios.get(`${backendUrl}/api/appointments/doctor`, {
                    withCredentials: true
                });

                if (appointmentsResponse.data.success) {
                    // Filter appointments for this specific patient
                    const patientAppointments = appointmentsResponse.data.appointments.filter(
                        apt => apt.patientId._id === patientId
                    );
                    setAppointments(patientAppointments);
                }
            } catch (error) {
                console.error('Error fetching patient data:', error);
                const errorMessage = error.response?.data?.message || 'Failed to fetch patient data';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchPatientData();
    }, [patientId, backendUrl]);

    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
    };

    const handleAppointmentUpdate = () => {
        // Refresh appointments after update
        const fetchAppointments = async () => {
            try {
                const appointmentsResponse = await axios.get(`${backendUrl}/api/appointments/doctor`, {
                    withCredentials: true
                });

                if (appointmentsResponse.data.success) {
                    const patientAppointments = appointmentsResponse.data.appointments.filter(
                        apt => apt.patientId._id === patientId
                    );
                    setAppointments(patientAppointments);
                }
            } catch (error) {
                console.error('Error refreshing appointments:', error);
                toast.error('Failed to refresh appointments');
            }
        };

        fetchAppointments();
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="admin-page-title">Patient Profile</h1>
                <button
                    onClick={() => navigate('/doctor/patients')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                    <FaArrowLeft className="w-4 h-4" />
                    <span>Back to Patients</span>
                </button>
            </div>

            {/* Patient Information */}
            <div className="admin-card">
                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-600">Name</p>
                        <p className="font-medium">{patient?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium">{patient?.email || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Blood Type</p>
                        <p className="font-medium">
                            <span className={`px-2 py-1 rounded-full text-sm ${
                                patient?.bloodType ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                                {patient?.bloodType || 'Not Set'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Appointment History */}
            <div className="admin-card">
                <h2 className="text-xl font-semibold mb-4">Appointment History</h2>
                {appointments.length === 0 ? (
                    <p className="text-gray-500">No appointments found</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead className="admin-table-header">
                                <tr>
                                    <th className="admin-table-header-cell">Date</th>
                                    <th className="admin-table-header-cell">Time Slot</th>
                                    <th className="admin-table-header-cell">Status</th>
                                    <th className="admin-table-header-cell">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((appointment) => (
                                    <tr 
                                        key={appointment._id} 
                                        className="admin-table-row cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleAppointmentClick(appointment)}
                                    >
                                        <td className="admin-table-cell">
                                            {appointment.slotId?.date || 'N/A'}
                                        </td>
                                        <td className="admin-table-cell">
                                            {appointment.slotId ? 
                                                `${appointment.slotId.startTime} - ${appointment.slotId.endTime}` : 
                                                'N/A'
                                            }
                                        </td>
                                        <td className="admin-table-cell">
                                            <span className={`px-2 py-1 rounded-full text-sm ${
                                                appointment.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                                appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                appointment.status === 'Canceled' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {appointment.status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="admin-table-cell">
                                            {appointment.notes || 'No notes'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Appointment Details Modal */}
            <AppointmentDetailsModal
                appointment={selectedAppointment}
                showModal={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedAppointment(null);
                }}
                onAppointmentUpdate={handleAppointmentUpdate}
            />
        </div>
    );
};

export default PatientProfile; 