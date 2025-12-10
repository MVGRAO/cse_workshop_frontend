# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the CSE Workshop frontend.

## Prerequisites

1. A Google Cloud Platform account
2. Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type (unless you have a Google Workspace)
   - Fill in the required information (App name, User support email, etc.)
   - Add your email to test users if needed
   - Click **Save and Continue** through the scopes and test users screens
6. For the OAuth client:
   - Application type: **Web application**
   - Name: CSE Workshop (or your preferred name)
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production URL (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs: Not needed for this implementation (we use ID token flow)
   - Click **Create**
7. Copy the **Client ID** (you'll need this for the frontend)

## Step 2: Configure Environment Variables

Create a `.env.local` file in the `cse_workshop_frontend` directory:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

**Important:** 
- Replace `your-google-client-id.apps.googleusercontent.com` with your actual Client ID from Step 1
- Make sure the `NEXT_PUBLIC_API_BASE_URL` matches your backend server URL
- In Next.js, environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser

## Step 3: Backend Configuration

Make sure your backend has the following environment variables set:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
ALLOWED_EMAIL_DOMAINS=@college.edu,@university.edu
FRONTEND_URL=http://localhost:3000
```

**Note:** The `GOOGLE_CLIENT_ID` should be the same in both frontend and backend.

## Step 4: Test the Integration

1. Start your backend server:
   ```bash
   cd cse_workshop_backend
   npm run dev
   ```

2. Start your frontend server:
   ```bash
   cd cse_workshop_frontend
   npm run dev
   ```

3. Navigate to `http://localhost:3000/candidate` or `http://localhost:3000/employer`
4. Click "Sign in with Google"
5. Select your Google account
6. If your email domain is allowed, you should be authenticated successfully

## How It Works

1. User clicks "Sign in with Google" button
2. Google Identity Services prompts the user to select an account
3. Google returns an ID token to the frontend
4. Frontend sends the ID token to the backend API (`POST /api/v1/auth/google`)
5. Backend verifies the ID token with Google
6. Backend checks if the email domain is allowed
7. Backend creates or updates the user in the database
8. Backend returns a JWT token and user information
9. Frontend stores the JWT token in localStorage
10. User is redirected to their dashboard

## Troubleshooting

### "Google Client ID is not configured"
- Make sure you've created `.env.local` file with `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Restart your Next.js development server after adding environment variables

### "Only college email addresses are allowed"
- Check your backend `ALLOWED_EMAIL_DOMAINS` configuration
- Make sure your email domain is included in the allowed domains list

### CORS errors
- Verify that `FRONTEND_URL` in backend matches your frontend URL
- Check that the backend CORS configuration includes your frontend origin

### "Failed to load Google Identity Services"
- Check your internet connection
- Verify that `https://accounts.google.com/gsi/client` is accessible
- Check browser console for any blocked scripts

## Security Notes

- Never commit `.env.local` or `.env` files to version control
- Use different Client IDs for development and production
- Regularly rotate your `GOOGLE_CLIENT_SECRET` in production
- Keep your `JWT_SECRET` secure and use a strong random string

