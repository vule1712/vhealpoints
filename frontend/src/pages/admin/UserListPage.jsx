import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import '../../styles/components.css';

const UserListPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {backendUrl} = useContext(AppContext);

    // Fetch user list from the backend
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(backendUrl +'/api/admin/users', {
                    withCredentials: true
                });
                setUsers(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Error fetching users:', error);
                const errorMessage = error.response?.data?.message || 'Failed to fetch users. Please try again later.';
                setError(errorMessage);
                toast.error(errorMessage);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [backendUrl]);

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

    return (
        // Main user list layout
        <div>
            <h1 className="admin-page-title">User List</h1>
            <div className="admin-card">
                {users.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No users found</div>
                ) : (
                    <table className="admin-table">
                        <thead className="admin-table-header">
                            <tr>
                                <th className="admin-table-header-cell">No.</th>
                                <th className="admin-table-header-cell">User Name</th>
                                <th className="admin-table-header-cell">Email</th>
                                <th className="admin-table-header-cell">Role</th>
                                <th className="admin-table-header-cell">Auth Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={user._id || index} className="admin-table-row">
                                    <td className="admin-table-cell">{index + 1}</td>
                                    <td className="admin-table-cell admin-table-cell-bold">{user.name || 'N/A'}</td>
                                    <td className="admin-table-cell">{user.email || 'N/A'}</td>
                                    <td className="admin-table-cell">{user.role || 'N/A'}</td>
                                    <td className="admin-table-cell">
                                        <span className={`admin-status-badge ${user.isAccountVerified ? 'verified' : 'not-verified'}`}>
                                            {user.isAccountVerified ? 'Verified' : 'Not Verified'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UserListPage; 