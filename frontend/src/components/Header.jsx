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

            <button onClick={() => navigate('/login')} className='get-started-button'>
                Let's get started!
            </button>
        </div>
    )
}

export default Header
