import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import '../styles/auth.css'

const EmailVerify = () => {
    axios.defaults.withCredentials = true // Allow cookies to be sent with requests
    const {backendUrl, isLoggedIn, userData, getUserData} = useContext(AppContext)
    const navigate = useNavigate()
    const [resendDisabled, setResendDisabled] = useState(false)
    const [countdown, setCountdown] = useState(0)

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

    const handleResendOtp = async () => {
        try {
            const {data} = await axios.post(backendUrl + '/api/auth/send-verify-otp')
            if(data.success) {
                toast.success(data.message)
                setResendDisabled(true)
                setCountdown(60) // Start 60 second countdown
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const onSubmitHandler = async(e) => {
        try {
            e.preventDefault();
            const otpArray = inputRefs.current.map(e => e.value)
            const otp = otpArray.join('')

            const {data} = await axios.post(backendUrl + '/api/auth/verify-account', {otp}) // POST request to verify account

            if(data.success) {
                toast.success(data.message)
                const updatedUserData = await getUserData() // Refresh user data after verification
                // Redirect based on user's role
                if (updatedUserData.isAccountVerified) {
                    switch(updatedUserData.role) {
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
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Send OTP automatically when component mounts
    useEffect(() => {
        const sendInitialOtp = async () => {
            try {
                const {data} = await axios.post(backendUrl + '/api/auth/send-verify-otp')
                if(data.success) {
                    toast.success(data.message)
                    setResendDisabled(true)
                    setCountdown(60)
                } else {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error(error.message)
            }
        }

        if (isLoggedIn && !userData?.isAccountVerified) {
            sendInitialOtp()
        }
    }, [isLoggedIn, userData])

    // Countdown timer effect
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1)
            }, 1000)
        } else {
            setResendDisabled(false)
        }
        return () => clearInterval(timer)
    }, [countdown])

    // Redirect if user is not logged in
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login')
        }
    }, [isLoggedIn])

    // Redirect if user is already verified
    useEffect(() => {
        if (userData && userData.isAccountVerified) {
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
    }, [userData])

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
                <div className='resend-otp-container'>
                    <p className='auth-subtitle'>Didn't receive the code?</p>
                    <button 
                        type='button'
                        onClick={handleResendOtp}
                        disabled={resendDisabled}
                        className='resend-button'
                    >
                        {resendDisabled ? `Resend in ${countdown}s` : 'Resend OTP'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default EmailVerify
