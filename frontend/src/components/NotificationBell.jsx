import React, { useState, useContext, useEffect } from 'react';
import { assets } from '../assets/assets';
import '../styles/components.css';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const { backendUrl, socket, userData } = useContext(AppContext);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        if (!userData) return;
        try {
        const { data } = await axios.get(`${backendUrl}/api/notifications`);
        if (data.success) {
            setNotifications(data.notifications);
        }
        } catch (error) {
        console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        if (socket && userData) {
        console.log('NotificationBell: Setting up socket listener for user:', userData._id);
        fetchNotifications();

        // Test if socket is working
        socket.on('connect', () => {
            console.log('NotificationBell: Socket connected');
        });

        socket.on('notification', (newNotification) => {
            console.log('NotificationBell: Received notification via socket:', newNotification);
            setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
        });

        // Listen for notification-read event to refetch notifications
        socket.on('notification-read', () => {
            console.log('NotificationBell: Received notification-read event, refetching notifications');
            fetchNotifications();
        });

        return () => {
            console.log('NotificationBell: Cleaning up socket listener');
            socket.off('connect');
            socket.off('notification');
            socket.off('notification-read');
        };
        }
    }, [socket, userData]);

    const handleBellClick = async () => {
        setIsOpen(!isOpen);
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.post(`${backendUrl}/api/notifications/mark-read`);
            const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
            setNotifications(updatedNotifications);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Helper to mark a single notification as read
    const markNotificationAsRead = async (notificationId) => {
        try {
            await axios.post(`${backendUrl}/api/notifications/mark-read`, { notificationId });
            setNotifications((prev) => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Helper to determine navigation based on notification message
    const handleNotificationClick = async (notification) => {
        await markNotificationAsRead(notification._id);
        // Deep-linking logic
        if (notification.type === 'appointment' && notification.targetId) {
            if (userData.role === 'Patient') {
                navigate(`/patient/appointments?appointmentId=${notification.targetId}`);
            } else if (userData.role === 'Doctor') {
                navigate(`/doctor/appointments?appointmentId=${notification.targetId}`);
            } else if (userData.role === 'Admin') {
                navigate(`/admin/appointments?appointmentId=${notification.targetId}`);
            }
        } else if (notification.type === 'rating' && notification.targetId) {
            if (userData.role === 'Patient') {
                // Ideally, navigate to the doctor profile or feedback detail
                navigate(`/patient/doctors`); // Could be `/patient/doctors/:doctorId` if available
            } else if (userData.role === 'Doctor') {
                navigate(`/profile`); // Or a feedback detail page if available
            } else if (userData.role === 'Admin') {
                navigate(`/admin/dashboard`); // Or a feedback management page if available
            }
        } else {
            // Fallback to previous logic
            const msg = notification.message.toLowerCase();
            if (userData.role === 'Patient') {
                if (msg.includes('appointment')) {
                    navigate('/patient/appointments');
                } else if (msg.includes('rating') || msg.includes('feedback')) {
                    navigate('/patient/doctors');
                }
            } else if (userData.role === 'Doctor') {
                if (msg.includes('appointment')) {
                    navigate('/doctor/appointments');
                } else if (msg.includes('rating') || msg.includes('feedback')) {
                    navigate('/profile');
                }
            } else if (userData.role === 'Admin') {
                if (msg.includes('appointment')) {
                    navigate('/admin/appointments');
                } else if (msg.includes('rating') || msg.includes('feedback')) {
                    navigate('/admin/dashboard');
                }
            }
        }
    };
    
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="notification-bell">
        <div onClick={handleBellClick} className="bell-icon-container">
            <img src={assets.bell_icon} alt="Notifications" className="bell-icon" />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
        </div>
        {isOpen && (
            <div className="notification-dropdown">
            <div className="notification-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
                        Mark all as read
                    </button>
                )}
            </div>
            <div className="notification-list">
                {notifications.length > 0 ? (
                notifications.map((notification) => (
                    <div
                        key={notification._id}
                        className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                        onClick={() => handleNotificationClick(notification)}
                        style={{ cursor: 'pointer' }}
                    >
                    <img src={assets.notification_icon} alt="icon" className="notification-icon" />
                    <div className="notification-content">
                        <p>{notification.message}</p>
                        <span className="notification-time">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                    </div>
                ))
                ) : (
                <p className="no-notifications">No new notifications</p>
                )}
            </div>
            </div>
        )}
        </div>
    );
};

export default NotificationBell; 