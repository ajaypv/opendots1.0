# User Onboarding Module

This module implements a user onboarding flow that allows authenticated users to set up their profile information including:

- Display name
- Username (permanent, cannot be changed once set)
- Age
- Gender

## Architecture

The onboarding module is built with several key components:

### Database Structure

- Uses the `user_profiles` table to store onboarding data
- Implements Row Level Security (RLS) to ensure users can only:
  - Read their own profile data
  - Update their profile (except username)
  - Create their profile only once

### Type Definitions

- `OnboardingProfile` - Represents the database record
- `OnboardingFormData` - Represents the form input data

### Components

- `OnboardingForm` - A form component for collecting onboarding data
- `RequireOnboarding` - A utility component to enforce onboarding completion
- `OnboardingDataDisplay` - Displays user profile information

### Server Actions

- `checkUsernameAvailability` - Verifies if a username is available
- `hasCompletedOnboarding` - Checks if a user has completed the onboarding process
- `getUserOnboardingProfile` - Retrieves the current user's profile
- `completeOnboarding` - Creates the initial profile record
- `updateUserProfile` - Updates the profile (except username)

### Pages

- `/onboarding` - The main onboarding page for new users
- `/edit-profile` - Page for updating profile information
- `/protected` - Example of using the onboarding data in a protected page

## Usage

### Checking Onboarding Status

```tsx
import { hasCompletedOnboarding } from "@/app/actions";

// In a server component
const hasCompleted = await hasCompletedOnboarding();

if (!hasCompleted) {
  return redirect("/onboarding");
}
```

### Protecting Content Until Onboarding is Complete

```tsx
import { RequireOnboarding } from "@/app/onboarding/components/OnboardingStatus";

// In a client component
<RequireOnboarding>
  <YourProtectedContent />
</RequireOnboarding>
```

### Displaying User Profile Data

```tsx
import { OnboardingDataDisplay } from "@/app/onboarding/components/OnboardingStatus";

// In a client component
<OnboardingDataDisplay />
```

### Updating User Profile

```tsx
import { updateUserProfile } from "@/app/actions";

// In a client component
const result = await updateUserProfile({
  display_name: "New Name",
  age: 25,
  gender: "non-binary"
});
```

## Extending the Module

To add new fields to the onboarding flow:

1. Update the database schema by creating a new migration
2. Update the type definitions in `user.types.ts` and `database.types.ts`
3. Update the onboarding form component to include the new fields
4. Update the server actions to handle the new fields
5. Update the display components to show the new data

## Security

- All database operations are secured with Row Level Security
- The username is validated both on the client and server sides
- Only authenticated users can access the onboarding pages
- Users cannot change their username once set 