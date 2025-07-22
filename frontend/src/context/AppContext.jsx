import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { socket } from "../socket";

export const AppContext = createContext()

export const AppContextProvider = (props) => {
    axios.defaults.withCredentials = true // Allow cookies to be sent with requests

    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userData, setUserData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [useLocalStorage, setUseLocalStorage] = useState(false) // Fallback for cookie issues

    // Set auth token for axios requests
    const setAuthToken = (token) => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    // Check if the user is logged in and fetch user data
    const getAuthState = async() => {
        try {
            console.log('AppContext: Checking auth state...');
            console.log('AppContext: Backend URL:', backendUrl);
            
            // First try cookie-based authentication
            const {data} = await axios.get(backendUrl + '/api/auth/is-auth')
            console.log('AppContext: Auth response:', data);
            
            if(data.success) {
                setIsLoggedIn(true)
                setUseLocalStorage(false)
                // Set user data directly from the response
                if (data.userData) {
                    console.log('AppContext: Setting user data from auth response');
                    setUserData(data.userData)
                } else {
                    // Fallback to separate call if userData not in response
                    console.log('AppContext: No user data in auth response, fetching separately');
                    await getUserData()
                }
            } else {
                console.log('AppContext: Cookie auth failed, trying localStorage');
                // Try localStorage fallback
                if (checkLocalStorageAuth()) {
                    console.log('AppContext: localStorage auth successful');
                } else {
                    console.log('AppContext: All auth methods failed');
                    setIsLoggedIn(false)
                    setUserData(null)
                }
            }
        } catch (error) {
            console.error('AppContext: Cookie auth check failed:', error);
            console.error('AppContext: Error response:', error.response?.data);
            
            // Try localStorage fallback if cookie auth fails
            if (!checkLocalStorageAuth()) {
                setIsLoggedIn(false)
                setUserData(null)
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Authenticate user immediately after login with token
    const authenticateWithToken = async (token, userData) => {
        try {
            console.log('AppContext: Authenticating with token...');
            console.log('AppContext: Token:', token);
            console.log('AppContext: User data:', userData);
            
            // Save to localStorage first
            saveAuthToLocalStorage(token, userData);
            
            // Set token for axios requests
            setAuthToken(token);
            
            // Set login state
            setIsLoggedIn(true);
            setUseLocalStorage(true);
            setUserData(userData);
            
            console.log('AppContext: Authentication successful with token');
            return true;
        } catch (error) {
            console.error('AppContext: Error authenticating with token:', error);
            return false;
        }
    };
    
    // Fetch user data
    const getUserData = async() => {
        try {
            console.log('AppContext: Fetching user data...');
            const {data} = await axios.get(backendUrl + '/api/user/data')
            console.log('AppContext: User data response:', data);
            
            if (data.success) {
                console.log('AppContext: Setting user data:', data.userData);
                setUserData(data.userData)
                return data.userData
            } else {
                console.log('AppContext: User data fetch failed:', data.message);
                toast.error(data.message)
                return null
            }
        } catch (error) {
            console.error('AppContext: Error getting user data:', error);
            console.error('AppContext: Error response:', error.response?.data);
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
            setUseLocalStorage(false)
            
            // Clear localStorage
            localStorage.removeItem('vhealpoints_token');
            localStorage.removeItem('vhealpoints_user');
            
            // Clear axios auth header
            setAuthToken(null);
            
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

    // Fallback authentication using localStorage
    const checkLocalStorageAuth = () => {
        try {
            const token = localStorage.getItem('vhealpoints_token');
            const userData = localStorage.getItem('vhealpoints_user');
            
            console.log('AppContext: Checking localStorage for auth data...');
            console.log('AppContext: Token in localStorage:', token ? 'found' : 'not found');
            console.log('AppContext: User data in localStorage:', userData ? 'found' : 'not found');
            
            if (token && userData) {
                console.log('AppContext: Found auth data in localStorage');
                setUseLocalStorage(true);
                setIsLoggedIn(true);
                setUserData(JSON.parse(userData));
                
                // Set token for axios requests
                setAuthToken(token);
                
                return true;
            } else {
                console.log('AppContext: No auth data found in localStorage');
            }
        } catch (error) {
            console.error('AppContext: Error reading from localStorage:', error);
        }
        return false;
    };

    // Function to save auth data to localStorage
    const saveAuthToLocalStorage = (token, user) => {
        try {
            localStorage.setItem('vhealpoints_token', token);
            localStorage.setItem('vhealpoints_user', JSON.stringify(user));
            console.log('AppContext: Auth data saved to localStorage');
        } catch (error) {
            console.error('AppContext: Error saving to localStorage:', error);
        }
    };

    const value = {
        backendUrl,
        isLoggedIn,
        setIsLoggedIn,
        userData,
        setUserData,
        getUserData,
        logout,
        isLoading,
        socket,
        useLocalStorage,
        setUseLocalStorage,
        saveAuthToLocalStorage,
        setAuthToken,
        authenticateWithToken
    }

    return(
        <AppContext.Provider value={value}>
            {props.children} 
        </AppContext.Provider>
    )
}