import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import EmailVerify from './pages/EmailVerify'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserListPage from './pages/admin/UserListPage'
import UserProfilePage from './pages/admin/UserProfilePage'
import AdminLayout from './components/layouts/AdminLayout'
import DoctorHome from './pages/DoctorHome'
import PatientHome from './pages/PatientHome'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AppContext } from './context/AppContext';
import Profile from './pages/Profile'

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
    <div>
      <ToastContainer />
      <Routes>
        {/* Home route is now public */}
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
          <Route path='users' element={<ProtectedRoute><UserListPage /></ProtectedRoute>} />
          <Route path='user-profile/:userId' element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
        </Route>

        <Route path='/profile' element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }/>

        <Route path='/doctor' element={
          <ProtectedRoute>
            <DoctorHome/>
          </ProtectedRoute>
        }/>
        <Route path='/patient' element={
          <ProtectedRoute>
            <PatientHome/>
          </ProtectedRoute>
        }/>
      </Routes>
    </div>
  )
}

export default App
