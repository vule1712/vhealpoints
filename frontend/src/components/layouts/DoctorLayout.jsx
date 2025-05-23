import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import NavBar from '../NavBar';

const DoctorLayout = () => {
    const navigate = useNavigate();

    const menuItems = [
        { title: 'Dashboard', path: '/doctor/dashboard', icon: '📊' },
        { title: 'Appointments', path: '/doctor/appointments', icon: '📅' },
        { title: 'Slots Management', path: '/doctor/slots', icon: '⏰' },
        { title: 'Patients', path: '/doctor/patients', icon: '👥' },
        { title: 'Appointment History', path: '/doctor/appointment-history', icon: '🕔' },
        { title: 'Prescriptions', path: '/doctor/prescriptions', icon: '💊' }
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

export default DoctorLayout; 