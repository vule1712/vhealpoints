import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import EmailVerify from './pages/EmailVerify'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserListPage from './pages/admin/UserListPage'
import AdminLayout from './components/layouts/AdminLayout'
import DoctorHome from './pages/DoctorHome'
import PatientHome from './pages/PatientHome'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/email-verify' element={<EmailVerify/>}/>
        <Route path='/reset-password' element={<ResetPassword/>}/>
        
        {/* Admin Routes */}
        <Route path='/admin' element={<AdminLayout/>}>
          <Route index element={<AdminDashboard/>}/>
          <Route path='users' element={<UserListPage/>}/>
        </Route>

        <Route path='/doctor' element={<DoctorHome/>}/>
        <Route path='/patient' element={<PatientHome/>}/>
      </Routes>
    </div>
  )
}

export default App
