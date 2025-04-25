export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          provider: string | null
          location: string | null
          platform: string | null
          browser: string | null
          username: string | null
          age: number | null
          gender: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          provider?: string | null
          location?: string | null
          platform?: string | null
          browser?: string | null
          username?: string | null
          age?: number | null
          gender?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          provider?: string | null
          location?: string | null
          platform?: string | null
          browser?: string | null
          username?: string | null
          age?: number | null
          gender?: string | null
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_profile_metadata: {
        Args: {
          user_id: string;
          p_platform?: string;
          p_browser?: string;
          p_location?: string;
        };
        Returns: boolean;
      };
      populate_missing_profiles: {
        Args: Record<string, never>;
        Returns: void;
      };
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'] 