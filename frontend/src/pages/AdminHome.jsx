import React from 'react'
import NavBar from '../components/NavBar'

const AdminHome = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <NavBar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="mt-4 text-gray-600">Welcome to the admin dashboard. Here you can manage users, doctors, and patients.</p>
                </div>
            </main>
        </div>
    )
}

export default AdminHome 