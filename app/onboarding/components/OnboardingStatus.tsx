'use client';

import { useRouter } from 'next/navigation';
import { OnboardingProfile } from '@/types/user.types';
import { useEffect, useState } from 'react';
import { getUserOnboardingProfile } from '@/app/actions';

// Component that redirects to onboarding if not completed
export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);
  
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const profile = await getUserOnboardingProfile();
        if (!profile) {
          router.push('/onboarding');
        } else {
          setHasCompleted(true);
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
        router.push('/onboarding');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOnboarding();
  }, [router]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return hasCompleted ? <>{children}</> : null;
}

// Component that displays username and other onboarding data
export function OnboardingDataDisplay() {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserOnboardingProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 h-16 rounded w-full"></div>
    );
  }
  
  if (!profile) {
    return (
      <div className="text-red-500">
        Profile not found. Please complete onboarding.
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="font-medium">Username: <span className="font-normal">@{profile.username}</span></div>
      <div className="font-medium">Display Name: <span className="font-normal">{profile.display_name}</span></div>
      {profile.age && (
        <div className="font-medium">Age: <span className="font-normal">{profile.age}</span></div>
      )}
      {profile.gender && (
        <div className="font-medium">Gender: <span className="font-normal">{profile.gender}</span></div>
      )}
    </div>
  );
} 