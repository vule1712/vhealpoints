import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { AppContext } from '../../context/AppContext';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

const DoctorSlotsModal = ({ doctor, showModal, onClose, onSlotsUpdate }) => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [newSlot, setNewSlot] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00'
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState(null);
    const { backendUrl } = useContext(AppContext);

    const fetchSlots = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${backendUrl}/api/appointments/doctor-slots/${doctor._id}`, {
                withCredentials: true
            });
            if (response.data.success) {
                setSlots(response.data.slots || []);
            } else {
                setError(response.data.message || 'Failed to fetch slots');
                toast.error(response.data.message || 'Failed to fetch slots');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error fetching slots');
            toast.error(error.response?.data?.message || 'Error fetching slots');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (showModal && doctor) {
            fetchSlots();
            // Reset new slot form with current date and default times
            setNewSlot({
                date: format(new Date(), 'yyyy-MM-dd'),
                startTime: '09:00',
                endTime: '10:00'
            });
        }
    }, [showModal, doctor]);

    // Scroll to bottom when slots are loaded
    useEffect(() => {
        if (slots.length > 0 && !loading) {
            const slotsContainer = document.getElementById('slots-list-container');
            if (slotsContainer) {
                slotsContainer.scrollTo({
                    top: slotsContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [slots, loading]);

    const formatDateTime = (dateString) => {
        try {
            let date;
            // Handle dd/MM/yyyy format
            if (dateString.includes('/')) {
                const [day, month, year] = dateString.split('/');
                date = new Date(year, month - 1, day);
            }
            // Handle yyyy-MM-dd format
            else if (dateString.includes('-')) {
                const [year, month, day] = dateString.split('-');
                date = new Date(year, month - 1, day);
            }
            // Try parsing as is
            else {
                date = new Date(dateString);
            }

            if (!isNaN(date.getTime())) {
                const dayOfWeek = format(date, 'EEEE');
                const formattedDate = format(date, ' dd/MM/yyyy');
                return `${dayOfWeek}, ${formattedDate}`;
            }
            
            console.error('Invalid date after parsing:', dateString);
            return 'Invalid date';
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
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
                const date = new Date();
                date.setHours(parseInt(hours), parseInt(minutes));
                return format(date, 'hh:mm a');
            }
            return timeString;
        } catch (error) {
            console.error('Error formatting time:', error);
            return timeString;
        }
    };

    const canModifySlot = (slot) => {
        try {
            if (slot.isBooked) return false;

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

    // Helper function to check if an appointment is ongoing
    const isAppointmentOngoing = (date, startTime, endTime) => {
        const yyyyMmDd = new Date(date).toISOString().split('T')[0];
        const start = new Date(`${yyyyMmDd}T${startTime}:00+07:00`);
        const end = new Date(`${yyyyMmDd}T${endTime}:00+07:00`);
        const now = new Date();

        return now >= start && now <= end;
    };

    const handleEditClick = (slot) => {
        try {
            if (!canModifySlot(slot)) {
                toast.error('This slot cannot be modified');
                return;
            }

            const [day, month, year] = slot.date.split('/');
            const formattedDate = `${year}-${month}-${day}`;
            
            // Convert 12-hour time format to 24-hour format for input fields
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

            const startTime24h = convertTo24Hour(slot.startTime);
            const endTime24h = convertTo24Hour(slot.endTime);
            
            setEditingSlot({
                ...slot,
                date: formattedDate,
                startTime: startTime24h,
                endTime: endTime24h
            });
            setIsEditing(true);
        } catch (error) {
            console.error('Error preparing slot for editing:', error);
            toast.error('Error preparing slot for editing');
        }
    };

    const handleEditSubmit = async () => {
        try {
            if (!editingSlot) return;

            const slotDate = new Date(editingSlot.date);
            const currentTime = new Date();

            if (slotDate < currentTime) {
                toast.error('Cannot update slots for past dates');
                return;
            }

            // Format times to 12-hour format
            const startTime = formatTime(editingSlot.startTime);
            const endTime = formatTime(editingSlot.endTime);

            const response = await axios.put(
                `${backendUrl}/api/appointments/admin/slot/${editingSlot._id}`,
                {
                    date: editingSlot.date,
                    startTime,
                    endTime
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Slot updated successfully');
                setIsEditing(false);
                setEditingSlot(null);
                fetchSlots();
                if (onSlotsUpdate) onSlotsUpdate();
            }
        } catch (error) {
            console.error('Error updating slot:', error);
            toast.error(error.response?.data?.message || 'Failed to update slot');
        }
    };

    const handleDeleteSlot = async (slotId) => {
        try {
            const slot = slots.find(s => s._id === slotId);
            if (!slot) {
                toast.error('Slot not found');
                return;
            }

            if (!canModifySlot(slot)) {
                toast.error('This slot cannot be deleted');
                return;
            }

            setSlotToDelete(slot);
            setShowDeleteModal(true);
        } catch (error) {
            console.error('Error preparing to delete slot:', error);
            toast.error('Failed to prepare slot deletion');
        }
    };

    const confirmDeleteSlot = async () => {
        try {
            const response = await axios.delete(
                `${backendUrl}/api/appointments/admin/slot/${slotToDelete._id}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Slot deleted successfully');
                fetchSlots();
                if (onSlotsUpdate) onSlotsUpdate();
                setShowDeleteModal(false);
                setSlotToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting slot:', error);
            toast.error(error.response?.data?.message || 'Failed to delete slot');
        }
    };

    const handleAddSlot = async () => {
        try {
            if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
                toast.error('Please fill in all fields');
                return;
            }

            const slotDate = new Date(newSlot.date);
            const now = new Date();
            // Check if the date is in the past
            if (slotDate < now.setHours(0, 0, 0, 0)) {
                toast.error('Cannot add slots for past dates');
                return;
            }
            // For today's slots, check if the end time has passed
            if (slotDate.getDate() === now.getDate() &&
                slotDate.getMonth() === now.getMonth() &&
                slotDate.getFullYear() === now.getFullYear()) {
                const [endHours, endMinutes] = newSlot.endTime.split(':');
                slotDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
                if (slotDate <= now) {
                    toast.error('Cannot add slots that have already ended');
                    return;
                }
            }
            const startTime = formatTime(newSlot.startTime);
            const endTime = formatTime(newSlot.endTime);
            const response = await axios.post(
                `${backendUrl}/api/appointments/add-slot/${doctor._id}`,
                {
                    date: newSlot.date,
                    startTime,
                    endTime
                },
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success('Slot added successfully');
                setNewSlot({
                    date: format(new Date(), 'yyyy-MM-dd'),
                    startTime: '09:00',
                    endTime: '10:00'
                });
                await fetchSlots();
                if (onSlotsUpdate) onSlotsUpdate();
                
                // Scroll to the bottom of the slots list after adding a new slot
                setTimeout(() => {
                    const slotsContainer = document.getElementById('slots-list-container');
                    if (slotsContainer) {
                        slotsContainer.scrollTo({
                            top: slotsContainer.scrollHeight,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            } else {
                toast.error(response.data.message || 'Failed to add slot');
            }
        } catch (error) {
            console.error('Error adding slot:', error);
            toast.error(error.response?.data?.message || 'Failed to add slot');
        }
    };

    const handleFeedbackDeleted = (ratingId) => {
        // Update the doctor's ratings in the parent component
        if (onSlotsUpdate) {
            onSlotsUpdate();
        }
    };

    if (!showModal || !doctor) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Doctor Details</h2>
                            <p className="text-gray-600 mt-1">Dr. {doctor.name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add New Slot Form */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <h3 className="text-lg font-semibold mb-4">Add New Slot</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={newSlot.date}
                                onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                value={newSlot.startTime}
                                onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="time"
                                value={newSlot.endTime}
                                onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleAddSlot}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Add Slot
                    </button>
                </div>

                {/* Slots List - Scrollable Container */}
                <div id="slots-list-container" className="flex-1 overflow-y-auto p-4 min-h-0">
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="border-b border-gray-200 pb-4">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-center py-4">{error}</div>
                ) : (
                    <div className="space-y-4">
                        {slots.length > 0 ? (
                            slots.map((slot) => (
                                <div
                                    key={slot._id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    {isEditing && editingSlot?._id === slot._id ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                    <input
                                                        type="date"
                                                        value={editingSlot.date}
                                                        onChange={(e) => setEditingSlot(prev => ({ ...prev, date: e.target.value }))}
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                                    <input
                                                        type="time"
                                                        value={editingSlot.startTime}
                                                        onChange={(e) => setEditingSlot(prev => ({ ...prev, startTime: e.target.value }))}
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                                    <input
                                                        type="time"
                                                        value={editingSlot.endTime}
                                                        onChange={(e) => setEditingSlot(prev => ({ ...prev, endTime: e.target.value }))}
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setEditingSlot(null);
                                                    }}
                                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleEditSubmit}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {formatDateTime(slot.date)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                </p>
                                                {slot.isBooked && (
                                                    <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded">
                                                        Booked
                                                    </span>
                                                )}
                                            </div>
                                            {canModifySlot(slot) && (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditClick(slot)}
                                                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot._id)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No slots found</p>
                        )}
                    </div>
                )}
                </div>
            </div>
            
            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                showModal={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSlotToDelete(null);
                }}
                onConfirm={confirmDeleteSlot}
                title="Delete Slot"
                message={`Are you sure you want to delete the slot on ${slotToDelete ? formatDateTime(slotToDelete.date) : ''} from ${slotToDelete ? formatTime(slotToDelete.startTime) : ''} to ${slotToDelete ? formatTime(slotToDelete.endTime) : ''}?`}
            />
        </div>
    );
};

export default DoctorSlotsModal; 