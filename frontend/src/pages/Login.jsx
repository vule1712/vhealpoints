import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import '../styles/auth.css'

const Login = () => {

    const navigate = useNavigate()

    const {backendUrl, setIsLoggedIn, getUserData} = useContext(AppContext)

    const [state, setState] = useState('Sign Up')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role] = useState('Patient')
    const [showPassword, setShowPassword] = useState(false)

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();

            axios.defaults.withCredentials = true // Allow cookies to be sent with requests

            if(state === 'Sign Up') {
                const {data} = await axios.post(backendUrl + '/api/auth/register', {
                    name, 
                    email, 
                    password,
                    role
                })

                if(data.success) {
                    setIsLoggedIn(true)
                    const userData = await getUserData()
                    console.log('Signup - User data received:', userData)
                    // Redirect to email verification if not verified
                    if (!userData.isAccountVerified) {
                        navigate('/email-verify')
                    } else {
                        navigate('/')
                    }
                } else {
                    toast.error(data.message)
                }
            } else { // Login state
                const {data} = await axios.post(backendUrl + '/api/auth/login', {email, password})

                if(data.success) {
                    setIsLoggedIn(true)
                    const userData = await getUserData()
                    console.log('Login - User data received:', userData)
                    // Redirect to email verification if not verified
                    if (!userData.isAccountVerified) {
                        navigate('/email-verify')
                    } else {
                        navigate('/')
                    }
                } else {
                    toast.error(data.message)
                }
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <div className='auth-container'>
            <img onClick={()=>navigate('/')} 
                src={assets.vHealPoints2_trans} 
                className='logo' />

            <div className='auth-form'>
                <h2 className='auth-title'>
                    {state === 'Sign Up' ? 'Create Account' : 'Login'}
                </h2>

                <p className='auth-subtitle'>
                    {state === 'Sign Up' ? 'Create your account' : 'Login to your account!'}
                </p>

                <form onSubmit={onSubmitHandler}>
                    {state === 'Sign Up' && (
                        <div className='input-group'>
                            <img src={assets.person_icon} />
                            <input 
                            onChange={e => setName(e.target.value)}
                            value={name}
                            className='input-field' 
                            type="text" placeholder="Full Name" required />
                        </div>
                    )}

                    <div className='input-group'>
                        <img src={assets.mail_icon} />
                        <input
                        onChange={e => setEmail(e.target.value)}
                        value={email}
                        className='input-field' 
                        type="email" placeholder="Email Address" required />
                    </div>

                    <div className='input-group'>
                        <img src={assets.lock_icon} />
                        <input
                        onChange={e => setPassword(e.target.value)}
                        value={password}
                        className='input-field' 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password" required />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="password-toggle"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {state !== 'Sign Up' && (
                    <p onClick={()=>navigate('/reset-password')}
                        className='forgot-password'>
                            Forgot Password?
                        </p>
                    )}
                    
                    <button className='submit-button'>
                        {state}
                    </button>
                </form>

                {state === 'Sign Up' ? (
                    <p onClick={() => setState('Login')} className='auth-switch'>
                        Already have an account? {' '}
                        <span className='auth-switch-link'>Login here</span>
                    </p>
                ) : (
                    <p onClick={() => setState('Sign Up')} className='auth-switch'>
                        Don't have an account? {' '}
                        <span className='auth-switch-link'>Sign up</span>
                    </p>
                )}
            </div>
        </div>
    )
}

export default Login