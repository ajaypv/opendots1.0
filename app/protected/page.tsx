import { UserProfile } from "@/components/user-profile";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Protected Page</h1>
      <p className="text-center mb-8">
        This page is protected and only accessible to authenticated users.
      </p>
      <UserProfile />
    </div>
  );
}
