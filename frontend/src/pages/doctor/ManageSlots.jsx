import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const ManageSlots = () => {
    const { backendUrl } = useContext(AppContext);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00'
    });
    const [editingSlot, setEditingSlot] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState(null);

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/api/appointments/doctor-slots`, {
                withCredentials: true
            });

            if (response.data.success) {
                setSlots(response.data.slots);
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch slots');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateSlot = (isEdit = false) => {
        const slotDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (slotDate < today) {
            toast.error('Cannot add slots for past dates');
            return false;
        }

        if (slotDate.getTime() === today.getTime()) {
            const currentTime = new Date();
            const [startHours, startMinutes] = formData.startTime.split(':');
            const slotStartTime = new Date();
            slotStartTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

            if (slotStartTime < currentTime) {
                toast.error('Cannot add slots for past times today');
                return false;
            }
        }

        const [startHours, startMinutes] = formData.startTime.split(':');
        const [endHours, endMinutes] = formData.endTime.split(':');
        const startHour = parseInt(startHours, 10);
        const endHour = parseInt(endHours, 10);
        if (isNaN(startHour) || isNaN(endHour)) {
            toast.error('Invalid time format');
            return false;
        }
        if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
            toast.error('Time must be between 00:00 and 23:59');
            return false;
        }
        const startTime = new Date(`2000-01-01T${formData.startTime}`);
        const endTime = new Date(`2000-01-01T${formData.endTime}`);
        if (endTime <= startTime) {
            toast.error('End time must be after start time');
            return false;
        }

        // Prevent overlapping slots
        const isOverlapping = slots.some(slot => {
            // If editing, skip the slot being edited
            if (isEdit && editingSlot && slot._id === editingSlot._id) return false;
            // Compare date
            let slotDateStr = '';
            if (slot.date.includes('/')) {
                const [day, month, year] = slot.date.split('/');
                slotDateStr = `${year}-${month}-${day}`;
            } else if (slot.date.includes('-')) {
                const [year, month, day] = slot.date.split('-');
                slotDateStr = `${year}-${month}-${day}`;
            } else {
                slotDateStr = format(new Date(slot.date), 'yyyy-MM-dd');
            }
            if (slotDateStr !== formData.date) return false;

            // Convert times to minutes for comparison
            const toMinutes = (t) => {
                if (t.includes('AM') || t.includes('PM')) {
                    const [time, modifier] = t.split(' ');
                    let [h, m] = time.split(':');
                    h = parseInt(h, 10);
                    if (h === 12) h = 0;
                    if (modifier === 'PM') h += 12;
                    return h * 60 + parseInt(m, 10);
                } else {
                    const [h, m] = t.split(':');
                    return parseInt(h, 10) * 60 + parseInt(m, 10);
                }
            };
            const slotStart = toMinutes(slot.startTime);
            const slotEnd = toMinutes(slot.endTime);
            const newStart = toMinutes(formData.startTime);
            const newEnd = toMinutes(formData.endTime);
            // Check for overlap
            return (newStart < slotEnd && newEnd > slotStart);
        });
        if (isOverlapping) {
            toast.error('There is already a slot at this time. Please choose a different time.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEdit = Boolean(editingSlot);
        if (!validateSlot(isEdit)) return;

        setIsSubmitting(true);
        try {
            const [startHours, startMinutes] = formData.startTime.split(':');
            const [endHours, endMinutes] = formData.endTime.split(':');
            const startHour = parseInt(startHours, 10);
            const endHour = parseInt(endHours, 10);

            const formattedStartTime = `${startHour % 12 || 12}:${startMinutes} ${startHour >= 12 ? 'PM' : 'AM'}`;
            const formattedEndTime = `${endHour % 12 || 12}:${endMinutes} ${endHour >= 12 ? 'PM' : 'AM'}`;
            const isoDate = new Date(formData.date).toISOString();

            if (editingSlot) {
                const response = await axios.put(
                    `${backendUrl}/api/appointments/slot/${editingSlot._id}`,
                    {
                        ...formData,
                        date: isoDate,
                        startTime: formattedStartTime,
                        endTime: formattedEndTime
                    },
                    { withCredentials: true }
                );

                if (response.data.success) {
                    toast.success('Slot updated successfully');
                    fetchSlots();
                    setEditingSlot(null);
                }
            } else {
                const response = await axios.post(
                    `${backendUrl}/api/appointments/add-slot`,
                    {
                        ...formData,
                        date: isoDate,
                        startTime: formattedStartTime,
                        endTime: formattedEndTime
                    },
                    { withCredentials: true }
                );

                if (response.data.success) {
                    toast.success('Slot added successfully');
                    fetchSlots();
                }
            }

            setFormData({
                date: format(new Date(), 'yyyy-MM-dd'),
                startTime: '09:00',
                endTime: '10:00'
            });
        } catch (error) {
            console.error('Error saving slot:', error);
            toast.error(error.response?.data?.message || 'Failed to save slot');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (slot) => {
        setEditingSlot(slot);
        
        // Convert date to yyyy-MM-dd format
        let formattedDate;
        if (slot.date.includes('/')) {
            const [day, month, year] = slot.date.split('/');
            formattedDate = `${year}-${month}-${day}`;
        } else if (slot.date.includes('-')) {
            const [day, month, year] = slot.date.split('-');
            formattedDate = `${year}-${month}-${day}`;
        } else {
            formattedDate = format(new Date(slot.date), 'yyyy-MM-dd');
        }

        // Convert time from 12-hour to 24-hour format
        const convertTo24Hour = (time12h) => {
            const [time, modifier] = time12h.split(' ');
            let [hours, minutes] = time.split(':');
            hours = parseInt(hours);
            if (hours === 12) {
                hours = modifier === 'PM' ? 12 : 0;
            } else {
                hours = modifier === 'PM' ? hours + 12 : hours;
            }
            return `${hours.toString().padStart(2, '0')}:${minutes}`;
        };

        setFormData({
            date: formattedDate,
            startTime: convertTo24Hour(slot.startTime),
            endTime: convertTo24Hour(slot.endTime)
        });
    };

    const handleDeleteClick = (slot) => {
        setSlotToDelete(slot);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!slotToDelete) return;
        try {
            const response = await axios.delete(
                `${backendUrl}/api/appointments/slot/${slotToDelete._id}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Slot deleted successfully');
                fetchSlots();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete slot');
        } finally {
            setShowDeleteModal(false);
            setSlotToDelete(null);
        }
    };

    const formatTime = (time) => {
        try {
            if (/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(time)) {
                return time;
            }
            if (typeof time === 'string') {
                if (time.includes('T')) {
                    return format(new Date(time), 'hh:mm a');
                } else if (time.includes(':')) {
                    const [hours, minutes] = time.split(':');
                    const hour = parseInt(hours, 10);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const hour12 = hour % 12 || 12;
                    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
                }
            }
            if (time instanceof Date || typeof time === 'number') {
                const date = new Date(time);
                if (!isNaN(date.getTime())) {
                    return format(date, 'hh:mm a');
                }
            }
            return 'Invalid time';
        } catch (error) {
            console.error('Error formatting time:', error, 'Time value:', time);
            return 'Invalid time';
        }
    };

    const formatDate = (dateString) => {
        try {
            let formattedDate;
            if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
                const [day, month, year] = dateString.split('-');
                formattedDate = new Date(year, month - 1, day);
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                const [year, month, day] = dateString.split('-');
                formattedDate = new Date(year, month - 1, day);
            } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
                const [day, month, year] = dateString.split('/');
                formattedDate = new Date(year, month - 1, day);
            } else {
                formattedDate = new Date(dateString);
            }

            if (!isNaN(formattedDate.getTime())) {
                const dayOfWeek = format(formattedDate, 'EEEE');
                const date = format(formattedDate, 'dd/MM/yyyy');
                return `${dayOfWeek} (${date})`;
            }
            
            return 'Invalid date';
        } catch (error) {
            console.error('Error formatting date:', error, 'Date value:', dateString);
            return 'Invalid date';
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

    // Updated canModifySlot logic (admin style)
    const canModifySlot = (slot) => {
        try {
            if (slot.isBooked) return false;

            // Parse the date string (support dd/MM/yyyy and yyyy-MM-dd)
            let date;
            if (slot.date.includes('/')) {
                const [day, month, year] = slot.date.split('/');
                date = `${year}-${month}-${day}`;
            } else if (slot.date.includes('-')) {
                const [year, month, day] = slot.date.split('-');
                date = `${year}-${month}-${day}`;
            } else {
                date = format(new Date(slot.date), 'yyyy-MM-dd');
            }

            // Convert time from 12-hour format to 24-hour format if needed
            const convertTo24Hour = (time12h) => {
                if (!time12h) return '00:00';
                if (time12h.includes(':') && (time12h.includes('AM') || time12h.includes('PM'))) {
                    const [time, modifier] = time12h.split(' ');
                    let [hours, minutes] = time.split(':');
                    hours = parseInt(hours, 10);
                    if (hours === 12) hours = 0;
                    if (modifier === 'PM') hours += 12;
                    return `${hours.toString().padStart(2, '0')}:${minutes}`;
                }
                return time12h;
            };

            const startTime = convertTo24Hour(slot.startTime);
            const endTime = convertTo24Hour(slot.endTime);

            // Check if the appointment is ongoing
            const isOngoing = isAppointmentOngoing(date, startTime, endTime);

            // Allow modification if the slot is ongoing or hasn't started yet
            const yyyyMmDd = new Date(date).toISOString().split('T')[0];
            const start = new Date(`${yyyyMmDd}T${startTime}:00+07:00`);
            const now = new Date();

            return isOngoing || now < start;
        } catch (error) {
            console.error('Error checking slot modification:', error);
            return false;
        }
    };

    if (loading) {
        return (
            <div className="admin-loading-spinner">
                <div className="admin-spinner"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Available Slots</h1>

                {/* Add New Slot Form */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Add New Slot</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    max={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Add Slot'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Existing Slots */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold mb-4">Your Available Slots</h2>
                    {slots.length === 0 ? (
                        <p className="text-gray-500 text-center">No slots available</p>
                    ) : (
                        <div className="space-y-4">
                            {slots.map((slot) => (
                                <div key={slot._id}>
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                                        <div>
                                            <p className="font-medium">
                                                {formatDate(slot.date)}
                                            </p>
                                            <p className="text-gray-600">
                                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                            </p>
                                            <p className={`text-sm ${
                                                slot.isBooked ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                                {slot.isBooked ? 'Booked' : 'Available'}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            {canModifySlot(slot) && (
                                                <>
                                                    <button
                                                        onClick={() => handleEditClick(slot)}
                                                        className="px-3 py-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                                                    >
                                                        Edit
                                                    </button>
                                                    {!slot.isBooked && (
                                                        <button
                                                            onClick={() => handleDeleteClick(slot)}
                                                            className="px-3 py-1 text-red-600 hover:text-red-800 focus:outline-none"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Edit Form - Inline under the slot */}
                                    {editingSlot && editingSlot._id === slot._id && (
                                        <div className="mt-2 p-4 border border-blue-200 rounded-md bg-blue-50">
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="date"
                                                            value={formData.date}
                                                            onChange={handleInputChange}
                                                            min={format(new Date(), 'yyyy-MM-dd')}
                                                            max={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Start Time
                                                        </label>
                                                        <input
                                                            type="time"
                                                            name="startTime"
                                                            value={formData.startTime}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            End Time
                                                        </label>
                                                        <input
                                                            type="time"
                                                            name="endTime"
                                                            value={formData.endTime}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end space-x-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingSlot(null);
                                                            setFormData({
                                                                date: format(new Date(), 'yyyy-MM-dd'),
                                                                startTime: '09:00',
                                                                endTime: '10:00'
                                                            });
                                                        }}
                                                        className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? 'Saving...' : 'Update Slot'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmationModal
                showModal={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Time Slot"
                message="Are you sure you want to delete this time slot? This action cannot be undone."
            />
        </div>
    );
};

export default ManageSlots;
