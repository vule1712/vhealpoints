import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const DoctorSlotsModal = ({ isOpen, onClose, onSlotAdded, onSlotUpdated, onSlotDeleted, selectedSlot }) => {
    const [formData, setFormData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        maxPatients: 1
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (selectedSlot) {
        setFormData({
            date: selectedSlot.date,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            maxPatients: selectedSlot.maxPatients
        });
        } else {
        setFormData({
            date: '',
            startTime: '',
            endTime: '',
            maxPatients: 1
        });
        }
    }, [selectedSlot]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
        const slotData = {
            ...formData,
            doctorId: user._id
        };

        if (selectedSlot) {
            // Update existing slot
            const response = await axios.put(
            `${import.meta.env.VITE_API_URL}/api/slots/${selectedSlot._id}`,
            slotData
            );
            toast.success('Slot updated successfully');
            onSlotUpdated(response.data);
        } else {
            // Create new slot
            const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/slots`,
            slotData
            );
            toast.success('Slot added successfully');
            onSlotAdded(response.data);
        }

        onClose();
        } catch (error) {
        console.error('Error saving slot:', error);
        toast.error(error.response?.data?.message || 'Failed to save slot');
        } finally {
        setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedSlot) return;

        try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/slots/${selectedSlot._id}`);
        toast.success('Slot deleted successfully');
        onSlotDeleted(selectedSlot._id);
        onClose();
        } catch (error) {
        console.error('Error deleting slot:', error);
        toast.error(error.response?.data?.message || 'Failed to delete slot');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
                {selectedSlot ? 'Edit Time Slot' : 'Add Time Slot'}
            </h2>
            <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
                </label>
                <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min={new Date().toISOString().split('T')[0]}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                </label>
                <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                </label>
                <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Patients
                </label>
                <input
                type="number"
                min="1"
                value={formData.maxPatients}
                onChange={(e) => setFormData({ ...formData, maxPatients: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
                {selectedSlot && (
                <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
                    disabled={isSubmitting}
                >
                    Delete
                </button>
                )}
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
                disabled={isSubmitting}
                >
                Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isSubmitting}
                >
                {isSubmitting ? 'Saving...' : selectedSlot ? 'Update' : 'Add'}
                </button>
            </div>
            </form>
        </div>
        </div>
    );
};

export default DoctorSlotsModal; 