import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import '../styles/components.css';

const Profile = () => {
    const navigate = useNavigate();
    const { userData } = useContext(AppContext);

    if (!userData) {
        navigate('/login');
        return null;
    }

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    ← Back
                </button>
                <h1 className="admin-page-title">My Profile</h1>
            </div>

            <div className="user-profile-details">
                <div className="profile-field">
                    <label>Name</label>
                    <span>{userData.name}</span>
                </div>

                <div className="profile-field">
                    <label>Email</label>
                    <span>{userData.email}</span>
                </div>

                <div className="profile-field">
                    <label>Role</label>
                    <span>{userData.role}</span>
                </div>

                <div className="profile-field">
                    <label>Account Status</label>
                    <span className={`admin-status-badge ${userData.isAccountVerified ? 'verified' : 'not-verified'}`}>
                        {userData.isAccountVerified ? 'Verified' : 'Not Verified'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Profile; 