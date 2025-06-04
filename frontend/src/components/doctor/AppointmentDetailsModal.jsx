import React, { useState, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import DeleteConfirmationModal from '../DeleteConfirmationModal';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AppointmentPDF from '../AppointmentPDF';
import AppointmentPDFPreview from '../AppointmentPDFPreview';

const AppointmentDetailsModal = ({ 
    appointment, 
    showModal, 
    onClose, 
    onAppointmentUpdate 
}) => {
    const { backendUrl } = React.useContext(AppContext);
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isEditingComment, setIsEditingComment] = useState(false);
    const [doctorComment, setDoctorComment] = useState('');
    const [isCompleting, setIsCompleting] = useState(false);
    const [showPDFPreview, setShowPDFPreview] = useState(false);

    useEffect(() => {
        if (appointment) {
            setDoctorComment(appointment.doctorComment || '');
        }
    }, [appointment]);

    const formatDateTime = (dateString) => {
        try {
            // Parse date from DD/MM/YYYY format
            const [day, month, year] = dateString.split('/');
            const date = new Date(year, month - 1, day);
            
            if (!isValid(date)) {
                return 'Invalid date';
            }
            return format(date, 'MMM d, yyyy');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    const formatTime = (timeString) => {
        try {
            // If the time is already in 12-hour format, return it
            if (/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(timeString)) {
                return timeString;
            }
            
            // If it's in HH:mm format, convert to 12-hour format
            if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
                const [hours, minutes] = timeString.split(':');
                const hour = parseInt(hours, 10);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
            }
            
            return 'Invalid time';
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Invalid time';
        }
    };

    const handleCancelClick = () => {
        setShowCancelForm(true);
    };

    const handleCancelSubmit = async () => {
        if (!cancelReason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }

        try {
            const response = await axios.delete(
                `${backendUrl}/api/appointments/${appointment._id}`,
                { 
                    data: { cancelReason },
                    withCredentials: true 
                }
            );

            if (response.data.success) {
                toast.success('Appointment canceled successfully');
                setShowCancelForm(false);
                setCancelReason('');
                onClose();
                if (onAppointmentUpdate) {
                    onAppointmentUpdate();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel appointment');
        }
    };

    const handleCommentSubmit = async () => {
        try {
            const response = await axios.put(
                `${backendUrl}/api/appointments/${appointment._id}/comment`,
                { doctorComment },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Comment updated successfully');
                setIsEditingComment(false);
                if (onAppointmentUpdate) {
                    onAppointmentUpdate();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update comment');
        }
    };

    const handleCompleteAppointment = async () => {
        try {
            setIsCompleting(true);
            const response = await axios.put(
                `${backendUrl}/api/appointments/${appointment._id}/status`,
                { status: 'Completed', doctorComment },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Appointment marked as completed');
                if (onAppointmentUpdate) {
                    onAppointmentUpdate();
                }
                onClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to complete appointment');
        } finally {
            setIsCompleting(false);
        }
    };

    if (!showModal || !appointment) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ marginTop: '-82px' }}>
                <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <button
                        onClick={() => {
                            onClose();
                            setShowCancelForm(false);
                            setCancelReason('');
                            setIsEditingComment(false);
                        }}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                    <h2 className="text-2xl font-bold mb-6">Appointment Details</h2>
                    <div className="space-y-6">
                        <div>
                            <p className="text-gray-600 text-sm">Patient Name</p>
                            <p className="font-semibold text-lg">{appointment.patientId?.name || 'Unknown Patient'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Date & Time</p>
                            <p className="font-semibold text-lg">
                                {formatDateTime(appointment.slotId?.date)}
                            </p>
                            <p className="text-gray-500">
                                {formatTime(appointment.slotId?.startTime)} - 
                                {formatTime(appointment.slotId?.endTime)}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Status</p>
                            <p className={`font-semibold text-lg ${
                                appointment.status === 'Completed' ? 'text-blue-600' :
                                appointment.status === 'Confirmed' ? 'text-green-600' :
                                'text-red-600'
                            }`}>
                                {appointment.status}
                            </p>
                        </div>
                        {appointment.status === 'Canceled' && (
                            <div>
                                <p className="text-gray-600 text-sm">Cancellation Reason</p>
                                <p className="font-semibold text-lg text-red-600">
                                    {appointment.cancelReason || 'No reason provided'}
                                </p>
                            </div>
                        )}
                        {appointment.status === 'Confirmed' && (
                            <div className="mt-6 p-4 border border-blue-200 rounded-md bg-blue-50">
                                <h3 className="text-lg font-semibold text-blue-800 mb-4">Complete Appointment</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Doctor's Comment
                                        </label>
                                        <textarea
                                            value={doctorComment}
                                            onChange={(e) => setDoctorComment(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="4"
                                            placeholder="Enter your comments about the appointment..."
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleCompleteAppointment}
                                            disabled={isCompleting}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                                        >
                                            {isCompleting ? 'Completing...' : 'Mark as Completed'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {appointment.status === 'Completed' && (
                            <div className="mt-6 p-4 border border-green-200 rounded-md bg-green-50">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold text-green-800">Doctor's Comment</h3>
                                    {!isEditingComment && (
                                        <button
                                            onClick={() => setIsEditingComment(true)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                                {isEditingComment ? (
                                    <div className="space-y-4">
                                        <textarea
                                            value={doctorComment}
                                            onChange={(e) => setDoctorComment(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="4"
                                            placeholder="Enter your comments about the appointment..."
                                        />
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => {
                                                    setIsEditingComment(false);
                                                    setDoctorComment(appointment.doctorComment || '');
                                                }}
                                                className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleCommentSubmit}
                                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-700">
                                        {appointment.doctorComment || 'No comment provided'}
                                    </p>
                                )}
                            </div>
                        )}
                        {appointment.notes && (
                            <div>
                                <p className="text-gray-600 text-sm">Notes</p>
                                <p className="font-semibold text-lg">{appointment.notes}</p>
                            </div>
                        )}
                    </div>

                    {showCancelForm && (
                        <div className="mt-6 p-4 border border-red-200 rounded-md bg-red-50">
                            <p className="text-red-600 font-medium mb-2">Please provide a reason for cancellation:</p>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full p-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                rows="3"
                                placeholder="Enter reason for cancellation..."
                            />
                            <div className="mt-2 flex justify-end space-x-2">
                                <button
                                    onClick={() => {
                                        setShowCancelForm(false);
                                        setCancelReason('');
                                    }}
                                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-between">
                        <div className="flex space-x-4">
                            {appointment.status === 'Completed' && (
                                <>
                                    <button
                                        onClick={() => setShowPDFPreview(true)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        Get PDF
                                    </button>
                                    {showPDFPreview && (
                                        <AppointmentPDFPreview
                                            appointment={appointment}
                                            onClose={() => setShowPDFPreview(false)}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex space-x-4">
                            {appointment.status === 'Confirmed' && (
                                <button
                                    onClick={handleCancelClick}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    Cancel with Reason
                                </button>
                            )}
                            {appointment.status === 'Completed' && (
                                <p className="text-green-600 font-medium">This appointment has been completed</p>
                            )}
                            <button
                                onClick={() => {
                                    onClose();
                                    setShowCancelForm(false);
                                    setCancelReason('');
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteConfirmationModal
                showModal={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setShowCancelForm(false);
                }}
                onConfirm={handleCancelSubmit}
                title="Cancel Appointment"
                message="Are you sure you want to cancel this appointment? This action cannot be undone."
            />
        </>
    );
};

export default AppointmentDetailsModal;