'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function UserProfile() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not logged in</div>;
  }

  // Get the user's initials for the avatar fallback
  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  
  // Get avatar from user metadata (if it exists)
  const avatar = user.user_metadata?.avatar_url;
  
  // Get full name from user metadata (if it exists)
  const fullName = user.user_metadata?.full_name;

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
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Last Sign In</p>
          <p className="text-sm text-muted-foreground">
            {new Date(user.last_sign_in_at || '').toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Authentication Method</p>
          <p className="text-sm text-muted-foreground">
            {user.app_metadata?.provider || 'Email'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 