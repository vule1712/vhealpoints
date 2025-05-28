import appointmentModel from '../models/appointmentModel.js';
import availableSlotModel from '../models/availableSlotModel.js';

// Function to update appointment status
const updateAppointmentStatus = async () => {
    try {
        const now = new Date();
        
        // Find all confirmed appointments that have passed their end time
        const appointments = await appointmentModel.find({
            status: 'Confirmed'
        }).populate('slotId');

        for (const appointment of appointments) {
            const appointmentDate = new Date(appointment.slotId.date);
            const endTime = new Date(appointment.slotId.endTime);
            
            // Combine date and time
            const appointmentEndTime = new Date(
                appointmentDate.getFullYear(),
                appointmentDate.getMonth(),
                appointmentDate.getDate(),
                endTime.getHours(),
                endTime.getMinutes()
            );

            // If appointment end time has passed, update status to Completed
            if (now > appointmentEndTime) {
                await appointmentModel.findByIdAndUpdate(
                    appointment._id,
                    { status: 'Completed' }
                );
            }
        }
    } catch (error) {
        console.error('Error updating appointment status:', error);
    }
};

// Run the update every minute
setInterval(updateAppointmentStatus, 60000);

// Also run it immediately when the server starts
updateAppointmentStatus();

export default updateAppointmentStatus; 