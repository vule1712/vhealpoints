import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import NavBar from '../NavBar';

const PatientLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { title: 'Dashboard', path: '/patient/dashboard', icon: '📊' },
        { title: 'Find Doctors', path: '/patient/doctors', icon: '👨‍⚕️' },
        { title: 'My Appointments', path: '/patient/appointments', icon: '📅' },
        { title: 'Appointment History', path: '/patient/appointment-history', icon: '🕔' }
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <NavBar />
            
            {/* Top Navigation Menu */}
            <div className="bg-white shadow-sm fixed top-[80px] left-0 right-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex justify-center space-x-8">
                        {menuItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    location.pathname === item.path
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span className="flex items-center">
                                    <span className="mr-2">{item.icon}</span>
                                    {item.title}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-[130px]">
                <Outlet />
            </main>
        </div>
    );
};

export default PatientLayout; 