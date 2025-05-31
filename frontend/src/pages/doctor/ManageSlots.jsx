import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format, addDays, parse } from 'date-fns';

const ManageSlots = () => {
    const { backendUrl } = useContext(AppContext);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSlot, setNewSlot] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00'
    });
    const [editingSlot, setEditingSlot] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);

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
                console.log('Received slots:', response.data.slots);
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
        if (showEditForm) {
            setEditingSlot(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setNewSlot(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();

        try {
            // Validate date
            const slotDate = new Date(newSlot.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (slotDate < today) {
                toast.error('Cannot add slots for past dates');
                return;
            }

            // Check if slot is for today and time has passed
            if (slotDate.getTime() === today.getTime()) {
                const currentTime = new Date();
                const [startHours, startMinutes] = newSlot.startTime.split(':');
                const slotStartTime = new Date();
                slotStartTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

                if (slotStartTime < currentTime) {
                    toast.error('Cannot add slots for past times today');
                    return;
                }
            }

            // Validate time format
            const [startHours, startMinutes] = newSlot.startTime.split(':');
            const [endHours, endMinutes] = newSlot.endTime.split(':');
            
            const startHour = parseInt(startHours, 10);
            const endHour = parseInt(endHours, 10);
            
            if (isNaN(startHour) || isNaN(endHour)) {
                toast.error('Invalid time format');
                return;
            }

            // Validate time range
            if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
                toast.error('Time must be between 00:00 and 23:59');
                return;
            }

            // Validate end time is after start time
            const startTime = new Date(`2000-01-01T${newSlot.startTime}`);
            const endTime = new Date(`2000-01-01T${newSlot.endTime}`);
            if (endTime <= startTime) {
                toast.error('End time must be after start time');
                return;
            }

            // Convert times to 12-hour format
            const formattedStartTime = `${startHour % 12 || 12}:${startMinutes} ${startHour >= 12 ? 'PM' : 'AM'}`;
            const formattedEndTime = `${endHour % 12 || 12}:${endMinutes} ${endHour >= 12 ? 'PM' : 'AM'}`;

            // Convert date to ISO format for MongoDB
            const isoDate = new Date(newSlot.date).toISOString();

            const response = await axios.post(
                `${backendUrl}/api/appointments/add-slot`,
                {
                    ...newSlot,
                    date: isoDate,
                    startTime: formattedStartTime,
                    endTime: formattedEndTime
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Slot added successfully');
                fetchSlots();
                // Reset form
                setNewSlot({
                    date: format(new Date(), 'yyyy-MM-dd'),
                    startTime: '09:00',
                    endTime: '10:00'
                });
            }
        } catch (error) {
            console.error('Error adding slot:', error);
            const errorMessage = error.response?.data?.message;
            if (errorMessage) {
                if (errorMessage.includes('overlaps')) {
                    toast.error('This slot overlaps with an existing slot');
                } else if (errorMessage.includes('past dates')) {
                    toast.error('Cannot add slots for past dates');
                } else if (errorMessage.includes('time format')) {
                    toast.error('Invalid time format');
                } else {
                    toast.error(errorMessage);
                }
            } else {
                toast.error('Failed to add slot. Please try again.');
            }
        }
    };

    const formatTime = (time) => {
        try {
            // If time is already in 12-hour format, return it
            if (/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(time)) {
                return time;
            }
            // If time is a string in HH:mm format
            if (typeof time === 'string') {
                if (time.includes('T')) {
                    // Handle ISO string format
                    return format(new Date(time), 'hh:mm a');
                } else if (time.includes(':')) {
                    // Handle HH:mm format
                    const [hours, minutes] = time.split(':');
                    const hour = parseInt(hours, 10);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const hour12 = hour % 12 || 12;
                    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
                }
            }
            // If time is a Date object or timestamp
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
            // If date is already in dd-MM-yyyy format
            if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
                const [day, month, year] = dateString.split('-');
                formattedDate = new Date(year, month - 1, day);
            }
            // If date is in yyyy-MM-dd format
            else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                const [year, month, day] = dateString.split('-');
                formattedDate = new Date(year, month - 1, day);
            }
            // If date is in DD/MM/YYYY format
            else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
                const [day, month, year] = dateString.split('/');
                formattedDate = new Date(year, month - 1, day);
            }
            // Try parsing the date string
            else {
                formattedDate = new Date(dateString);
            }

            if (!isNaN(formattedDate.getTime())) {
                const dayOfWeek = format(formattedDate, 'EEEE'); // Full day name
                const date = format(formattedDate, 'dd/MM/yyyy');
                return `${dayOfWeek} (${date})`;
            }
            
            console.error('Invalid date format:', dateString);
            return 'Invalid date';
        } catch (error) {
            console.error('Error formatting date:', error, 'Date value:', dateString);
            return 'Invalid date';
        }
    };

    const handleEditClick = (slot) => {
        try {
            // Parse the time values correctly
            let startTime, endTime;

            if (typeof slot.startTime === 'string') {
                if (slot.startTime.includes('T')) {
                    startTime = format(new Date(slot.startTime), 'hh:mm a');
                } else {
                    startTime = slot.startTime;
                }
            } else {
                startTime = format(new Date(slot.startTime), 'hh:mm a');
            }

            if (typeof slot.endTime === 'string') {
                if (slot.endTime.includes('T')) {
                    endTime = format(new Date(slot.endTime), 'hh:mm a');
                } else {
                    endTime = slot.endTime;
                }
            } else {
                endTime = format(new Date(slot.endTime), 'hh:mm a');
            }

            // Convert date to yyyy-MM-dd for the input field
            const [day, month, year] = slot.date.split('-');
            const inputDate = `${year}-${month}-${day}`;

            setEditingSlot({
                _id: slot._id,
                date: inputDate,
                startTime,
                endTime
            });
            setShowEditForm(true);
        } catch (error) {
            console.error('Error setting edit slot:', error);
            toast.error('Error preparing slot for editing');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        try {
            // Convert date back to dd-MM-yyyy format
            const [year, month, day] = editingSlot.date.split('-');
            const formattedDate = `${day}-${month}-${year}`;

            // Format the date and time values
            const formattedData = {
                date: formattedDate,
                startTime: editingSlot.startTime,
                endTime: editingSlot.endTime
            };

            setLoading(true);
            const response = await axios.put(
                `${backendUrl}/api/appointments/slot/${editingSlot._id}`,
                formattedData,
                { withCredentials: true }
            );

            if (response.data.success) {
                const message = response.data.slot.isBooked 
                    ? 'Slot updated successfully. The patient will be notified of the time change.'
                    : 'Slot updated successfully';
                toast.success(message);
                
                // Update the slots list with the new data
                setSlots(prevSlots => 
                    prevSlots.map(slot => 
                        slot._id === editingSlot._id ? response.data.slot : slot
                    )
                );

                // Close the edit form
                setShowEditForm(false);
                setEditingSlot(null);
            }
        } catch (error) {
            console.error('Error updating slot:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update slot';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSlot = async (slotId) => {
        try {
            const response = await axios.delete(
                `${backendUrl}/api/appointments/slot/${slotId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Slot deleted successfully');
                fetchSlots();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete slot');
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
                    <form onSubmit={handleAddSlot} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="date"
                                        value={newSlot.date}
                                        onChange={handleInputChange}
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                        max={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                                        className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-datetime-edit]:hidden [&::-webkit-datetime-edit-fields-wrapper]:hidden [&::-webkit-datetime-edit-text]:hidden [&::-webkit-datetime-edit-month-field]:hidden [&::-webkit-datetime-edit-day-field]:hidden [&::-webkit-datetime-edit-year-field]:hidden bg-white"
                                        required
                                    />
                                    <div className="absolute inset-0 pointer-events-none flex items-center px-3 pr-10">
                                        <span className="text-gray-700 text-lg flex items-center h-full mb-1.5">
                                            {format(new Date(newSlot.date), 'dd/MM/yyyy')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={newSlot.startTime}
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
                                    value={newSlot.endTime}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Add Slot
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
                                            <button
                                                onClick={() => handleEditClick(slot)}
                                                className="px-3 py-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                                            >
                                                Edit
                                            </button>
                                            {!slot.isBooked && (
                                                <button
                                                    onClick={() => handleDeleteSlot(slot._id)}
                                                    className="px-3 py-1 text-red-600 hover:text-red-800 focus:outline-none"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Edit Form - Inline under the slot */}
                                    {showEditForm && editingSlot && editingSlot._id === slot._id && (
                                        <div className="mt-2 p-4 border border-blue-200 rounded-md bg-blue-50">
                                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="date"
                                                            value={editingSlot.date}
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
                                                            value={editingSlot.startTime}
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
                                                            value={editingSlot.endTime}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end space-x-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowEditForm(false);
                                                            setEditingSlot(null);
                                                        }}
                                                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        Update Slot
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
        </div>
    );
};

export default ManageSlots;
