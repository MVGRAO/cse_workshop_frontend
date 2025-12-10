# Quick Start Guide - Google OAuth Setup

## Fix: "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set" Error

This error occurs because the Google Client ID environment variable is not configured. Follow these steps:

### Step 1: Create `.env.local` file

Create a file named `.env.local` in the `cse_workshop_frontend` directory (same level as `package.json`).

### Step 2: Add Environment Variables

Add the following content to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

**Important:** Replace `your-google-client-id.apps.googleusercontent.com` with your actual Google Client ID.

### Step 3: Get Your Google Client ID

If you don't have a Google Client ID yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure OAuth consent screen if prompted
6. For OAuth client:
   - Application type: **Web application**
   - Name: CSE Workshop
   - Authorized JavaScript origins: `http://localhost:3000`
   - Click **Create**
7. Copy the **Client ID** (it looks like: `123456789-abc.apps.googleusercontent.com`)

### Step 4: Restart Development Server

**IMPORTANT:** After creating or modifying `.env.local`, you must restart your Next.js development server:

1. Stop the current server (Ctrl+C)
2. Start it again: `npm run dev`

### Step 5: Verify

1. Open `http://localhost:3000/candidate` or `http://localhost:3000/employer`
2. The error message should be gone
3. Click "Sign in with Google" - it should open the Google sign-in popup

## Troubleshooting

### Still seeing the error after restarting?

- Make sure `.env.local` is in the `cse_workshop_frontend` folder (not in a subfolder)
- Make sure the variable name is exactly `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (case-sensitive)
- Make sure there are no spaces around the `=` sign
- Restart your development server completely

### Button not working?

- Check browser console for errors
- Make sure your backend server is running on `http://localhost:5000`
- Verify the Google Client ID is correct
- Check that `http://localhost:3000` is added to Authorized JavaScript origins in Google Cloud Console

### Need more help?

See `GOOGLE_OAUTH_SETUP.md` for detailed setup instructions.

