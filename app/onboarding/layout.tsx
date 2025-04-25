import { PropsWithChildren } from "react";

export const metadata = {
  title: "Complete Your Profile | OpenDots",
  description: "Complete your profile with additional information to get started",
};

export default function OnboardingLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 