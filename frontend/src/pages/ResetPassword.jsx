import React, { useContext, useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import '../styles/auth.css'

const ResetPassword = () => {
    const {backendUrl} = useContext(AppContext)
    axios.defaults.withCredentials = true // Allow cookies to be sent with requests

    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [isEmailSent, setIsEmailSent] = useState(false)
    const [otp, setOtp] = useState(0)
    const [isOtpSubmitted, setIsOtpSubmitted] = useState(false)
    const [resendDisabled, setResendDisabled] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const inputRefs = React.useRef([])

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
            const {data} = await axios.post(backendUrl + '/api/auth/send-reset-otp', {email})
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

    const onSubmitEmail = async(e) => {
        e.preventDefault();

        try {
            const {data} = await axios.post(backendUrl + '/api/auth/send-reset-otp', {email}) // POST request to send OTP to email
            data.success ? toast.success(data.message) : toast.error(data.message)
            data.success && setIsEmailSent(true)
            data.success && setResendDisabled(true)
            data.success && setCountdown(60)
        } catch (error) {
            toast.error(error.message)
        }
    }

    const onSubmitOtp = async(e) => {
        e.preventDefault();

        const otpArray = inputRefs.current.map(e => e.value)
        setOtp(otpArray.join(''))
        setIsOtpSubmitted(true)
    }

    const onSubmitNewPassword = async(e) => {
        e.preventDefault();

        try {
            const {data} = await axios.post(backendUrl + '/api/auth/reset-password', {email, otp, newPassword}) // POST request to reset password
            data.success ? toast.success(data.message) : toast.error(data.message)
            data.success && navigate('/login')
        } catch (error) {
            toast.error(error.message)
        }
    }

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

    return (
        <div className='auth-container'>
            <img onClick={()=>navigate('/')} 
                src={assets.vHealPoints2_trans} 
                className='logo' />

            {!isEmailSent &&
                <form onSubmit={onSubmitEmail} className='auth-form'>
                    <h1 className='auth-title'>Reset Password</h1>
                    <p className='auth-subtitle'>Enter your registered email address to receive password reset OTP.</p>
                    <div className='input-group'>
                        <img src={assets.mail_icon} className='w-3 h-3' />
                        <input type="email" placeholder='Email Address' 
                        className='input-field'
                        value={email} onChange={e => setEmail(e.target.value)}
                        required
                        />
                    </div>
                    <button className='submit-button'>
                        Submit
                    </button>
                </form>
            }

            {!isOtpSubmitted && isEmailSent &&
                <form onSubmit={onSubmitOtp} className='auth-form'>
                    <h1 className='auth-title'>Reset Password OTP</h1>
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
                        Reset Password
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
            }

            {isOtpSubmitted && isEmailSent &&
                <form onSubmit={onSubmitNewPassword} className='auth-form'>
                    <h1 className='auth-title'>New Password</h1>
                    <p className='auth-subtitle'>Enter your new password</p>
                    <div className='input-group'>
                        <img src={assets.lock_icon} className='w-3 h-3' />
                        <input type="password" placeholder='New Password' 
                        className='input-field'
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        required
                        />
                    </div>
                    <button className='submit-button'>
                        Update Password
                    </button>
                </form>
            }
        </div>
    )
}

export default ResetPassword
