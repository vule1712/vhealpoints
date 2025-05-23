import React from 'react';
import { Navigate } from 'react-router-dom';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import DoctorProfile from '../pages/doctor/DoctorProfile';
import DoctorAppointments from '../pages/doctor/DoctorAppointments';
import DoctorAppointmentHistory from '../pages/doctor/DoctorAppointmentHistory';
import DoctorAvailability from '../pages/doctor/DoctorAvailability';
import DoctorSettings from '../pages/doctor/DoctorSettings';

const DoctorRoutes = [
    {
        path: '/doctor',
        element: <Navigate to="/doctor/dashboard" replace />
    },
    {
        path: '/doctor/dashboard',
        element: <DoctorDashboard />
    },
    {
        path: '/doctor/profile',
        element: <DoctorProfile />
    },
    {
        path: '/doctor/appointments',
        element: <DoctorAppointments />
    },
    {
        path: '/doctor/appointment-history',
        element: <DoctorAppointmentHistory />
    },
    {
        path: '/doctor/availability',
        element: <DoctorAvailability />
    },
    {
        path: '/doctor/settings',
        element: <DoctorSettings />
    }
];

export default DoctorRoutes; 