import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import EmailVerify from './pages/EmailVerify'
import ResetPassword from './pages/ResetPassword'
import AdminHome from './pages/AdminHome'
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
        <Route path='/admin' element={<AdminHome/>}/>
        <Route path='/doctor' element={<DoctorHome/>}/>
        <Route path='/patient' element={<PatientHome/>}/>
      </Routes>
    </div>
  )
}

export default App
