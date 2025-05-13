import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import '../styles/components.css'

const Header = () => {
    const navigate = useNavigate()
    const { userData } = useContext(AppContext)

    return (
        <div className='header-container'>
            <img src={assets.doctor_char} className='doctor-image' />

            <h1 className='greeting'>
                Hello {userData ? userData.name : 'there'}!
                <img className='wave-icon' src={assets.hand_wave} />
            </h1>

            <h2 className='welcome-text'>
                Welcome to vHealPoints
            </h2>

            <p className='description'>
                vHealPoints is a platform that helps you find doctors and book appointments online.
            </p>

            {/* Button to navigate to role-specific page */}
            <button onClick={() => {
                console.log('Current user data:', userData)
                if (userData && userData.role) {
                    console.log('Navigating to role-specific page for role:', userData.role)
                    switch(userData.role) {
                        case 'Admin':
                            navigate('/admin')
                            break
                        case 'Doctor':
                            navigate('/doctor')
                            break
                        case 'Patient':
                            navigate('/patient')
                            break
                        default:
                            console.log('No specific role found, navigating to home')
                            navigate('/')
                    }
                } else {
                    console.log('No valid user data or role, navigating to login')
                    navigate('/login')
                }
            }} className='get-started-button'>
                Let's get started!
            </button>
        </div>
    )
}

export default Header
