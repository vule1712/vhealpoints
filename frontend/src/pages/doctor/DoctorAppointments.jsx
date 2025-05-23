import React, { useState, useEffect, useContext } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/calendar.css';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const locales = {
    'en-US': enUS
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const DoctorAppointments = () => {
    const { backendUrl } = useContext(AppContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/appointments/doctor`, {
                withCredentials: true
            });

            if (response.data.success) {
                const formattedAppointments = response.data.appointments.map(appointment => ({
                    id: appointment._id,
                    title: `Appointment with ${appointment.patientId.name}`,
                    start: new Date(appointment.slotId.date),
                    end: new Date(appointment.slotId.date),
                    status: appointment.status,
                    notes: appointment.notes,
                    cancelReason: appointment.cancelReason,
                    patient: appointment.patientId
                }));
                setAppointments(formattedAppointments);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectEvent = (appointment) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
    };

    const handleUpdateStatus = async (status) => {
        try {
            const response = await axios.put(
                `${backendUrl}/api/appointments/${selectedAppointment.id}/status`,
                { 
                    status,
                    cancelReason: status === 'Canceled' ? cancelReason : undefined
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Appointment status updated successfully');
                fetchAppointments();
                setShowModal(false);
                setCancelReason('');
                setShowCancelForm(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update appointment status');
        }
    };

    const handleCancelClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowCancelForm(true);
    };

    const handleCancelSubmit = async () => {
        if (!cancelReason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }

        try {
            const response = await axios.put(
                `${backendUrl}/api/appointments/${selectedAppointment._id}/status`,
                { 
                    status: 'Canceled',
                    cancelReason 
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Appointment canceled successfully');
                setShowCancelForm(false);
                setCancelReason('');
                fetchAppointments(); // Refresh the list
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel appointment');
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3174ad';
        switch (event.status) {
            case 'Confirmed':
                backgroundColor = '#28a745';
                break;
            case 'Canceled':
                backgroundColor = '#dc3545';
                break;
            case 'Pending':
                backgroundColor = '#ffc107';
                break;
            default:
                break;
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    if (loading) {
        return (
            <div className="admin-loading-spinner">
                <div className="admin-spinner"></div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-82px)] p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Appointments Calendar</h1>
            <div className="bg-white rounded-lg shadow-md p-6 h-[calc(100%-1rem)]">
                <Calendar
                    localizer={localizer}
                    events={appointments}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={handleSelectEvent}
                    views={['month', 'week', 'day']}
                    popup
                    selectable
                />
            </div>

            {/* Appointment Details Modal */}
            {showModal && selectedAppointment && !showCancelForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ marginTop: '-82px' }}>
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative">
                        <button
                            onClick={() => {
                                setShowModal(false);
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
                                <p className="font-semibold text-lg">{selectedAppointment.patient.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">Date & Time</p>
                                <p className="font-semibold text-lg">
                                    {format(selectedAppointment.start, 'PPP p')}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">Status</p>
                                <p className={`font-semibold text-lg ${
                                    selectedAppointment.status === 'Completed' ? 'text-blue-600' :
                                    selectedAppointment.status === 'Confirmed' ? 'text-green-600' :
                                    selectedAppointment.status === 'Pending' ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {selectedAppointment.status}
                                </p>
                            </div>
                            {selectedAppointment.status === 'Canceled' && (
                                <div>
                                    <p className="text-gray-600 text-sm">Cancellation Reason</p>
                                    <p className="font-semibold text-lg text-red-600">
                                        {selectedAppointment.cancelReason || 'No reason provided'}
                                    </p>
                                </div>
                            )}
                            {selectedAppointment.notes && (
                                <div>
                                    <p className="text-gray-600">Notes</p>
                                    <p className="font-semibold">{selectedAppointment.notes}</p>
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

                        <div className="mt-6 flex justify-end space-x-4">
                            {selectedAppointment.status === 'Pending' && (
                                <>
                                    <button
                                        onClick={() => handleUpdateStatus('Confirmed')}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={handleCancelClick}
                                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        Cancel with Reason
                                    </button>
                                </>
                            )}
                            {selectedAppointment.status === 'Confirmed' && (
                                <>
                                    <button
                                        onClick={() => handleUpdateStatus('Completed')}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        Mark as Completed
                                    </button>
                                    <button
                                        onClick={handleCancelClick}
                                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        Cancel with Reason
                                    </button>
                                </>
                            )}
                            {selectedAppointment.status === 'Completed' && (
                                <p className="text-green-600 font-medium">This appointment has been completed</p>
                            )}
                            <button
                                onClick={() => {
                                    setShowModal(false);
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
            )}
        </div>
    );
};

export default DoctorAppointments; 