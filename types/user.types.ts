/**
 * Type definitions for Supabase Auth User
 * This provides type safety and documentation for all properties available on the User object
 */

import { Json } from './database.types';

/**
 * Represents the OAuth Provider used for authentication
 */
export type AuthProvider = 
  | 'google' 
  | 'github' 
  | 'linkedin'
  | 'facebook'
  | 'twitter'
  | 'apple'
  | 'azure'
  | 'bitbucket'
  | 'discord'
  | 'gitlab'
  | 'twitch'
  | 'email'
  | 'phone';

/**
 * Represents identity information from OAuth providers
 */
export interface UserIdentity {
  id: string;
  user_id: string;
  identity_data?: {
    email?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    sub?: string;
    provider?: AuthProvider;
    [key: string]: any;
  };
  provider: AuthProvider;
  created_at?: string;
  last_sign_in_at?: string;
  updated_at?: string;
}

/**
 * Application Metadata - controlled by the Supabase system
 */
export interface AppMetadata {
  provider?: AuthProvider;
  [key: string]: any;
}

/**
 * User Metadata - can be updated by the user or application
 */
export interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  name?: string;
  picture?: string;
  email?: string;
  sub?: string;
  location?: string;
  platform?: string;
  browser?: string;
  [key: string]: any;
}

/**
 * Represents a User in the Supabase Auth system
 */
export interface User {
  id: string;
  app_metadata: AppMetadata;
  user_metadata: UserMetadata;
  aud: string;
  confirmation_sent_at?: string;
  confirmed_at?: string;
  created_at: string;
  email?: string;
  email_confirmed_at?: string;
  identities?: UserIdentity[];
  last_sign_in_at?: string;
  phone?: string;
  phone_confirmed_at?: string;
  updated_at?: string;
  role?: string;
  
  // Helper methods from Supabase User class
  // These are documented here, but in practice they're class methods, not properties
  getIdToken?: () => Promise<string | null>;
  getIdTokenClaims?: () => Promise<Record<string, any> | null>;
}

/**
 * Represents a Session in the Supabase Auth system
 */
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
  provider_token?: string;
  provider_refresh_token?: string;
}

/**
 * Utility type to extract User information from Database
 * Use this to map between database profiles and auth users
 */
export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  location: string | null;
  platform: string | null;
  browser: string | null;
  created_at: string;
  updated_at: string;
}; 