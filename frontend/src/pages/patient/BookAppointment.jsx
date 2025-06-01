import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format, addDays, isToday, isTomorrow, parseISO } from 'date-fns';

const BookAppointment = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const { backendUrl } = useContext(AppContext);
    const [doctor, setDoctor] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);

    useEffect(() => {
        fetchDoctorDetails();
    }, [doctorId]);

    const fetchDoctorDetails = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/user/${doctorId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                setDoctor(response.data.userData);
                fetchAvailableSlots();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch doctor details');
            navigate('/patient/doctors');
        }
    };

    const fetchAvailableSlots = async () => {
        setSlotsLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/api/appointments/available-slots/${doctorId}`, {
                withCredentials: true
            });

            console.log('Available slots response:', response.data);

            if (response.data.success) {
                setAvailableSlots(response.data.slots);
            } else {
                toast.error(response.data.message || 'Failed to fetch available slots');
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch available slots');
        } finally {
            setLoading(false);
            setSlotsLoading(false);
        }
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
        setSelectedSlot(null);
    };

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedSlot) {
            toast.error('Please select a time slot');
            return;
        }

        try {
            const response = await axios.post(
                `${backendUrl}/api/appointments/create`,
                {
                    doctorId,
                    slotId: selectedSlot._id,
                    notes
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Appointment booked successfully');
                navigate('/patient/appointments');
            } else {
                toast.error(response.data.message || 'Failed to book appointment');
            }
        } catch (error) {
            console.error('Error booking appointment:', error);
            toast.error(error.response?.data?.message || 'Failed to book appointment');
        }
    };

    const getDateLabel = (date) => {
        if (isToday(new Date(date))) return 'Today';
        if (isTomorrow(new Date(date))) return 'Tomorrow';
        return format(new Date(date), 'dd-MM-yyyy');
    };

    const formatTime = (timeString) => {
        try {
            // If time is already in 12-hour format, return it
            if (/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(timeString)) {
                return timeString;
            }
            // If time is in HH:mm format, convert to 12-hour format
            if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
                return format(new Date(`2000-01-01 ${timeString}`), 'hh:mm a');
            }
            // If time is a full date string, extract and format the time
            return format(new Date(timeString), 'hh:mm a');
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Invalid time';
        }
    };

    if (loading) {
        return (
            <div className="admin-loading-spinner">
                <div className="admin-spinner"></div>
            </div>
        );
    }

    if (!doctor) {
        return null;
    }

    // Filter slots for selected date
    const filteredSlots = availableSlots.filter(slot => {
        try {
            // Parse the date from DD/MM/YYYY format
            const [day, month, year] = slot.date.split('/');
            const slotDate = new Date(year, month - 1, day);
            const selectedDateObj = new Date(selectedDate);
            
            // Compare dates by year, month, and day only
            return slotDate.getFullYear() === selectedDateObj.getFullYear() &&
                   slotDate.getMonth() === selectedDateObj.getMonth() &&
                   slotDate.getDate() === selectedDateObj.getDate();
        } catch (error) {
            console.error('Error filtering slots:', error);
            return false;
        }
    });

    // Check if a slot is available for booking
    const isSlotPassed = (slot) => {
        try {
            // Parse the date string (which is in dd/MM/yyyy format)
            const [day, month, year] = slot.date.split('/');
            const date = `${year}-${month}-${day}`;

            // Convert time from 12-hour format to 24-hour format if needed
            const convertTo24Hour = (time12h) => {
                const [time, modifier] = time12h.split(' ');
                let [hours, minutes] = time.split(':');
                hours = parseInt(hours, 10);
                
                if (hours === 12) {
                    hours = 0;
                }
                if (modifier === 'PM') {
                    hours += 12;
                }
                
                return `${hours.toString().padStart(2, '0')}:${minutes}`;
            };

            const startTime = convertTo24Hour(slot.startTime);
            const endTime = convertTo24Hour(slot.endTime);

            // Check if the appointment is ongoing
            const isOngoing = isAppointmentOngoing(date, startTime, endTime);

            // Slot is passed if it's not ongoing and the end time has passed
            const yyyyMmDd = new Date(date).toISOString().split('T')[0];
            const end = new Date(`${yyyyMmDd}T${endTime}:00+07:00`);
            const now = new Date();

            return !isOngoing && now > end;
        } catch (error) {
            console.error('Error checking slot time:', error);
            return true; // If there's an error, consider the slot as passed to be safe
        }
    };

    // Helper function to check if an appointment is ongoing
    const isAppointmentOngoing = (date, startTime, endTime) => {
        const yyyyMmDd = new Date(date).toISOString().split('T')[0];
        const start = new Date(`${yyyyMmDd}T${startTime}:00+07:00`);
        const end = new Date(`${yyyyMmDd}T${endTime}:00+07:00`);
        const now = new Date();

        return now >= start && now <= end;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                {/* Doctor Info Card */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👨‍⚕️</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Dr. {doctor.name}</h1>
                            <p className="text-gray-600">{doctor.specialization}</p>
                            {doctor.clinicName && (
                                <p className="text-gray-500 text-sm">{doctor.clinicName}</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Date Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                max={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                {getDateLabel(selectedDate)}
                            </p>
                        </div>

                        {/* Time Slots */}
                        {selectedDate && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Available Time Slots
                                </label>
                                {slotsLoading ? (
                                    <div className="flex justify-center py-4">
                                        <div className="admin-spinner"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {filteredSlots.length > 0 ? (
                                            filteredSlots.map((slot) => {
                                                const isPassed = isSlotPassed(slot);
                                                return (
                                                    <button
                                                        key={slot._id}
                                                        type="button"
                                                        onClick={() => !isPassed && handleSlotSelect(slot)}
                                                        disabled={isPassed}
                                                        className={`p-4 text-center rounded-md border transition-all duration-200 ${
                                                            isPassed
                                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                : selectedSlot?._id === slot._id
                                                                    ? 'bg-blue-500 text-white border-blue-500 transform scale-105'
                                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        <div className="font-medium">
                                                            {formatTime(slot.startTime)}
                                                        </div>
                                                        <div className="text-sm">
                                                            to {formatTime(slot.endTime)}
                                                        </div>
                                                        {isPassed && (
                                                            <div className="text-xs mt-1 text-red-500">
                                                                Time has passed
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full text-center py-8">
                                                <p className="text-gray-500 mb-2">No slots available for this date</p>
                                                <p className="text-sm text-gray-400">Please try another date</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows="4"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add any additional notes or concerns..."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={!selectedSlot}
                                className={`px-6 py-2 rounded-md text-white transition-colors duration-200 ${
                                    selectedSlot
                                        ? 'bg-blue-500 hover:bg-blue-600'
                                        : 'bg-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Book Appointment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookAppointment; 