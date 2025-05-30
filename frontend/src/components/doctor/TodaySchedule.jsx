import React from 'react';
import { format } from 'date-fns';

const TodaySchedule = ({ todaySchedule, onAppointmentClick, formatTime }) => {
    const formatTimeDisplay = (timeString) => {
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

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
            <div className="space-y-4">
                {todaySchedule.length > 0 ? (
                    todaySchedule.map((appointment) => (
                        <div
                            key={appointment._id}
                            onClick={() => onAppointmentClick(appointment)}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            <div>
                                <p className="font-medium">{appointment.patientId?.name || 'Unknown Patient'}</p>
                                <p className="text-sm text-gray-500">
                                    {formatTimeDisplay(appointment.slotId?.startTime)} - 
                                    {formatTimeDisplay(appointment.slotId?.endTime)}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm ${
                                appointment.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {appointment.status}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center">No appointments scheduled for today</p>
                )}
            </div>
        </div>
    );
};

export default TodaySchedule; 