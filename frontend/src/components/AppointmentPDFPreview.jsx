import React from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import AppointmentPDF from './AppointmentPDF';

const AppointmentPDFPreview = ({ appointment, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-white rounded-lg p-4 w-[60%] h-[100%] flex flex-col items-center justify-between relative">
                <div className="w-full h-full">
                    <PDFViewer width="100%" height="100%">
                        <AppointmentPDF appointment={appointment} />
                    </PDFViewer>
                </div>
                <div className="flex justify-center space-x-4 mt-6">
                    <PDFDownloadLink
                        document={<AppointmentPDF appointment={appointment} />}
                        fileName={`appointment_${appointment.doctorId?.name?.replace(/\s+/g, '_')}_${appointment.patientId?.name?.replace(/\s+/g, '_')}_${appointment.slotId?.date?.replace(/\//g, '-')}.pdf`}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
                    >
                        {({ blob, url, loading, error }) =>
                            loading ? 'Generating PDF...' : 'Download PDF'
                        }
                    </PDFDownloadLink>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentPDFPreview; 