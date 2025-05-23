import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUser, FaCalendarAlt, FaHistory, FaClock, FaCog } from 'react-icons/fa';

const DoctorSidebar = () => {
    const menuItems = [
        { path: '/doctor/dashboard', icon: <FaHome />, text: 'Dashboard' },
        { path: '/doctor/profile', icon: <FaUser />, text: 'Profile' },
        { path: '/doctor/appointments', icon: <FaCalendarAlt />, text: 'Appointments' },
        { path: '/doctor/appointment-history', icon: <FaHistory />, text: 'Appointment History' },
        { path: '/doctor/availability', icon: <FaClock />, text: 'Availability' },
        { path: '/doctor/settings', icon: <FaCog />, text: 'Settings' }
    ];

    return (
        <div className="bg-white h-screen w-64 fixed left-0 top-0 shadow-md">
            <div className="p-4">
                <h2 className="text-2xl font-bold text-gray-800">Doctor Portal</h2>
            </div>
            <nav className="mt-4">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${
                                isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                            }`
                        }
                    >
                        <span className="mr-3">{item.icon}</span>
                        {item.text}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default DoctorSidebar; 