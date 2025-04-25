import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { Database } from "@/types/database.types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!hasEnvVars) {
    return (
      <div className="flex gap-4 items-center">
        <div>
          <Badge
            variant={"default"}
            className="font-normal pointer-events-none"
          >
            Please update .env.local file with anon key and url
          </Badge>
        </div>
        <div>
          <Button
            asChild
            size="sm"
            variant={"outline"}
            disabled
            className="opacity-75 cursor-none pointer-events-none"
          >
            <Link href="/">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return user ? (
    <div className="flex items-center gap-4">
      <div className="flex items-center space-x-2">
        <Avatar>
          <AvatarImage src={user.user_metadata?.avatar_url || undefined} alt={user.email || 'User'} />
          <AvatarFallback>{user.email?.substring(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
        </Avatar>
        <span className="text-sm">
          {user.user_metadata?.full_name || user.email}
        </span>
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant={"outline"}>
          Sign out
        </Button>
      </form>
    </div>
  ) : (
    <div>
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/">Sign in</Link>
      </Button>
    </div>
  );
}
