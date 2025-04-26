import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { hasCompletedOnboarding } from "../actions";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Get the session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Redirect to login if no session
  if (!session) {
    return redirect("/auth/login?next=/onboarding");
  }
  
  // Check if the user has already completed onboarding
  const hasCompleted = await hasCompletedOnboarding();
  
  // Redirect to home if onboarding is already completed
  if (hasCompleted) {
    return redirect("/");
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex flex-col items-center justify-center flex-1 p-4 md:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Complete Your Profile</h1>
            <p className="text-gray-600">
              We need a bit more information to personalize your experience.
            </p>
          </div>
          
          {children}
        </div>
      </main>
    </div>
  );
} 