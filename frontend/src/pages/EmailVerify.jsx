import React, { useContext, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import '../styles/auth.css'

const EmailVerify = () => {

    axios.defaults.withCredentials = true // Allow cookies to be sent with requests
    const {backendUrl, isLoggedIn, userData, getUserData} = useContext(AppContext)
    const navigate = useNavigate()

    const inputRefs = React.useRef([]) // Ref to keep track of each OTP input box
    
    const handleInput = (e, index) => {
        if(e.target.value.length > 0 && index < inputRefs.current.length - 1) {
            inputRefs.current[index + 1].focus();
        }
    }

    const handleKeyDown = (e, index) => {
        if(e.key === 'Backspace' && e.target.value === '' && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    }

    const handlePaste = (e) => {
        const paste = e.clipboardData.getData('text')
        const pasteArray = paste.split('');
        pasteArray.forEach((char, index) => {
            if(inputRefs.current[index]) {
                inputRefs.current[index].value = char;
            }
        })
    }

    const onSubmitHandler = async(e) => {
        try {
            e.preventDefault();
            const otpArray = inputRefs.current.map(e => e.value)
            const otp = otpArray.join('')

            const {data} = await axios.post(backendUrl + '/api/auth/verify-account', {otp}) // POST request to verify account

            if(data.success) {
                toast.success(data.message)
                getUserData() // Refresh user data after verification
                // Redirect based on user's role
                switch(data.user.role) {
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
                        navigate('/')
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Redirect if user is already logged in and verified
    useEffect(() => {
        if (isLoggedIn && userData && userData.isAccountVerified) {
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
                    navigate('/')
            }
        }
    }, [isLoggedIn, userData])

    return (
        <div className='auth-container'>
            <img onClick={()=>navigate('/')} 
                src={assets.vHealPoints2_trans} 
                className='logo' />
            
            <form onSubmit={onSubmitHandler} className='auth-form'>
                <h1 className='auth-title'>Email Verify OTP</h1>
                <p className='auth-subtitle'>Enter the 6-digit code sent to your email.</p>

                <div className='otp-container' onPaste={handlePaste}>
                    {Array(6).fill(0).map((_, index) => (
                        <input key={index} type="text" maxLength={1} required
                        className='otp-input'
                        ref={e => inputRefs.current[index] = e}
                        onInput={(e) => handleInput(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                    ))}
                </div>
                <button className='submit-button'>
                    Verify Email
                </button>
            </form>
        </div>
    )
}

export default EmailVerify
