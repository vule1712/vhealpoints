import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import '../../styles/components.css';

const UserProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { backendUrl } = useContext(AppContext);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editedUser, setEditedUser] = useState(null);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/admin/users/${userId}`, {
                    withCredentials: true
                });
                if (response.data.success) {
                    setUser(response.data.user);
                    setEditedUser(response.data.user);
                } else {
                    setError(response.data.message);
                    toast.error(response.data.message);
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Failed to fetch user details';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, [userId, backendUrl]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (!editedUser) return;

        setIsSaving(true);
        try {
            // Save role changes
            const { data } = await axios.put(`${backendUrl}/api/admin/users/${userId}/role`, {
                role: editedUser.role
            }, { withCredentials: true });
            
            if (data.success) {
                toast.success('User details updated successfully');
                navigate('/admin/users'); // Redirect to user list
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user details');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const { data } = await axios.delete(`${backendUrl}/api/admin/users/${userId}`, {
                withCredentials: true
            });
            
            if (data.success) {
                toast.success('User deleted successfully');
                navigate('/admin/users');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    if (loading) {
        return (
            <div className="admin-loading-spinner">
                <div className="admin-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-loading-spinner">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="admin-loading-spinner">
                <div className="text-red-500">User not found</div>
            </div>
        );
    }

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <h1 className="admin-page-title">User Profile</h1>
                <button 
                    onClick={() => navigate('/admin/users')}
                    className="back-button"
                >
                    Back to User List
                </button>
            </div>

            <div className="admin-card">
                <div className="user-profile-details">
                    <div className="profile-field">
                        <label>Name:</label>
                        <span>{user.name}</span>
                    </div>
                    <div className="profile-field">
                        <label>Email:</label>
                        <span>{user.email}</span>
                    </div>
                    <div className="profile-field">
                        <label>Role:</label>
                        <select 
                            name="role"
                            value={editedUser?.role || user.role} 
                            onChange={handleInputChange}
                            className="role-select"
                        >
                            <option value="Patient">Patient</option>
                            <option value="Doctor">Doctor</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div className="profile-field">
                        <label>Account Status:</label>
                        <span className={`admin-status-badge ${user.isAccountVerified ? 'verified' : 'not-verified'}`}>
                            {user.isAccountVerified ? 'Verified' : 'Not Verified'}
                        </span>
                    </div>
                </div>

                <div className="user-profile-actions">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="save-button"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="delete-button"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage; 