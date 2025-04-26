'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface UserProfileProps {
  serverUser?: User | null;
}

export function UserProfile({ serverUser }: UserProfileProps) {
  const { user, isLoading, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fallbackUser, setFallbackUser] = useState<User | null>(null);
  
  // Effect to attempt auth synchronization on component mount
  useEffect(() => {
    if (!serverUser && !user && !isLoading) {
      refreshUser();
    }
  }, [serverUser, user, isLoading, refreshUser]);
  
  // Fallback mechanism to ensure we have user data
  useEffect(() => {
    // Skip if we already have server user data or client-side user data
    if (serverUser || user || isLoading) return;
    
    const fetchUserDirectly = async () => {
      try {
        setIsRefreshing(true);
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();
        
        if (!error && data.user) {
          setFallbackUser(data.user);
        }
      } catch (err) {
        console.error('Error fetching user directly:', err);
      } finally {
        setIsRefreshing(false);
      }
    };
    
    fetchUserDirectly();
  }, [user, isLoading, serverUser]);

  if (isLoading || isRefreshing) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Loading profile...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-pulse h-20 w-20 bg-gray-200 rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prioritize sources: serverUser (from server-side) > user (from context) > fallbackUser (from client fetch)
  const currentUser = serverUser || user || fallbackUser;

  if (!currentUser) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Unable to retrieve user profile. Please try refreshing the page or sign in again.</p>
          <button 
            onClick={() => refreshUser()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Refresh Authentication
          </button>
        </CardContent>
      </Card>
    );
  }

  // Get the user's initials for the avatar fallback
  const initials = currentUser.email ? currentUser.email.substring(0, 2).toUpperCase() : 'U';
  
  // Get avatar from user metadata (if it exists)
  const avatar = currentUser.user_metadata?.avatar_url;
  
  // Get full name from user metadata (if it exists)
  const fullName = currentUser.user_metadata?.full_name;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatar} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {fullName && (
          <div>
            <p className="text-sm font-medium">Full Name</p>
            <p className="text-sm text-muted-foreground">{fullName}</p>
          </div>
        )}
        <div>
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Last Sign In</p>
          <p className="text-sm text-muted-foreground">
            {new Date(currentUser.last_sign_in_at || '').toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Authentication Method</p>
          <p className="text-sm text-muted-foreground">
            {currentUser.app_metadata?.provider || 'Email'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 