import { FormMessage, Message } from "@/components/form-message";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { authProviders } from "@/lib/auth/providers";

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
          Create an account using your preferred provider
        </p>
        
        <div className="space-y-3">
          {Object.values(authProviders).map(provider => (
            <form 
              key={provider.id} 
              action={async () => await provider.signIn()}
              className="w-full"
            >
              <button
                className="flex items-center justify-center w-full px-4 py-2 space-x-2 text-sm border rounded-md"
                style={{
                  backgroundColor: provider.background,
                  color: provider.textColor,
                  borderColor: '#e2e8f0'
                }}
              >
                {provider.icon}
                <span>Continue with {provider.name}</span>
              </button>
            </form>
          ))}
        </div>
        
        <div className="mt-4 text-sm text-center text-muted-foreground">
          After sign-up, you'll be taken to an onboarding page to complete your profile.
        </div>
        
        <FormMessage message={searchParams} />
      </div>
    </div>
  );
}
