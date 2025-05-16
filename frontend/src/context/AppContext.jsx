import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext()

export const AppContextProvider = (props) => {
    axios.defaults.withCredentials = true // Allow cookies to be sent with requests

    const backendUrl = import.meta.env.VITE_BACKEND_URL // Access backend base URL from .env
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userData, setUserData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Check if the user is logged in and fetch user data
    const getAuthState = async() => {
        try {
            const {data} = await axios.get(backendUrl + '/api/auth/is-auth')
            
            if(data.success) {
                setIsLoggedIn(true)
                await getUserData()
            } else {
                setIsLoggedIn(false)
                setUserData(null)
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            setIsLoggedIn(false)
            setUserData(null)
        } finally {
            setIsLoading(false)
        }
    }
    
    // Fetch user data
    const getUserData = async() => {
        try {
            const {data} = await axios.get(backendUrl + '/api/user/data')
            if (data.success) {
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

    // Logout function
    const logout = async () => {
        try {
            await axios.post(backendUrl + '/api/auth/logout')
            setIsLoggedIn(false)
            setUserData(null)
            toast.success('Logged out successfully')
        } catch (error) {
            console.error('Logout failed:', error)
            toast.error('Failed to logout')
        }
    }

    // Check auth state on mount and when backendUrl changes
    useEffect(() => {
        getAuthState()
    }, [backendUrl])

    const value = {
        backendUrl,
        isLoggedIn,
        setIsLoggedIn,
        userData,
        setUserData,
        getUserData,
        logout,
        isLoading
    }

    return(
        <AppContext.Provider value={value}>
            {props.children} 
        </AppContext.Provider>
    )
}