import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { RequireOnboarding, OnboardingDataDisplay } from "../onboarding/components/OnboardingStatus";
import Link from "next/link";

export default async function ProtectedPage() {
  const supabase = await createClient();
  
  // Get the session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Redirect to login if no session
  if (!session) {
    return redirect("/auth/login?next=/protected");
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">
          Welcome to Your Dashboard
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Profile</h2>
            <Link 
              href="/edit-profile" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Edit Profile
            </Link>
          </div>
          <RequireOnboarding>
            <OnboardingDataDisplay />
          </RequireOnboarding>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Protected Content</h2>
          <p>This content is only visible after completing onboarding.</p>
        </div>
      </main>
    </div>
  );
}
