import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST to avoid missing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error.message);
        return { success: false, error: error.message };
      }
      
      console.log('Sign in successful:', data.user?.email);
      return { success: true };
    } catch (error: any) {
      console.error('Exception during sign in:', error);
      return { success: false, error: error.message || 'Failed to sign in' };
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    console.log('useAuth.signUp called with:', { 
      email, 
      passwordLength: password?.length || 0,
      username, 
      fullName 
    });
    
    try {
      // Make sure we have valid inputs
      if (!email) {
        console.error('Email is missing or empty');
        return { success: false, error: 'Email is required' };
      }
      
      if (!password || password.length < 6) {
        console.error('Password is missing or too short');
        return { success: false, error: 'Password must be at least 6 characters' };
      }
      
      // Simplify the signup process - just basic auth
      console.log('Calling supabase.auth.signUp with:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      // Log response for debugging
      console.log('Supabase signUp response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        error: error?.message
      });

      if (error) {
        console.error('Supabase signup error:', error);
        return { success: false, error: error.message };
      }
      
      if (data?.user) {
        console.log('User created successfully, id:', data.user.id);
        return { success: true };
      } else {
        console.warn('Signup completed but no user object returned');
        return { success: true, error: 'Account created, please sign in' };
      }
    } catch (error: any) {
      console.error('Exception during signup process:', error);
      return { 
        success: false, 
        error: `Signup failed: ${error?.message || 'Unknown error'}` 
      };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
