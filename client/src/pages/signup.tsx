import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { register } from '@/lib/api';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link } from 'wouter';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
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

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Signup form */}
      <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="mb-8">
            <img src="/images/thinkstore-logo.webp" alt="Thinkstore Assist" className="h-10" />
          </div>
          
          {/* Signup Form */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Create a Thinkstore Assist Account</h1>
            <p className="text-gray-600 mb-6">Sign up to get started with Thinkstore Assist</p>
            
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
              <div className="space-y-5">
                <div>
                  <Input
                    id="username"
                    placeholder="Username"
                    className="border border-gray-300 py-3 px-4"
                    {...registerForm.register("username")}
                  />
                  {registerForm.formState.errors.username && (
                    <p className="text-sm text-red-500 mt-1">{registerForm.formState.errors.username.message}</p>
                  )}
                </div>
                
                <div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    className="border border-gray-300 py-3 px-4"
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500 mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="border border-gray-300 py-3 px-4"
                    {...registerForm.register("password")}
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                  </button>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500 mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    className="border border-gray-300 py-3 px-4"
                    {...registerForm.register("confirmPassword")}
                  />
                  <button 
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                  </button>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full py-6"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating account..." : "Create Account"}
                </Button>
                
                <p className="text-sm text-center text-gray-600">
                  Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Log in</Link>
                </p>
                
                <p className="text-xs text-center text-gray-500 mt-4">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
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
              src="/images/auth/chatbot-signup.svg"
              alt="Thinkstore Assist technology illustration" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}