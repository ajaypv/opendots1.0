import { FormMessage, Message } from "@/components/form-message";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  // Check if user is already authenticated
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If already authenticated, redirect to protected page
  if (session) {
    redirect("/protected");
  }
  
  const searchParams = await props.searchParams;
  
  return (
    <div className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <p className="text-sm text-foreground">
        Don't have an account?{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          Sign up
        </Link>
      </p>
      <div className="flex flex-col gap-4 mt-8">
        <p className="text-center text-muted-foreground">
          Sign in with your Google account
        </p>
        
        <GoogleAuthButton />
        
        <FormMessage message={searchParams} />
      </div>
    </div>
  );
}
