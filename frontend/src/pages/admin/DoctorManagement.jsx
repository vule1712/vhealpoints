import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../context/AppContext';
import { format, parseISO } from 'date-fns';
import DoctorSlotsModal from '../../components/admin/DoctorSlotsModal';

const DoctorManagement = () => {
    const { backendUrl } = useContext(AppContext);
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFilter, setSearchFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [showSlotsModal, setShowSlotsModal] = useState(false);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${backendUrl}/api/user/doctor`, {
                withCredentials: true
            });
            if (response.data.success) {
                setDoctors(response.data.doctors || []);
                setFilteredDoctors(response.data.doctors || []);
            } else {
                setError(response.data.message || 'Failed to fetch doctors');
                toast.error(response.data.message || 'Failed to fetch doctors');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error fetching doctors');
            toast.error(error.response?.data?.message || 'Error fetching doctors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, [backendUrl]);

    // Filter doctors based on search query and filter type
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredDoctors(doctors);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = doctors.filter(doctor => {
                switch (searchFilter) {
                    case 'name':
                        return doctor.name.toLowerCase().includes(query);
                    case 'specialization':
                        return doctor.specialization.toLowerCase().includes(query);
                    case 'clinic':
                        return (doctor.clinicName || '').toLowerCase().includes(query);
                    default:
                        return doctor.name.toLowerCase().includes(query) ||
                               doctor.specialization.toLowerCase().includes(query) ||
                               (doctor.clinicName || '').toLowerCase().includes(query);
                }
            });
            setFilteredDoctors(filtered);
        }
    }, [searchQuery, searchFilter, doctors]);

    const handleDoctorClick = (doctor) => {
        setSelectedDoctor(doctor);
        setShowSlotsModal(true);
    };

    const handleSlotsUpdate = () => {
        fetchDoctors();
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Doctor Management</h2>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="border-b border-gray-200 pb-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Doctor Management</h2>
                <div className="text-red-500 text-center py-4">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Doctor Management</h2>
            
            {/* Search Bar and Filter */}
            <div className="mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search doctors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-gray-600 font-medium">by</span>
                    <select
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        <option value="all">All</option>
                        <option value="name">Name</option>
                        <option value="specialization">Specialization</option>
                        <option value="clinic">Clinic</option>
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors && filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                        <div
                            key={doctor._id}
                            onClick={() => handleDoctorClick(doctor)}
                            className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Dr. {doctor.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {doctor.specialization}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    doctor.isAccountVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {doctor.isAccountVerified ? 'Verified' : 'Pending'}
                                </span>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Clinic:</span> {doctor.clinicName || 'Not specified'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Email:</span> {doctor.email}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center col-span-full py-4">
                        {searchQuery ? 'No doctors found matching your search' : 'No doctors found'}
                    </p>
                )}
            </div>

            {selectedDoctor && (
                <DoctorSlotsModal
                    doctor={selectedDoctor}
                    showModal={showSlotsModal}
                    onClose={() => {
                        setShowSlotsModal(false);
                        setSelectedDoctor(null);
                    }}
                    onSlotsUpdate={handleSlotsUpdate}
                />
            )}
        </div>
    );
};

export default DoctorManagement; 