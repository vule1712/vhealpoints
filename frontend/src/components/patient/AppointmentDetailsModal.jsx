import React, { useState } from 'react';
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPDFPreview, setShowPDFPreview] = useState(false);

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
        setShowDeleteModal(true);
    };

    const handleCancelSubmit = async () => {
        try {
            const response = await axios.delete(
                `${backendUrl}/api/appointments/${appointment._id}`,
                { 
                    withCredentials: true 
                }
            );

            if (response.data.success) {
                toast.success('Appointment canceled successfully');
                setShowDeleteModal(false);
                onClose();
                if (onAppointmentUpdate) {
                    onAppointmentUpdate();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel appointment');
        }
    };

    if (!showModal || !appointment) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ marginTop: '-82px' }}>
                <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative">
                    <button
                        onClick={() => {
                            onClose();
                        }}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                    <h2 className="text-2xl font-bold mb-6">Appointment Details</h2>
                    <div className="space-y-6">
                        <div>
                            <p className="text-gray-600 text-sm">Doctor Name</p>
                            <p className="font-semibold text-lg">{appointment.doctorId?.name || 'Unknown Doctor'}</p>
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
                        {appointment.status === 'Completed' && (
                            <div className="mt-6 p-4 border border-green-200 rounded-md bg-green-50">
                                <h3 className="text-lg font-semibold text-green-800 mb-2">Doctor's Comment</h3>
                                <p className="text-gray-700">
                                    {appointment.doctorComment || 'No comment provided'}
                                </p>
                            </div>
                        )}
                        {appointment.notes && (
                            <div>
                                <p className="text-gray-600 text-sm">Notes</p>
                                <p className="font-semibold text-lg">{appointment.notes}</p>
                            </div>
                        )}
                    </div>

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
                                    Cancel the appointment
                                </button>
                            )}
                            {appointment.status === 'Completed' && (
                                <p className="text-green-600 font-medium">This appointment has been completed</p>
                            )}
                            <button
                                onClick={() => {
                                    onClose();
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
                }}
                onConfirm={handleCancelSubmit}
                title="Cancel Appointment"
                message="Are you sure you want to cancel this appointment? This action cannot be undone."
            />
        </>
    );
};

export default AppointmentDetailsModal; 