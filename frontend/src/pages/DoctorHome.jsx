import React from 'react'
import NavBar from '../components/NavBar'

const DoctorHome = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <NavBar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-24">
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                    <p className="mt-4 text-gray-600">Welcome to the doctor dashboard. Here you can manage your patients and appointments.</p>
                </div>
            </main>
        </div>
    )
}

export default DoctorHome 