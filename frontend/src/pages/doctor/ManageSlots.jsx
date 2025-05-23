import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, addDays } from 'date-fns';

const ManageSlots = () => {
    const { backendUrl } = useContext(AppContext);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSlot, setNewSlot] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00'
    });

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/appointments/doctor-slots`, {
                withCredentials: true
            });

            if (response.data.success) {
                setSlots(response.data.slots);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch slots');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewSlot(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                `${backendUrl}/api/appointments/add-slot`,
                newSlot,
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
            toast.error(error.response?.data?.message || 'Failed to add slot');
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
                                <input
                                    type="date"
                                    name="date"
                                    value={newSlot.date}
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
                                <div
                                    key={slot._id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-md"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {format(new Date(slot.date), 'MMMM d, yyyy')}
                                        </p>
                                        <p className="text-gray-600">
                                            {format(new Date(slot.startTime), 'hh:mm a')} - {format(new Date(slot.endTime), 'hh:mm a')}
                                        </p>
                                        <p className={`text-sm ${
                                            slot.isBooked ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                            {slot.isBooked ? 'Booked' : 'Available'}
                                        </p>
                                    </div>
                                    {!slot.isBooked && (
                                        <button
                                            onClick={() => handleDeleteSlot(slot._id)}
                                            className="px-3 py-1 text-red-600 hover:text-red-800 focus:outline-none"
                                        >
                                            Delete
                                        </button>
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
