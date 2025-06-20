import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import { format, isValid, parseISO } from 'date-fns';
import { FaArrowLeft, FaCalendarPlus, FaStar, FaEdit, FaStarHalfAlt } from 'react-icons/fa';
import AppointmentDetailsModal from '../../components/patient/AppointmentDetailsModal';
import DoctorRatingModal from '../../components/patient/DoctorRatingModal';
import EditFeedbackModal from '../../components/patient/EditFeedbackModal';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import '../../styles/components.css';

// Helper to parse DD/MM/YYYY or ISO date
function parseDateString(dateStr) {
  // Try ISO first
  let dateObj = new Date(dateStr);
  if (isValid(dateObj)) return dateObj;
  // Try DD/MM/YYYY
  const match = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(dateStr);
  if (match) {
    const [, day, month, year] = match;
    dateObj = new Date(`${year}-${month}-${day}`);
    if (isValid(dateObj)) return dateObj;
  }
  return null;
}

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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState(null);

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
                // First check if patient can rate
                const canRateResponse = await axios.get(`${backendUrl}/api/doctor-ratings/can-rate/${doctorId}`, {
                    withCredentials: true
                });

                // Then fetch the ratings
                const response = await axios.get(`${backendUrl}/api/doctor-ratings/${doctorId}`, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.data.success) {
                    setRatings(response.data.ratings);
                    // Only show toast if patient can rate
                    if (canRateResponse.data.success && canRateResponse.data.canRate) {
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

    const handleDeleteFeedback = async () => {
        try {
            const response = await axios.delete(`${backendUrl}/api/doctor-ratings/${doctorId}/${feedbackToDelete}`, {
                withCredentials: true
            });

            if (response.data.success) {
                setRatings(prevRatings => prevRatings.filter(rating => rating._id !== feedbackToDelete));
                toast.success('Feedback deleted successfully');
            } else {
                toast.error(response.data.message || 'Failed to delete feedback');
            }
        } catch (err) {
            console.error('Error deleting feedback:', err);
            toast.error(err.response?.data?.message || 'Error deleting feedback');
        } finally {
            setShowDeleteModal(false);
            setFeedbackToDelete(null);
        }
    };

    const refreshRatings = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/doctor-ratings/${doctorId}`, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                setRatings(response.data.ratings);
            } else {
                toast.error(response.data.message || 'Failed to fetch ratings');
            }
        } catch (err) {
            console.error('Error fetching ratings:', err);
            toast.error(err.response?.data?.message || 'Failed to fetch ratings');
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
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-gray-900">{doctor?.name}</h2>
                            {ratings.length > 0 && (
                                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                                    <FaStar className="text-yellow-500" />
                                    <span className="text-sm font-medium text-yellow-800">
                                        {ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length}
                                    </span>
                                </div>
                            )}
                        </div>
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
                            <div>
                                <p className="text-gray-600">Phone Number</p>
                                <p className="font-medium">{doctor?.phone || 'Not specified'}</p>
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient's Feedback */}
            <div className="admin-card">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">Doctor's Feedback</h2>
                        {ratings.length > 0 && (
                            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                                <span className="font-medium text-blue-900">
                                    {ratings.length} {ratings.length === 1 ? 'Feedback' : 'Feedbacks'}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setShowRatingModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <FaStar className="w-4 h-4" />
                        <span className="font-medium">Give Feedback</span>
                    </button>
                </div>
                {ratings.length > 0 ? (
                    <div className="space-y-6">
                        {ratings.map((rating) => (
                            <div key={rating._id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {rating.patientId?.name?.charAt(0) || 'P'}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900 block">{rating.patientId?.name || 'Anonymous Patient'}</span>
                                            <span className="text-sm text-gray-500">
                                                {rating.createdAt && isValid(new Date(rating.createdAt))
                                                    ? format(new Date(rating.createdAt), 'MMM dd, yyyy')
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    {rating.patientId?._id === userData?._id && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedFeedback(rating);
                                                    setShowEditModal(true);
                                                }}
                                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Edit feedback"
                                            >
                                                <FaEdit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setFeedbackToDelete(rating._id);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                                title="Delete feedback"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    {[...Array(5)].map((_, index) => {
                                        const ratingValue = index + 1;
                                        const halfRating = rating.rating - index;
                                        if (halfRating >= 1) {
                                            return <FaStar key={index} className="text-yellow-400" />;
                                        } else if (halfRating >= 0.5) {
                                            return <FaStarHalfAlt key={index} className="text-yellow-400" />;
                                        } else {
                                            return <FaStar key={index} className="text-gray-300" />;
                                        }
                                    })}
                                    <span className="text-sm font-medium text-gray-600">{rating.rating.toFixed(1)}</span>
                                </div>
                                <p className="text-gray-600 whitespace-pre-wrap">{rating.feedback}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <FaStar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No feedback available yet</p>
                        <p className="text-sm text-gray-400 mt-2">Be the first to rate this doctor</p>
                        <button
                            onClick={() => setShowRatingModal(true)}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200"
                        >
                            <FaStar className="w-4 h-4" />
                            <span className="font-medium">Give Feedback</span>
                        </button>
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
                                            {(() => {
                                                const dateVal = appointment.slotId?.date;
                                                const dateObj = dateVal ? parseDateString(dateVal) : null;
                                                if (!dateObj) {
                                                    console.warn('Invalid slot date for appointment:', appointment, 'Raw date:', dateVal);
                                                    return <span className="text-red-500">Invalid date</span>;
                                                }
                                                return format(dateObj, 'MMM dd, yyyy');
                                            })()}
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

            {showRatingModal && (
                <DoctorRatingModal
                    show={showRatingModal}
                    onClose={() => {
                        setShowRatingModal(false);
                        refreshRatings(); // Refresh ratings after closing the modal
                    }}
                    doctorId={doctorId}
                />
            )}

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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <DeleteConfirmationModal
                    showModal={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setFeedbackToDelete(null);
                    }}
                    onConfirm={handleDeleteFeedback}
                    title="Delete Feedback"
                    message="Are you sure you want to delete this feedback? This action cannot be undone."
                />
            )}
        </div>
    );
};

export default DoctorProfile; 