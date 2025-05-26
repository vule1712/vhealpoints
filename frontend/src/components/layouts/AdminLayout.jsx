import { Outlet, Link, useLocation } from 'react-router-dom';
import NavBar from '../NavBar';

const AdminLayout = () => {
    const location = useLocation();

    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/users', label: 'User List', icon: '👥' },
        { path: '/admin/appointments', label: 'Manage Appointments', icon: '📅' },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <NavBar />
            <div className="flex h-[100vh] pt-[82px]">
                {/* Side Menu */}
                <div className="w-64 bg-white shadow-lg">
                    <nav className="mt-4">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${
                                    location.pathname === item.path ? 'bg-gray-100 border-l-4 border-blue-500' : ''
                                }`}
                            >
                                <span className="mr-3">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto">
                    <div className="p-8">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout; 