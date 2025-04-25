'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";
import { providers, AuthProvider } from "@/lib/auth/providers";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);

  const handleSignIn = async (
    providerId: string,
    authFunction: (userInfo?: { platform?: string; browser?: string; location?: string }) => Promise<any>
  ) => {
    try {
      setIsLoading(true);
      setActiveProviderId(providerId);
      
      // You could get geolocation here with user consent
      // For now, we'll just pass browser detection
      await authFunction({
        browser: navigator.userAgent.includes('Chrome') 
          ? 'Chrome' 
          : navigator.userAgent.includes('Firefox') 
          ? 'Firefox' 
          : navigator.userAgent.includes('Safari') 
          ? 'Safari' 
          : 'Other',
        platform: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
          ? 'Mobile' 
          : 'Desktop'
      });
    } catch (error) {
      console.error("Error during sign in:", error);
      setIsLoading(false);
      setActiveProviderId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Choose your preferred sign in method
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {providers.map((provider: AuthProvider) => (
              <Button
                key={provider.id}
                variant="outline"
                className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
                onClick={() => handleSignIn(provider.id, provider.signIn)}
                disabled={isLoading}
              >
                {provider.icon}
                {isLoading && activeProviderId === provider.id 
                  ? 'Loading...' 
                  : `Sign in with ${provider.name}`}
              </Button>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-500">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 