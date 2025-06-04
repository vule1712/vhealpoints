import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { FaArrowLeft, FaCalendarPlus } from 'react-icons/fa';
import AppointmentDetailsModal from '../../components/patient/AppointmentDetailsModal';
import DoctorRatingModal from '../../components/patient/DoctorRatingModal';
import EditFeedbackModal from '../../components/patient/EditFeedbackModal';
import '../../styles/components.css';

const DoctorProfile = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const { backendUrl, userData } = useContext(AppContext);
    const [doctor, setDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratings, setRatings] = useState([]);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        const fetchDoctorAndAppointments = async () => {
            try {
                setLoading(true);
                const [doctorResponse, appointmentsResponse] = await Promise.all([
                    axios.get(`${backendUrl}/api/user/${doctorId}`, {
                        withCredentials: true
                    }),
                    axios.get(`${backendUrl}/api/appointments/patient`, {
                        withCredentials: true
                    })
                ]);

                if (doctorResponse.data.success) {
                    setDoctor(doctorResponse.data.userData);
                } else {
                    setError(doctorResponse.data.message || 'Failed to fetch doctor details');
                    toast.error(doctorResponse.data.message || 'Failed to fetch doctor details');
                }

                // Filter appointments for this doctor
                const doctorAppointments = appointmentsResponse.data.appointments.filter(
                    apt => apt.doctorId._id === doctorId
                );
                console.log('Appointments:', doctorAppointments); // Debug log
                setAppointments(doctorAppointments);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.response?.data?.message || 'Error fetching data');
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorAndAppointments();
    }, [doctorId, backendUrl]);

    useEffect(() => {
        const fetchRatings = async () => {
            try {
                console.log('Fetching ratings for doctor:', doctorId);
                const response = await axios.get(`${backendUrl}/api/doctor-ratings/${doctorId}`, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Ratings response:', response.data);
                console.log('Current user:', userData);
                
                if (response.data.success) {
                    setRatings(response.data.ratings);
                    if (response.data.hasRated) {
                        toast.error('You have already rated this doctor');
                    } else {
                        toast.success('You can rate this doctor');
                    }
                } else {
                    toast.error(response.data.message || 'Failed to fetch ratings');
                }
            } catch (err) {
                console.error('Error fetching ratings:', err);
                const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch ratings';
                toast.error(errorMessage);
            }
        };

        if (doctorId) {
            fetchRatings();
        }
    }, [doctorId, backendUrl, userData]);

    const handleBookAppointment = () => {
        navigate(`/patient/book-appointment/${doctorId}`);
    };

    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
        setIsDetailsModalOpen(true);
    };

    const handleAppointmentUpdate = (updatedAppointment) => {
        setAppointments(appointments.map(apt => 
            apt._id === updatedAppointment._id ? updatedAppointment : apt
        ));
    };

    const handleFeedbackUpdate = (updatedFeedback) => {
        setRatings(prevRatings => 
            prevRatings.map(rating => 
                rating._id === updatedFeedback._id ? updatedFeedback : rating
            )
        );
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
                <h1 className="admin-page-title">Doctor Profile</h1>
                <button
                    onClick={() => navigate('/patient/doctors')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                    <FaArrowLeft className="w-4 h-4" />
                    <span>Back to Doctors</span>
                </button>
            </div>

            {/* Doctor Information */}
            <div className="admin-card">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Doctor's Avatar/Initial */}
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
                            {doctor?.name?.charAt(0) || 'D'}
                        </div>
                    </div>

                    {/* Doctor's Details */}
                    <div className="flex-grow">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{doctor?.name}</h2>
                        <p className="text-gray-600 mb-4">{doctor?.email}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-600">Specialization</p>
                                <p className="font-medium">{doctor?.specialization || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Clinic Name</p>
                                <p className="font-medium">{doctor?.clinicName || 'Not specified'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-gray-600">Clinic Address</p>
                                <p className="font-medium">{doctor?.clinicAddress || 'Not specified'}</p>
                            </div>
                            {doctor?.aboutMe && (
                                <div className="md:col-span-2">
                                    <p className="text-gray-600">About</p>
                                    <p className="font-medium whitespace-pre-wrap">{doctor.aboutMe}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-4">
                            <button
                                onClick={handleBookAppointment}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <FaCalendarPlus className="w-5 h-5" />
                                <span className="font-medium">Book Appointment</span>
                            </button>
                            <button
                                onClick={() => setShowRatingModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <span className="font-medium">Give Doctor Feedback</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient's Feedback */}
            <div className="admin-card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Doctor's Feedback</h2>
                    {console.log('User ID:', userData?._id)}
                    {console.log('Ratings:', ratings)}
                    {console.log('Has user rating:', ratings.some(rating => rating.patientId?._id === userData?._id))}
                </div>
                {ratings.length > 0 ? (
                    <div className="space-y-6">
                        {ratings.map((rating) => (
                            <div key={rating._id} className="border-b pb-6 last:border-b-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {rating.patientId?.name?.charAt(0) || 'P'}
                                        </div>
                                        <span className="font-medium text-gray-900">{rating.patientId?.name || 'Anonymous Patient'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">
                                            {format(new Date(rating.createdAt), 'MMM dd, yyyy')}
                                        </span>
                                        {rating.patientId?._id === userData?._id && (
                                            <button
                                                onClick={() => {
                                                    setSelectedFeedback(rating);
                                                    setShowEditModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center mb-3">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <span 
                                                key={i} 
                                                className={`text-xl ${
                                                    i < Math.floor(rating.rating) 
                                                        ? 'text-yellow-500' 
                                                        : i < rating.rating 
                                                            ? 'text-yellow-500 opacity-50' 
                                                            : 'text-gray-300'
                                                }`}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600">
                                        {rating.rating.toFixed(1)}/5
                                    </span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{rating.feedback}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No feedback available yet</p>
                        <p className="text-sm text-gray-400 mt-2">Be the first to rate this doctor</p>
                    </div>
                )}
            </div>

            {/* Appointment History */}
            <div className="admin-card">
                <h2 className="text-xl font-semibold mb-4">Your Appointments with Dr. {doctor?.name}</h2>
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
                                        onClick={() => handleAppointmentClick(appointment)}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {appointment.slotId?.date ? format(new Date(appointment.slotId.date), 'MMM dd, yyyy') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {appointment.slotId ? 
                                                `${appointment.slotId.startTime} - ${appointment.slotId.endTime}` : 
                                                'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${appointment.status?.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                                appointment.status?.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                                appointment.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                                'bg-yellow-100 text-yellow-800'}`}>
                                                {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1).toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {appointment.notes || 'No notes'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Appointment Details Modal */}
            {selectedAppointment && (
                <AppointmentDetailsModal
                    appointment={selectedAppointment}
                    showModal={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    onAppointmentUpdate={handleAppointmentUpdate}
                />
            )}

            <DoctorRatingModal
                show={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                doctorId={doctorId}
            />

            {/* Edit Feedback Modal */}
            {selectedFeedback && (
                <EditFeedbackModal
                    show={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedFeedback(null);
                    }}
                    feedback={selectedFeedback}
                    onUpdate={handleFeedbackUpdate}
                />
            )}
        </div>
    );
};

export default DoctorProfile; 