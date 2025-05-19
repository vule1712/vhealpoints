import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-blue-500">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mt-4">Page Not Found</h2>
                <p className="text-gray-500 mt-2">The page you're looking for doesn't exist or has been moved.</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Go Back Home
                </button>
            </div>
        </div>
    );
};

export default NotFound; 