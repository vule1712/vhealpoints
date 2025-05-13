import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext()

export const AppContextProvider = (props) => {

    axios.defaults.withCredentials = true // Allow cookies to be sent with requests

    const backendUrl = import.meta.env.VITE_BACKEND_URL // Access backend base URL from .env
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userData, setUserData] = useState(false)


    // Check if the user is logged in and fetch user data
    const getAuthState = async() => {
        try {
            const {data} = await axios.get(backendUrl + '/api/auth/is-auth')
            
            if(data.success) {
                setIsLoggedIn(true)
                getUserData()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Authentication failed')
        }
    }
    
    // Fetch user data
    const getUserData = async() => {
        try {
            const {data} = await axios.get(backendUrl + '/api/user/data')
            if (data.success) {
                console.log('User data received:', data.userData)
                setUserData(data.userData)
                return data.userData
            } else {
                toast.error(data.message)
                return null
            }
        } catch (error) {
            console.error('Error getting user data:', error)
            toast.error(error.response?.data?.message || 'Failed to get user data')
            return null
        }
    }

    useEffect(() => {
        getAuthState()
    }, [])

    const value = {
        backendUrl,
        isLoggedIn, setIsLoggedIn,
        userData, setUserData,
        getUserData
    }

    return(
        <AppContext.Provider value={value}>
            {props.children} 
        </AppContext.Provider>
    )
}