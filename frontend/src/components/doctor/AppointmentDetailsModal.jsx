import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';

const AppointmentDetailsModal = ({ 
    appointment, 
    showModal, 
    onClose, 
    onAppointmentUpdate 
}) => {
    const { backendUrl } = React.useContext(AppContext);
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const formatDateTime = (dateString) => {
        if (!dateString) return 'Invalid date';
        try {
            const [day, month, year] = dateString.split('/');
            const dateObj = new Date(year, month - 1, day);
            if (isNaN(dateObj)) return 'Invalid date';
            return format(dateObj, 'MMM d, yyyy');
        } catch (error) {
            return 'Invalid date';
        }
    };

    const formatTime = (timeString) => {
        try {
            // If time is already in 12-hour format, return it
            if (/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(timeString)) {
                return timeString;
            }
            // If time is in HH:mm format, convert to 12-hour format
            if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
                const [hours, minutes] = timeString.split(':');
                const hour = parseInt(hours, 10);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
            }
            // If time is a Date object or date string, extract and format the time
            const date = new Date(timeString);
            return format(date, 'hh:mm a');
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

    if (!showModal || !appointment) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ marginTop: '-82px' }}>
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative">
                <button
                    onClick={() => {
                        onClose();
                        setShowCancelForm(false);
                        setCancelReason('');
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
                    {appointment.notes && (
                        <div>
                            <p className="text-gray-600 text-sm">Notes</p>
                            <p className="font-semibold text-lg">{appointment.notes}</p>
                        </div>
                    )}
                </div>

                {showCancelForm && (
                    <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
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
                                onClick={handleCancelSubmit}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-end space-x-4">
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
    );
};

export default AppointmentDetailsModal; 