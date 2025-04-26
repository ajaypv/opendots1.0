'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Function to refresh user data
  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error refreshing session:', sessionError);
        return;
      }
      
      if (sessionData?.session) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error refreshing user:', userError);
          return;
        }
        
        setSession(sessionData.session);
        setUser(userData.user);
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to refresh auth:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state when component mounts
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Force a refresh of the session to ensure it's current
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          return;
        }
        
        if (sessionData?.session) {
          // If we have a valid session, get the user
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error fetching user:', userError);
            return;
          }
          
          setSession(sessionData.session);
          setUser(userData.user);
        } else {
          // Clear state if no session found
          setSession(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, pathname]);

  // Refresh the user data when the pathname changes to ensure up-to-date auth state
  useEffect(() => {
    if (pathname === '/protected') {
      refreshUser();
    }
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 