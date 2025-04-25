import { GoogleAuthButton } from "@/components/google-auth-button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { FormMessage, Message } from "@/components/form-message";
import { use } from 'react';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string; message?: string; type?: string }>;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If already authenticated, redirect to protected page
  if (session) {
    redirect("/protected");
  }

  // Await searchParams
  const resolvedParams = await searchParams;

  // Create Message object from URL params if present
  let message: Message | null = null;
  if (resolvedParams.message && resolvedParams.type === 'success') {
    message = { success: resolvedParams.message };
  } else if (resolvedParams.message && resolvedParams.type === 'error') {
    message = { error: resolvedParams.message };
  } else if (resolvedParams.message) {
    message = { message: resolvedParams.message };
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
      <div className="w-full p-8 bg-card border rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold mb-6 text-center">Welcome</h1>
        
        {resolvedParams.auth === "required" && (
          <div className="mb-6 p-4 bg-amber-100 text-amber-800 rounded-md">
            You need to sign in to access this page
          </div>
        )}
        
        <div className="flex flex-col gap-4">
          <p className="text-center text-muted-foreground mb-4">
            Sign in with your Google account to continue
          </p>
          
          <GoogleAuthButton />
          
          {message && <FormMessage message={message} />}
        </div>
      </div>
    </div>
  );
}
