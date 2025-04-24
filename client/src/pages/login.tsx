import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { login, register } from '@/lib/api';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link } from 'wouter';
import { auth, signInWithGoogle } from '@/lib/firebase';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize Firebase auth state monitoring
  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        console.log("Firebase user is signed in:", firebaseUser.email);
        
        toast({
          title: 'Login successful',
          description: 'You are now logged in with Google.',
        });
      }
    });
    
    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [toast]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormValues) => login(data.username, data.password),
    onSuccess: () => {
      toast({
        title: 'Login successful',
        description: 'You are now logged in.',
      });
      window.location.href = '/';
    },
    onError: () => {
      toast({
        title: 'Login failed',
        description: 'Invalid username or password. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormValues) => register(data.username, data.password, data.email),
    onSuccess: () => {
      toast({
        title: 'Registration successful',
        description: 'Your account has been created. You are now logged in.',
      });
      window.location.href = '/';
    },
    onError: () => {
      toast({
        title: 'Registration failed',
        description: 'There was a problem creating your account. This username may already be taken.',
        variant: 'destructive',
      });
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login form */}
      <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="mb-8">
            <img src="/images/thinkstore-logo.webp" alt="Thinkstore Assist" className="h-10" />
          </div>
          
          {/* Login Form */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Log in to Thinkstore Assist</h1>
            <p className="text-gray-600 mb-6">Welcome back! Please enter your details.</p>
            
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
              <div className="space-y-5">
                <div>
                  <Input
                    id="username"
                    placeholder="Username"
                    className="border border-gray-300 py-3 px-4"
                    {...loginForm.register("username")}
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.username.message}</p>
                  )}
                </div>
                
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="border border-gray-300 py-3 px-4"
                    {...loginForm.register("password")}
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                  </button>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rememberMe" 
                      {...loginForm.register("rememberMe")} 
                    />
                    <label htmlFor="rememberMe" className="text-sm text-gray-600">
                      Remember Me
                    </label>
                  </div>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">
                    Forgot Your Password?
                  </a>
                </div>
                
                <Button
                  type="submit"
                  className="w-full py-6"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
                
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-gray-300 w-full absolute"></div>
                  <span className="bg-white px-2 text-sm text-gray-500 relative">or</span>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md py-6 bg-white hover:bg-gray-50 transition-colors"
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      await signInWithGoogle();
                    } catch (error) {
                      console.error("Google sign-in error:", error);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  {isLoading ? "Signing in..." : "Sign in with Google"}
                </Button>
                
                <p className="text-sm text-center text-gray-600">
                  Don't have an account? <Link href="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Right side - Hero Image */}
      <div className="hidden md:block md:w-1/2 bg-gray-100">
        <div className="h-full w-full flex items-center justify-center p-8">
          <div className="max-w-lg rounded-lg overflow-hidden border border-gray-300 shadow-lg">
            <img 
              src="/images/auth/chatbot-login.svg"
              alt="Thinkstore Assist interface illustration" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
