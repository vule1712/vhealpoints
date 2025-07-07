import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { socket } from "../socket";

export const AppContext = createContext()

export const AppContextProvider = (props) => {
    axios.defaults.withCredentials = true // Allow cookies to be sent with requests

    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL // Access backend base URL from .env
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userData, setUserData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Check if the user is logged in and fetch user data
    const getAuthState = async() => {
        try {
            const {data} = await axios.get(backendUrl + '/api/auth/is-auth')
            
            if(data.success) {
                setIsLoggedIn(true)
                // Set user data directly from the response
                if (data.userData) {
                    setUserData(data.userData)
                } else {
                    // Fallback to separate call if userData not in response
                await getUserData()
                }
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

    useEffect(() => {
        if (isLoggedIn && userData) {
            console.log('AppContext: Setting up socket connection for user:', userData._id);
            socket.auth.userId = userData._id;
            socket.connect();
            
            // Add debugging
            socket.on('connect', () => {
                console.log('AppContext: Socket connected with userId:', userData._id);
                console.log('AppContext: Socket ID:', socket.id);
            });
            
            socket.on('disconnect', () => {
                console.log('AppContext: Socket disconnected');
            });
            
            socket.on('connect_error', (error) => {
                console.error('AppContext: Socket connection error:', error);
            });
            
            // Add specific event listeners for debugging
            const handleDoctorUpdate = (data) => {
                console.log('AppContext: Received doctor-dashboard-update event:', data);
            };
            
            const handlePatientUpdate = (data) => {
                console.log('AppContext: Received patient-dashboard-update event:', data);
            };
            
            const handleAdminUpdate = (data) => {
                console.log('AppContext: Received admin-dashboard-update event:', data);
            };
            
            socket.on('doctor-dashboard-update', handleDoctorUpdate);
            socket.on('patient-dashboard-update', handlePatientUpdate);
            socket.on('admin-dashboard-update', handleAdminUpdate);
            
        } else {
            console.log('AppContext: Disconnecting socket - not logged in or no user data');
            socket.disconnect();
        }

        return () => {
            console.log('AppContext: Cleaning up socket connection');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('doctor-dashboard-update');
            socket.off('patient-dashboard-update');
            socket.off('admin-dashboard-update');
            socket.disconnect();
        }
    }, [isLoggedIn, userData]);

    const value = {
        backendUrl,
        isLoggedIn,
        setIsLoggedIn,
        userData,
        setUserData,
        getUserData,
        logout,
        isLoading,
        socket
    }

    return(
        <AppContext.Provider value={value}>
            {props.children} 
        </AppContext.Provider>
    )
}