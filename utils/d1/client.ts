import { OnboardingProfile } from "@/types/user.types";

// Check if we're in a Cloudflare Worker environment
export const isCloudflareWorker = () => {
  return typeof globalThis.DB !== 'undefined';
};

// Helper functions for D1 database operations
export const d1Client = {
  // Check if username exists in D1
  async isUsernameAvailable(username: string): Promise<boolean> {
    if (!isCloudflareWorker()) return false; // When not in Worker environment, default to unavailable for safety

    try {
      const stmt = globalThis.DB.prepare(
        'SELECT id FROM user_profiles WHERE username = ?'
      );
      const result = await stmt.bind(username).first<{ id: string }>();
      return !result;
    } catch (error) {
      console.error('D1 error checking username:', error);
      return false; // Default to unavailable if there's an error
    }
  },

  // Get user profile from D1
  async getUserProfile(userId: string): Promise<OnboardingProfile | null> {
    if (!isCloudflareWorker()) return null;

    try {
      const stmt = globalThis.DB.prepare(
        'SELECT * FROM user_profiles WHERE user_id = ?'
      );
      const result = await stmt.bind(userId).first<any>();
      
      if (!result) return null;
      
      return {
        id: result.id,
        user_id: result.user_id,
        username: result.username,
        display_name: result.display_name,
        age: result.age ? Number(result.age) : null,
        gender: result.gender,
        created_at: result.created_at,
        updated_at: result.updated_at
      };
    } catch (error) {
      console.error('D1 error getting user profile:', error);
      return null;
    }
  },

  // Create user profile in D1
  async createUserProfile(profile: {
    id: string;
    user_id: string;
    username: string;
    display_name: string;
    age: number | null;
    gender: string | null;
  }): Promise<{success: boolean, error?: string}> {
    if (!isCloudflareWorker()) return {success: false, error: 'D1 database not available'};

    try {
      const now = new Date().toISOString();
      
      const stmt = globalThis.DB.prepare(`
        INSERT INTO user_profiles (id, user_id, username, display_name, age, gender, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      await stmt.bind(
        profile.id,
        profile.user_id,
        profile.username,
        profile.display_name,
        profile.age,
        profile.gender,
        now,
        now
      ).run();
      
      return {success: true};
    } catch (error) {
      console.error('D1 error creating user profile:', error);
      return {
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown D1 error creating profile'
      };
    }
  },

  // Update user profile in D1
  async updateUserProfile(userId: string, updates: {
    display_name?: string;
    age?: number | null;
    gender?: string | null;
  }): Promise<{success: boolean, error?: string}> {
    if (!isCloudflareWorker()) return {success: false, error: 'D1 database not available'};

    try {
      const now = new Date().toISOString();
      
      // Build the update SQL dynamically based on what fields are provided
      let sql = 'UPDATE user_profiles SET updated_at = ?';
      const params: any[] = [now];
      
      if (updates.display_name !== undefined) {
        sql += ', display_name = ?';
        params.push(updates.display_name);
      }
      
      if (updates.age !== undefined) {
        sql += ', age = ?';
        params.push(updates.age);
      }
      
      if (updates.gender !== undefined) {
        sql += ', gender = ?';
        params.push(updates.gender);
      }
      
      sql += ' WHERE user_id = ?';
      params.push(userId);
      
      const stmt = globalThis.DB.prepare(sql);
      await stmt.bind(...params).run();
      
      return {success: true};
    } catch (error) {
      console.error('D1 error updating user profile:', error);
      return {
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown D1 error updating profile'
      };
    }
  }
};

// Add D1 type definitions for TypeScript
declare global {
  var DB: D1Database;
}

// D1Database type for TypeScript
interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
  dump: () => Promise<ArrayBuffer>;
  batch: (statements: D1PreparedStatement[]) => Promise<D1Result[]>;
  exec: (query: string) => Promise<D1Result>;
}

interface D1PreparedStatement {
  bind: (...values: any[]) => D1PreparedStatement;
  first: <T = any>(colName?: string) => Promise<T | null>;
  run: <T = any>() => Promise<D1Result<T>>;
  all: <T = any>() => Promise<D1Result<T>>;
  raw: <T = any>() => Promise<T[]>;
}

interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: object;
} 