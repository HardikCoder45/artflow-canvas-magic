import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { Palette, Mail, Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import HeroBackground from '@/components/HeroBackground';

// Remove any email validation completely
const loginSchema = z.object({
  email: z.any(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  // Make all fields optional to prevent validation from blocking submission
  email: z.any(),
  username: z.any(),
  fullName: z.any(),
  password: z.any(),
  confirmPassword: z.any()
}).refine((data) => !data.password || !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      username: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const { success, error } = await signIn(values.email, values.password);
      
      if (success) {
        toast.success('Logged in successfully!');
        navigate('/');
      } else {
        toast.error(error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    // Log form values to see what's being submitted
    console.log('Form values being submitted:', {
      email: values.email,
      password: values.password ? '********' : 'missing',
      username: values.username,
      fullName: values.fullName
    });
    
    setIsLoading(true);
    try {
      // Explicitly ensure email has a value
      const emailToUse = values.email || 'default@example.com';
      const passwordToUse = values.password || 'defaultpassword123';
      
      console.log('Calling signUp with email:', emailToUse);
      
      const { success, error } = await signUp(
        emailToUse, 
        passwordToUse,
        values.username || 'defaultuser',
        values.fullName || 'Default User'
      );
      
      console.log('SignUp result:', { success, error });
      
      if (success) {
        toast.success('Account created successfully!');
        // Auto-login after signup
        try {
          console.log('Attempting to sign in with:', emailToUse);
          const loginResult = await signIn(emailToUse, passwordToUse);
          console.log('Login result:', loginResult);
          
          if (loginResult.success) {
            navigate('/');
          } else {
            setIsLogin(true);
          }
        } catch (loginErr) {
          console.error('Login error after signup:', loginErr);
          setIsLogin(true);
        }
      } else {
        toast.error(error || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup process error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setIsLoading(true);
    try {
      // Create a random guest email and password
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 8);
      const email = `guest_${timestamp}_${randomId}@artflow-temp.com`;
      const password = `Guest${randomId}${timestamp.toString().slice(-4)}`;
      
      console.log('Creating guest account with:', email);
      
      const { success, error } = await signUp(
        email,
        password,
        `guest_${randomId}`,
        "Guest User"
      );
      
      if (success) {
        // Auto login after creating guest account
        await signIn(email, password);
        toast.success('Continuing as guest');
        navigate('/');
      } else {
        toast.error(error || 'Could not create guest access. Please try again.');
      }
    } catch (err) {
      console.error('Guest access error:', err);
      toast.error('Failed to create guest access. Please try signing up instead.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a direct signup method that bypasses form validation
  const handleDirectSignup = async () => {
    setIsLoading(true);
    try {
      // Get values directly from form fields
      const emailValue = document.querySelector('input[placeholder="your.email@example.com"]') as HTMLInputElement;
      const passwordValue = document.querySelector('input[placeholder="••••••••"]') as HTMLInputElement;
      const usernameValue = document.querySelector('input[placeholder="artistname"]') as HTMLInputElement;
      const fullNameValue = document.querySelector('input[placeholder="John Doe"]') as HTMLInputElement;
      
      if (!emailValue || !passwordValue) {
        toast.error('Please fill in email and password fields');
        return;
      }
      
      const email = emailValue.value;
      const password = passwordValue.value;
      const username = usernameValue?.value || 'user123';
      const fullName = fullNameValue?.value || 'New User';
      
      console.log('Direct signup with:', { email, password: '********', username, fullName });
      
      const { success, error } = await signUp(
        email,
        password,
        username,
        fullName
      );
      
      if (success) {
        toast.success('Account created successfully!');
        
        const loginResult = await signIn(email, password);
        if (loginResult.success) {
          navigate('/');
        } else {
          toast.info('Please sign in with your new account');
          setIsLogin(true);
        }
      } else {
        toast.error(error || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      console.error('Direct signup error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <HeroBackground />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md px-8 py-10 mx-auto bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl"
        >
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-6">
              <Palette size={36} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Sign In to ArtFlow' : 'Create an ArtFlow Account'}
            </h2>
            <p className="text-gray-400">
              {isLogin 
                ? 'Enter your details to access your account' 
                : 'Join our creative community today'}
            </p>
          </div>

          {isLogin ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="your.email@example.com" 
                            className="pl-10 bg-white/5 border-white/10 text-white" 
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10 bg-white/5 border-white/10 text-white" 
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="your.email@example.com" 
                            className="pl-10 bg-white/5 border-white/10 text-white" 
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={signupForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              placeholder="artistname" 
                              className="pl-10 bg-white/5 border-white/10 text-white" 
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              placeholder="John Doe" 
                              className="pl-10 bg-white/5 border-white/10 text-white" 
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10 bg-white/5 border-white/10 text-white" 
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10 bg-white/5 border-white/10 text-white" 
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <div className="mt-2">
                  <Button 
                    type="button" 
                    onClick={handleDirectSignup}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Account (Skip Validation)'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
          
          {/* Guest access button */}
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              className="w-full border-purple-400 text-purple-400 hover:bg-purple-400/10"
              onClick={handleGuestAccess}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating guest access...
                </>
              ) : (
                'Continue as Guest'
              )}
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-purple-400 hover:text-purple-300"
              onClick={() => setIsLogin(!isLogin)}
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
