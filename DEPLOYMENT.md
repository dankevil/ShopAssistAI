# Shop-Assist AI Deployment Guide

This document provides instructions for deploying the Shop-Assist AI chatbot platform and configuring the necessary services after deployment.

## Replit Deployment (Recommended)

The easiest way to deploy your Shop-Assist AI application is using Replit's built-in deployment feature:

1. Click the "Deploy" button in your Replit project
2. Follow the prompts to configure your deployment
3. Once deployed, you'll get a permanent URL (e.g., `https://your-app-name.replit.app`)
4. **Important**: Set all the required environment variables in your deployment
5. After deployment, follow the post-deployment configuration steps below

## Post-Deployment Configuration

### 1. Update Shopify App Configuration

After deployment, you need to update your Shopify Partner settings:

1. Login to your [Shopify Partners](https://partners.shopify.com) account
2. Navigate to your app settings
3. Update the Redirect URL to point to your deployed domain:
   ```
   https://your-app-name.replit.app/api/shopify/callback
   ```
4. Make sure your App URL is also updated
5. Ensure your Shopify API key and secret are correctly set in your deployment environment variables

### 2. Update Firebase Configuration

For Firebase Google authentication to work properly:

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Authentication → Settings → Authorized domains
4. Add your deployed domain (`your-app-name.replit.app`)
5. Go to Google Cloud Console → APIs & Services → Credentials
6. Edit your OAuth 2.0 Client ID
7. Add your deployed URL to the authorized JavaScript origins:
   ```
   https://your-app-name.replit.app
   ```
8. Add the following URL to authorized redirect URIs:
   ```
   https://your-app-name.replit.app/__/auth/handler
   ```

### 3. Test Shopify Integration

After updating all settings:

1. Access your deployed application
2. Log in with the admin credentials (username: `admin`, password: `admin123`)
3. Navigate to the Shopify Integration page
4. Connect your Shopify store using the OAuth flow
5. Verify that the connection is successful
6. Test product retrieval and other Shopify-related features

## Environment Variables

Ensure the following environment variables are set in your deployment:

```
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database

# Session
SESSION_SECRET=your-secure-random-string

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# Shopify Integration
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret

# Firebase Authentication
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
```

## Troubleshooting

### Shopify Integration Issues

If you encounter issues with the Shopify integration after deployment:

1. Verify that your Shopify API key and secret are correctly set
2. Check that the redirect URL is properly configured in both your Shopify app settings and your application
3. Ensure your app has the necessary scopes enabled in Shopify
4. Check the server logs for any error messages related to the Shopify API

### Firebase Authentication Issues

If Firebase authentication isn't working:

1. Verify all Firebase environment variables are correctly set
2. Ensure your deployed domain is added to the authorized domains list
3. Check that the redirect URIs are properly configured in the Google Cloud Console
4. Test with the console open to check for any errors in the browser

## Security Considerations

- Your deployment will have HTTPS enabled by default with Replit
- The application already implements security headers using Helmet
- API rate limiting is configured with express-rate-limit
- All sensitive operations require authentication and proper authorization

## Next Steps After Deployment

1. Set up a custom domain for a more professional appearance
2. Configure monitoring and alerting
3. Set up regular database backups
4. Create additional admin users for your team
5. Add your company branding to the chat widget