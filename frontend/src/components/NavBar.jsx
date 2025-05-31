import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import '../styles/components.css'

const NavBar = () => {

    const navigate = useNavigate()
    const {userData, backendUrl, setUserData, setIsLoggedIn} = useContext(AppContext)

    const sendVerificationOtp = async() => {
        try {
            axios.defaults.withCredentials = true // Allow cookies to be sent with requests

            const {data} = await axios.post(backendUrl + '/api/auth/send-verify-otp') // POST request to send verification OTP

            if(data.success) {
                navigate('/email-verify')
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const logout = async() => {
        try {
            axios.defaults.withCredentials = true // Allow cookies to be sent with requests
            const {data} = await axios.post(backendUrl + '/api/auth/logout') // POST request to logout user
            data.success && setIsLoggedIn(false)
            data.success && setUserData(false)
            navigate('/')
            
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <div className='navbar'>
                <img onClick={() => navigate('/')} src={assets.vHealPoints3} alt="" className='navbar-logo' />
            {userData ?
            <div className='user-avatar'>
                {userData.name[0].toUpperCase()}
                <div className='user-menu'>
                    <ul className='menu-list'>
                        {!userData.isAccountVerified && 
                        <li onClick={sendVerificationOtp}
                        className='menu-item'>
                            Verify Email
                        </li>
                        }
                        <li onClick={() => navigate('/profile')} className='menu-item'>Profile</li>
                        <li onClick={logout} className='menu-item logout'>Logout</li>
                    </ul>
                </div>
            </div>
            : 
            <button onClick={() => navigate('/login')}
            className='login-button'>
                Sign Up/Login <img src={assets.arrow_icon} />
            </button>}
        </div>
    )
}

export default NavBar
