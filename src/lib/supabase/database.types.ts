/**
 * Hand-written database types matching the Supabase schema.
 * In production, generate this file automatically with:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
 *
 * Each table MUST include `Relationships: GenericRelationship[]` to satisfy
 * the GenericTable constraint in @supabase/postgrest-js — without it, all
 * Insert/Update types resolve to `never`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export interface Database {
  public: {
    Tables: {
      // ── tenants ──────────────────────────────────────────────────
      tenants: {
        Row: {
          id: string;
          name: string;
          subdomain: string;
          email: string;
          logo_url: string | null;
          plan: 'free' | 'starter' | 'pro' | 'enterprise';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subdomain: string;
          email: string;
          logo_url?: string | null;
          plan?: 'free' | 'starter' | 'pro' | 'enterprise';
          is_active?: boolean;
        };
        Update: {
          name?: string;
          subdomain?: string;
          email?: string;
          logo_url?: string | null;
          plan?: 'free' | 'starter' | 'pro' | 'enterprise';
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };

      // ── tenant_settings ──────────────────────────────────────────
      tenant_settings: {
        Row: {
          id: string;
          tenant_id: string;
          primary_color: string;
          secondary_color: string;
          welcome_message: string | null;
          program_label: string;
          stamp_icon: string;
          terms_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          primary_color?: string;
          secondary_color?: string;
          welcome_message?: string | null;
          program_label?: string;
          stamp_icon?: string;
          terms_url?: string | null;
        };
        Update: {
          primary_color?: string;
          secondary_color?: string;
          welcome_message?: string | null;
          program_label?: string;
          stamp_icon?: string;
          terms_url?: string | null;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };

      // ── reward_programs ──────────────────────────────────────────
      reward_programs: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          type: 'points' | 'stamp' | 'visit' | 'cashback';
          status: 'draft' | 'active' | 'paused' | 'archived';
          config: Json;
          max_enrollments: number | null;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          type?: 'points' | 'stamp' | 'visit' | 'cashback';
          status?: 'draft' | 'active' | 'paused' | 'archived';
          config?: Json;
          max_enrollments?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          type?: 'points' | 'stamp' | 'visit' | 'cashback';
          status?: 'draft' | 'active' | 'paused' | 'archived';
          config?: Json;
          max_enrollments?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };

      // ── rewards ───────────────────────────────────────────────────
      rewards: {
        Row: {
          id: string;
          tenant_id: string;
          program_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          cost_points: number;
          stock: number | null;
          redeemed_count: number;
          is_active: boolean;
          expiry_days: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          program_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          cost_points: number;
          stock?: number | null;
          redeemed_count?: number;
          is_active?: boolean;
          expiry_days?: number | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          image_url?: string | null;
          cost_points?: number;
          stock?: number | null;
          is_active?: boolean;
          expiry_days?: number | null;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };

      // ── customers ─────────────────────────────────────────────────
      customers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          phone: string | null;
          access_code: string;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          phone?: string | null;
          access_code: string;
          is_active?: boolean;
          notes?: string | null;
        };
        Update: {
          name?: string;
          phone?: string | null;
          is_active?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };

      // ── customer_program_enrollments ──────────────────────────────
      customer_program_enrollments: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string;
          program_id: string;
          current_points: number;
          lifetime_points: number;
          stamp_count: number;
          visit_count: number;
          enrolled_at: string;
          last_activity_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          program_id: string;
          current_points?: number;
          lifetime_points?: number;
          stamp_count?: number;
          visit_count?: number;
          enrolled_at?: string;
          last_activity_at?: string;
        };
        Update: {
          current_points?: number;
          lifetime_points?: number;
          stamp_count?: number;
          visit_count?: number;
          last_activity_at?: string;
        };
        Relationships: GenericRelationship[];
      };

      // ── transactions ──────────────────────────────────────────────
      transactions: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string;
          program_id: string;
          enrollment_id: string;
          reward_id: string | null;
          type: 'earn' | 'redeem' | 'expire' | 'adjustment' | 'refund';
          points_delta: number;
          balance_after: number;
          note: string | null;
          staff_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          program_id: string;
          enrollment_id: string;
          reward_id?: string | null;
          type: 'earn' | 'redeem' | 'expire' | 'adjustment' | 'refund';
          points_delta: number;
          balance_after: number;
          note?: string | null;
          staff_id?: string | null;
        };
        Update: Record<string, never>; // immutable
        Relationships: GenericRelationship[];
      };

      // ── customer_reward_redemptions ───────────────────────────────
      customer_reward_redemptions: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string;
          reward_id: string;
          transaction_id: string;
          status: 'pending' | 'used' | 'expired' | 'cancelled';
          redemption_code: string;
          expires_at: string | null;
          used_at: string | null;
          cancelled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          reward_id: string;
          transaction_id: string;
          status?: 'pending' | 'used' | 'expired' | 'cancelled';
          redemption_code: string;
          expires_at?: string | null;
          used_at?: string | null;
          cancelled_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'used' | 'expired' | 'cancelled';
          used_at?: string | null;
          cancelled_at?: string | null;
          expires_at?: string | null;
        };
        Relationships: GenericRelationship[];
      };

      // ── audit_events ─────────────────────────────────────────────
      audit_events: {
        Row: {
          id: string;
          tenant_id: string;
          actor_id: string | null;
          actor_email: string | null;
          event_type: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json;
          ip_address: string | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_id?: string | null;
          actor_email?: string | null;
          event_type: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>; // immutable
        Relationships: GenericRelationship[];
      };

      // ── waitlist ──────────────────────────────────────────────────
      waitlist: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          business_name: string | null;
          source: string;
          ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          business_name?: string | null;
          source?: string;
          ip?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string | null;
          business_name?: string | null;
          source?: string;
        };
        Relationships: GenericRelationship[];
      };
    };

    Views: Record<string, never>;
    Functions: {
      rpc_earn_points: {
        Args: {
          p_tenant_id:    string;
          p_customer_id:  string;
          p_program_id:   string;
          p_points_delta: number;
          p_note?:        string | null;
          p_staff_id?:    string | null;
        };
        Returns: Json;
      };
      rpc_redeem_reward: {
        Args: {
          p_tenant_id:     string;
          p_customer_id:   string;
          p_reward_id:     string;
          p_enrollment_id: string;
          p_note?:         string | null;
        };
        Returns: Json;
      };
      rpc_mark_redemption_used: {
        Args: {
          p_tenant_id:       string;
          p_redemption_code: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      tenant_plan: 'free' | 'starter' | 'pro' | 'enterprise';
      program_type: 'points' | 'stamp' | 'visit' | 'cashback';
      program_status: 'draft' | 'active' | 'paused' | 'archived';
      transaction_type: 'earn' | 'redeem' | 'expire' | 'adjustment' | 'refund';
      redemption_status: 'pending' | 'used' | 'expired' | 'cancelled';
    };
  };
}
