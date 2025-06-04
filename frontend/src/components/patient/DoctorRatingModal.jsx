import React from 'react';
import DoctorRatingForm from './DoctorRatingForm';

const DoctorRatingModal = ({ show, onClose, doctorId }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ marginTop: '-82px' }}>
            <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
                <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
                <DoctorRatingForm doctorId={doctorId} onClose={onClose} />
            </div>
        </div>
    );
};

export default DoctorRatingModal; 