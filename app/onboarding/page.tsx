import { Metadata } from 'next';
import OnboardingForm from './components/OnboardingForm';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'Complete Your Profile',
  description: 'Set up your profile to get started with our platform',
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return (
    <>
      <OnboardingForm />
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>
          By completing your profile, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </>
  );
} 