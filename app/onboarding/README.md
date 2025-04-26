# User Onboarding Module

This module implements a user onboarding flow that allows authenticated users to set up their profile information including:

- Display name
- Username (permanent, cannot be changed once set)
- Age
- Gender

## Architecture

The onboarding module is built with several key components:

### Database Structure

- Uses the `user_profiles` table to store onboarding data in both:
  - Cloudflare D1 (primary edge database)
  - Supabase (fallback database)
- Implements Row Level Security (RLS) in Supabase to ensure users can only:
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

- `checkUsernameAvailability` - Verifies if a username is available, checking D1 first
- `hasCompletedOnboarding` - Checks if a user has completed the onboarding process, checking D1 first
- `getUserOnboardingProfile` - Retrieves the current user's profile from D1 with Supabase as fallback
- `completeOnboarding` - Creates the initial profile record in D1 and Supabase
- `updateUserProfile` - Updates the profile (except username) in D1 and Supabase

### Pages

- `/onboarding` - The main onboarding page for new users
- `/edit-profile` - Page for updating profile information
- `/protected` - Example of using the onboarding data in a protected page

## Cloudflare D1 Integration

This module uses Cloudflare D1 as the primary database with Supabase as a fallback:

1. **Edge-First Performance**: Data is stored and accessed at the network edge first
2. **Resilient Architecture**: If D1 operations fail, the system falls back to Supabase
3. **Data Synchronization**: When data is found in only one database, it's synced to the other

### Setup D1 Database

To set up the D1 database:

```bash
# Create the D1 database (only needed once)
pnpm run d1:create

# Run migrations locally for development
pnpm run d1:migrate:local

# Run migrations on the remote D1 database
pnpm run d1:migrate:remote

# Check tables in the local database
pnpm run d1:studio
```

### Cloudflare Worker Configuration

The `wrangler.json` file includes the D1 binding:

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "user_profiles",
      "database_id": "a366753f-39c0-4439-ba78-f5847a0f850e"
    }
  ]
}
```

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

1. Update the database schema by creating a new migration for both D1 and Supabase
2. Update the type definitions in `user.types.ts` and `database.types.ts`
3. Update the D1 client utility in `utils/d1/client.ts`
4. Update the onboarding form component to include the new fields
5. Update the server actions to handle the new fields
6. Update the display components to show the new data

## Error Handling and Fallbacks

- The system attempts operations on D1 first for edge performance
- If D1 operations fail, it falls back to Supabase 
- Data that exists in one database but not the other will be synchronized when possible
- If operations fail in both databases, appropriate error messages are returned

## Security

- All database operations in Supabase are secured with Row Level Security
- The username is validated both on the client and server sides
- Only authenticated users can access the onboarding pages
- Users cannot change their username once set
- D1 operations are performed through server actions only 