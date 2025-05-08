import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import '../styles/auth.css'

const Login = () => {

    const navigate = useNavigate()

    const {backendUrl, setIsLoggedIn, getUserData} = useContext(AppContext)

    const [state, setState] = useState('Sign Up')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();

            axios.defaults.withCredentials = true // Allow cookies to be sent with requests

            if(state === 'Sign Up') {
                const {data} = await axios.post(backendUrl + '/api/auth/register', {name, email, password}) // POST request to register user

                if(data.success) {
                    setIsLoggedIn(true)
                    getUserData() // Fetch user data after successful registration
                    navigate('/')
                } else {
                    toast.error(data.message) // Show error message if registration fails
                }
            } else { // Login state
                const {data} = await axios.post(backendUrl + '/api/auth/login', {email, password}) // POST request to login user

                if(data.success) {
                    setIsLoggedIn(true)
                    getUserData() // Fetch user data after successful login
                    navigate('/')
                } else {
                    toast.error(data.message) // Show error message if login fails
                }
            }
        } catch (error) {
            toast.error(error.message) // Show error message if login fails
            
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
                        type="password" placeholder="Password" required />
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