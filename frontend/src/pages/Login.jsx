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
    const [role, setRole] = useState('Patient')

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
                    navigate('/')
                } else {
                    toast.error(data.message)
                }
            } else { // Login state
                const {data} = await axios.post(backendUrl + '/api/auth/login', {email, password})

                if(data.success) {
                    setIsLoggedIn(true)
                    const userData = await getUserData()
                    console.log('Login - User data received:', userData)
                    navigate('/')
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
                        <>
                            <div className='input-group'>
                                <img src={assets.person_icon} />
                                <input 
                                onChange={e => setName(e.target.value)}
                                value={name}
                                className='input-field' 
                                type="text" placeholder="Full Name" required />
                            </div>

                            <div className='input-group'>
                                <img src={assets.role_icon} className='w-4 h-4' />
                                <select
                                    onChange={e => setRole(e.target.value)}
                                    value={role}
                                    className='input-field'
                                    required
                                    style={{
                                        appearance: 'none',
                                        background: 'transparent',
                                        backgroundColor: '#333A5C',
                                        width: '100%',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="Patient">Patient</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                        </>
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