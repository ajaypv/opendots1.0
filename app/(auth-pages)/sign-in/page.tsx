import { FormMessage, Message } from "@/components/form-message";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authProviders } from "@/lib/auth/providers";

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
          Sign in with your preferred provider
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
        
        <FormMessage message={searchParams} />
      </div>
    </div>
  );
}
