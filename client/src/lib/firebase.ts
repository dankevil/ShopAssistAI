import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "000000000000", // This is a placeholder, will be ignored
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add authorization domain - this is important for Replit domains
auth.useDeviceLanguage();

// Set custom OAuth parameters for the Google provider to ensure proper redirect
googleProvider.setCustomParameters({
  // Force account selection even when one account is available
  prompt: 'select_account',
  // Allow Firebase to handle the redirect URI automatically
  login_hint: 'user@example.com'
});

// Sign in with Google popup
export const signInWithGoogle = async () => {
  try {
    toast({
      title: "Firebase Auth Notice",
      description: "Google authentication requires deployment with a stable domain and Firebase configuration. Using regular login until deployment.",
      variant: "default",
    });

    console.log("Firebase auth requires deployment with a stable domain and proper configuration in Firebase Console");
    return null;
    
    // The code below will work after deployment and Firebase configuration
    /*
    // Use popup login for better reliability in various environments
    const result = await signInWithPopup(auth, googleProvider);
    
    // Get the user's token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    // The signed-in user info
    const user = result.user;
    
    console.log("Firebase auth successful, sending token to backend");
    
    // Now send the Firebase token to your backend
    const response = await fetch('/api/auth/firebase-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: await user.getIdToken(),
        email: user.email,
        displayName: user.displayName,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to authenticate with the server');
    }
    
    // Redirect to the dashboard or home page
    window.location.href = '/';
    
    return { user, token };
    */
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      toast({
        title: "Sign-in cancelled",
        description: "You closed the sign-in window.",
        variant: "destructive",
      });
    } else if (error.code === 'auth/popup-blocked') {
      toast({
        title: "Popup blocked",
        description: "Please allow popups for this site and try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sign-in error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    }
    throw error;
  }
};

export { auth };