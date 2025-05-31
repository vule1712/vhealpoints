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
import { toast } from 'react-hot-toast';
import AppointmentDetailsModal from '../../components/doctor/AppointmentDetailsModal';
import CalendarToolbar from '../../components/CalendarToolbar';

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

const DoctorAppointments = () => {
    const { backendUrl } = useContext(AppContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/appointments/doctor`, {
                withCredentials: true
            });

            if (response.data.success && Array.isArray(response.data.appointments)) {
                const formattedAppointments = response.data.appointments.map(appointment => {
                    try {
                        // Get the date from the slot
                        const slotDate = appointment.slotId.date;
                        const [day, month, year] = slotDate.split('/');

                        // Get start and end times
                        let startTime, endTime;

                        // Handle different time formats
                        if (appointment.slotId.startTime instanceof Date) {
                            startTime = appointment.slotId.startTime;
                        } else if (typeof appointment.slotId.startTime === 'string') {
                            // Parse 12-hour format (e.g., "09:00 AM")
                            const [time, period] = appointment.slotId.startTime.split(' ');
                            let [hours, minutes] = time.split(':');
                            hours = parseInt(hours);
                            if (period === 'PM' && hours !== 12) hours += 12;
                            if (period === 'AM' && hours === 12) hours = 0;
                            startTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, parseInt(minutes));
                        }

                        if (appointment.slotId.endTime instanceof Date) {
                            endTime = appointment.slotId.endTime;
                        } else if (typeof appointment.slotId.endTime === 'string') {
                            // Parse 12-hour format (e.g., "10:00 AM")
                            const [time, period] = appointment.slotId.endTime.split(' ');
                            let [hours, minutes] = time.split(':');
                            hours = parseInt(hours);
                            if (period === 'PM' && hours !== 12) hours += 12;
                            if (period === 'AM' && hours === 12) hours = 0;
                            endTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, parseInt(minutes));
                        }

                        // Validate dates
                        if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                            console.error('Invalid date/time for appointment:', {
                                id: appointment._id,
                                date: slotDate,
                                startTime: appointment.slotId.startTime,
                                endTime: appointment.slotId.endTime
                            });
                            return null;
                        }

                        return {
                            id: appointment._id,
                            title: `${appointment.patientId?.name || 'Unknown Patient'}`,
                            start: startTime,
                            end: endTime,
                            status: appointment.status,
                            notes: appointment.notes,
                            cancelReason: appointment.cancelReason,
                            patientId: appointment.patientId,
                            slotId: appointment.slotId,
                            _id: appointment._id
                        };
                    } catch (error) {
                        console.error('Error formatting appointment:', error);
                        return null;
                    }
                }).filter(Boolean); // Remove any null entries

                setAppointments(formattedAppointments);
            } else {
                toast.error('Invalid response format from server');
                setAppointments([]);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch appointments');
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectEvent = (appointment) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
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
            case 'Completed':
                backgroundColor = '#007bff';
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

    const handleAppointmentUpdate = () => {
        fetchAppointments();
    };

    if (loading) {
        return (
            <div className="doctor-loading-spinner">
                <div className="doctor-spinner"></div>
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
                    min={new Date(0, 0, 0, 8, 0, 0)} // 8 AM
                    max={new Date(0, 0, 0, 20, 0, 0)} // 8 PM
                    components={{ toolbar: CalendarToolbar }}
                />
            </div>

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

export default DoctorAppointments; 