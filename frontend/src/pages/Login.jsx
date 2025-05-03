import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

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
        <div className='flex flex-col items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-500 to-blue-100'>
            <img onClick={()=>navigate('/')} 
                src={assets.vHealPoints2_trans} 
                className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer' />

            <div className='bg-slate-900 p-10 rounded-lg shadow-lg w-full sm:w-96 text-indigo-300 text-sm'>
                <h2 className='text-3xl font-semibold text-white text-center mb-3'>
                    {state === 'Sign Up' ? 'Create Account' : 'Login'}
                </h2>

                <p className='text-center text-sm mb-6'>
                    {state === 'Sign Up' ? 'Create your account' : 'Login to your account!'}
                </p>

                <form onSubmit={onSubmitHandler}>
                    {/* Full name field - only for sign up state */}
                    {state === 'Sign Up' && (
                        <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
                            <img src={assets.person_icon} />
                            <input 
                            onChange={e => setName(e.target.value)}
                            value={name}
                            className='bg-transparent outline-none' 
                            type="text" placeholder="Full Name" required />
                        </div>
                    )}

                    {/* Email */}
                    <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
                        <img src={assets.mail_icon} />
                        <input
                        onChange={e => setEmail(e.target.value)}
                        value={email}
                        className='bg-transparent outline-none' 
                        type="email" placeholder="Email Address" required />
                    </div>

                    {/* Password */}
                    <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
                        <img src={assets.lock_icon} />
                        <input
                        onChange={e => setPassword(e.target.value)}
                        value={password}
                        className='bg-transparent outline-none' 
                        type="password" placeholder="Password" required />
                    </div>

                    {state !== 'Sign Up' && (
                    <p onClick={()=>navigate('/reset-password')}
                        className='mb-4 text-indigo-500 cursor-pointer'>
                            Forgot Password?
                        </p>
                    )}
                    
                    {/* Submit button */}
                    <button className='w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium'>
                        {state}
                    </button>
                </form>
                

                {state === 'Sign Up' ? (
                    <p onClick={() => setState('Login')} className='text-gray-400 text-center text-xs mt-4'>
                        Already have an account? {' '}
                        <span className='text-blue-400 cursor-pointer underline'>Login here</span>
                    </p>
                ) : (
                    <p onClick={() => setState('Sign Up')} className='text-gray-400 text-center text-xs mt-4'>
                        Don't have an account? {' '}
                        <span className='text-blue-400 cursor-pointer underline'>Sign up</span>
                    </p>
                )}
            </div>
        </div>
    )
}

export default Login