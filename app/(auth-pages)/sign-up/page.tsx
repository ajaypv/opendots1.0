import { FormMessage, Message } from "@/components/form-message";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function SignUp(props: { searchParams: Promise<Message> }) {
  // Check if user is already authenticated
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If already authenticated, redirect to protected page
  if (session) {
    redirect("/protected");
  }

  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Create an account</h1>
      <p className="text-sm text-foreground">
        Already have an account?{" "}
        <Link className="text-foreground font-medium underline" href="/">
          Sign in
        </Link>
      </p>
      <div className="flex flex-col gap-4 mt-8">
        <p className="text-center text-muted-foreground">
          Create an account using your Google account
        </p>
        
        <GoogleAuthButton />
        
        <FormMessage message={searchParams} />
      </div>
    </div>
  );
}
