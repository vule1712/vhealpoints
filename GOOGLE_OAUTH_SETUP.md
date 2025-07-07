# Google OAuth Setup Guide

## Backend Configuration

1. **Environment Variables**: Add the following to your backend `.env` file:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

2. **Google Cloud Console Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `http://localhost:3000` (if using different port)
     - Your production domain (for production)
   - Add authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - Your production domain (for production)
   - Copy the Client ID and add it to your backend `.env` file

## Frontend Configuration

1. **Environment Variables**: Create a `.env` file in the frontend directory:
   ```
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

2. **Restart Development Server**: After adding the environment variable, restart your development server.

## Features Added

- ✅ Google OAuth login button
- ✅ Automatic user creation for new Google users (always as Patient)
- ✅ Account linking for existing users
- ✅ Pre-verified accounts (no email verification needed)
- ✅ Avatar support from Google profile
- ✅ Simplified user experience (no role selection needed)

## How It Works

1. User clicks "Continue with Google" button
2. Google OAuth popup opens for authentication
3. After successful authentication, Google returns a credential token
4. Frontend sends the token to backend `/api/auth/google-login` endpoint
5. Backend verifies the token with Google
6. Backend creates new user as Patient or links existing account
7. User is automatically logged in and redirected

## Security Features

- Token verification with Google's servers
- Secure cookie-based authentication
- Account linking protection
- Environment variable protection
- All new Google users are created as Patients by default 