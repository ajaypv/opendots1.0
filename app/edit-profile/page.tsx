import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserOnboardingProfile, hasCompletedOnboarding } from "../actions";
import EditProfileForm from "./components/EditProfileForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Edit Your Profile',
  description: 'Update your profile information',
};

export default async function EditProfilePage() {
  const supabase = await createClient();
  
  // Get the session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Redirect to login if no session
  if (!session) {
    return redirect("/auth/login?next=/edit-profile");
  }
  
  // Check if the user has completed onboarding
  const hasCompleted = await hasCompletedOnboarding();
  
  // Redirect to onboarding if not completed
  if (!hasCompleted) {
    return redirect("/onboarding");
  }
  
  // Get the user's profile
  const profile = await getUserOnboardingProfile();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex flex-col items-center justify-center flex-1 p-4 md:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Edit Your Profile</h1>
            <p className="text-gray-600">
              Update your profile information below.
            </p>
          </div>
          
          <EditProfileForm initialProfile={profile} />
        </div>
      </main>
    </div>
  );
} 