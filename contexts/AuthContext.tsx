'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isOnboarded: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isOnboarded: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Check if user is onboarded by checking the profile data
  const checkOnboardingStatus = async (userId: string) => {
    try {
      // Check user metadata first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.user_metadata?.onboarded === true) {
        setIsOnboarded(true);
        return;
      }
      
      // If not in metadata, check the profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', userId)
        .single();
        
      if (!error && profile && profile.username && profile.full_name) {
        setIsOnboarded(true);
        
        // Update user metadata for future quick checks
        await supabase.auth.updateUser({
          data: { onboarded: true }
        });
      } else {
        setIsOnboarded(false);
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err);
      setIsOnboarded(false);
    }
  };

  useEffect(() => {
    // Get session from supabase
    const getSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
          setSession(null);
          setUser(null);
          setIsOnboarded(false);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Check if user has completed onboarding
          if (session?.user) {
            await checkOnboardingStatus(session.user.id);
          } else {
            setIsOnboarded(false);
          }
        }
      } catch (err) {
        console.error('Failed to get session:', err);
        setSession(null);
        setUser(null);
        setIsOnboarded(false);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check onboarding status on auth changes
        if (session?.user) {
          await checkOnboardingStatus(session.user.id);
        } else {
          setIsOnboarded(false);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  // Redirect to onboarding page if authenticated but not onboarded
  useEffect(() => {
    if (!isLoading && user && !isOnboarded && 
        pathname !== '/onboarding' && 
        !pathname.startsWith('/auth')) {
      router.push('/onboarding');
    }
  }, [user, isOnboarded, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isOnboarded }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 