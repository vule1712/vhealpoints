import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import NavBar from '../NavBar';

const PatientLayout = () => {
    const navigate = useNavigate();

    const menuItems = [
        { title: 'Dashboard', path: '/patient/dashboard', icon: '📊' },
        { title: 'Find Doctors', path: '/patient/doctors', icon: '👨‍⚕️' },
        { title: 'My Appointments', path: '/patient/appointments', icon: '📅' },
        { title: 'Appointment History', path: '/patient/appointment-history', icon: '🕔' },
        { title: 'Prescriptions', path: '/patient/prescriptions', icon: '💊' }
    ];

    return (
        <div className="bg-gray-100 flex h-[100vh] pt-[82px] relative">
            <NavBar />
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg">
                <nav className="mt-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center space-x-2"
                        >
                            <span>{item.icon}</span>
                            <span>{item.title}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default PatientLayout; 