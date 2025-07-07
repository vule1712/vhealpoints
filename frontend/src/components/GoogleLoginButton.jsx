import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from '../context/AppContext';

const GoogleLoginButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { backendUrl, setIsLoggedIn, getUserData } = useContext(AppContext);

    // Check for authorization code in URL (after redirect)
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
            console.log('Found authorization code in URL, processing...');
            handleGoogleLogin(code);
            
            // Clean up URL
            navigate(location.pathname, { replace: true });
        }
    }, [location]);

    const handleGoogleLogin = async (code) => {
        try {
            axios.defaults.withCredentials = true;

            const { data } = await axios.post(backendUrl + '/api/auth/google-login', {
                code: code
            });

            if (data.success) {
                setIsLoggedIn(true);
                const userData = await getUserData();
                console.log('Google Login - User data received:', userData);
                
                // Google accounts are pre-verified, so redirect directly
                navigate('/');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Google login error:', error);
            toast.error('Google login failed. Please try again.');
        }
    };

    const startGoogleLogin = () => {
        console.log('Starting Google OAuth flow...');
        
        // Generate a random state parameter for security
        const state = Math.random().toString(36).substring(7);
        
        // Store state in sessionStorage for verification
        sessionStorage.setItem('googleOAuthState', state);
        
        // Construct Google OAuth URL
        const googleOAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        googleOAuthUrl.searchParams.set('client_id', import.meta.env.VITE_GOOGLE_CLIENT_ID);
        googleOAuthUrl.searchParams.set('redirect_uri', 'https://vhealpoints.vercel.app');
        googleOAuthUrl.searchParams.set('response_type', 'code');
        googleOAuthUrl.searchParams.set('scope', 'openid email profile');
        googleOAuthUrl.searchParams.set('state', state);
        googleOAuthUrl.searchParams.set('access_type', 'offline');
        
        console.log('Redirecting to Google OAuth URL:', googleOAuthUrl.toString());
        
        // Redirect to Google
        window.location.href = googleOAuthUrl.toString();
    };

    return (
        <div className="google-login-container">
            <button 
                onClick={startGoogleLogin}
                className="custom-google-button"
                type="button"
            >
                <svg className="google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
            </button>
        </div>
    );
};

export default GoogleLoginButton; 