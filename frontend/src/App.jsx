import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Home from './pages/Home'
import Login from './pages/Login'
import EmailVerify from './pages/EmailVerify'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserListPage from './pages/admin/UserListPage'
import UserProfilePage from './pages/admin/UserProfilePage'
import Appointments from './pages/admin/Appointments'
import AdminLayout from './components/layouts/AdminLayout'
import DoctorLayout from './components/layouts/DoctorLayout'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import PatientList from './pages/doctor/PatientList'
import PatientLayout from './components/layouts/PatientLayout'
import PatientDashboard from './pages/patient/PatientDashboard'
import DoctorList from './pages/patient/DoctorList'
import DoctorProfile from './pages/patient/DoctorProfile'
import NotFound from './pages/NotFound'
import { Toaster } from 'react-hot-toast';
import { AppContext } from './context/AppContext';
import Profile from './pages/Profile'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import DoctorAppointmentHistory from './pages/doctor/DoctorAppointmentHistory'
import BookAppointment from './pages/patient/BookAppointment'
import ManageSlots from './pages/doctor/ManageSlots'
import PatientAppointments from './pages/patient/PatientAppointments'
import AdminAppointments from './pages/admin/AdminAppointments'
import DoctorManagement from './pages/admin/DoctorManagement'
import AppointmentHistoryPage from './pages/patient/AppointmentHistory'
import PatientProfile from './pages/doctor/PatientProfile'
import DoctorRatingForm from './components/patient/DoctorRatingForm'

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { isLoggedIn, userData, isLoading } = useContext(AppContext);

    if (isLoading) {
        return (
            <div className="admin-loading-spinner">
                <div className="admin-spinner"></div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" />;
    }

    if (!userData?.isAccountVerified) {
        return <Navigate to="/email-verify" />;
    }

    return children;
};

const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div>
        {/* react-hot-toast container */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
        
        <Routes>
          {/* Public routes */}
          <Route path='/' element={<Home/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/email-verify' element={<EmailVerify/>}/>
          <Route path='/reset-password' element={<ResetPassword/>}/>
          
          {/* Protected Routes */}
          <Route path='/admin' element={
            <ProtectedRoute>
              <AdminLayout/>
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard/>}/>
            <Route path='users' element={
              <ProtectedRoute>
                <UserListPage />
              </ProtectedRoute>
            } />
            <Route path='user-profile/:userId' element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            } />
            <Route path='doctors' element={
              <ProtectedRoute>
                <DoctorManagement />
              </ProtectedRoute>
            } />
            <Route path='appointments' element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            } />
            <Route path='all-appointments' element={
              <ProtectedRoute>
                <AdminAppointments />
              </ProtectedRoute>
            } />
          </Route>

          <Route path='/profile' element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }/>

          <Route path='/doctor' element={
            <ProtectedRoute>
              <DoctorLayout/>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/doctor/dashboard" replace />} />
            <Route path='dashboard' element={<DoctorDashboard />} />
            <Route path='patients' element={<PatientList />} />
            <Route path='patient/:patientId' element={<PatientProfile />} />
            <Route path='appointments' element={<DoctorAppointments />} />
            <Route path='appointment-history' element={<DoctorAppointmentHistory />} />
            <Route path='slots' element={<ManageSlots />} />
          </Route>

          <Route path='/patient' element={
            <ProtectedRoute>
              <PatientLayout/>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/patient/dashboard" replace />} />
            <Route path='dashboard' element={<PatientDashboard />} />
            <Route path='doctors' element={<DoctorList />} />
            <Route path='doctor/:doctorId' element={<DoctorProfile />} />
            <Route path='doctor/:doctorId/rate' element={<DoctorRatingForm />} />
            <Route path='book-appointment/:doctorId' element={<BookAppointment />} />
            <Route path='appointments' element={<PatientAppointments />} />
            <Route path='appointment-history' element={<AppointmentHistoryPage />} />
          </Route>

          {/* Catch all route */}
          <Route path='*' element={<NotFound />} />
        </Routes>
      </div>
    </GoogleOAuthProvider>
  )
}

export default App
