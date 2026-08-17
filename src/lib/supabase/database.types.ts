export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id: string
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_reward_log: {
        Row: {
          customer_id: string
          id: string
          sent_at: string
          tenant_id: string
          year: number
        }
        Insert: {
          customer_id: string
          id?: string
          sent_at?: string
          tenant_id: string
          year: number
        }
        Update: {
          customer_id?: string
          id?: string
          sent_at?: string
          tenant_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "birthday_reward_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_reward_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          bonus_points: number
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          program_id: string
          starts_at: string | null
          target: number
          tenant_id: string
          title: string
        }
        Insert: {
          bonus_points?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          program_id: string
          starts_at?: string | null
          target: number
          tenant_id: string
          title: string
        }
        Update: {
          bonus_points?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          program_id?: string
          starts_at?: string | null
          target?: number
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "reward_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_bonus_credits: {
        Row: {
          bonus_type: string
          claimed_at: string | null
          claimed_program_id: string | null
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          tenant_id: string
          units: number
        }
        Insert: {
          bonus_type: string
          claimed_at?: string | null
          claimed_program_id?: string | null
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          tenant_id: string
          units: number
        }
        Update: {
          bonus_type?: string
          claimed_at?: string | null
          claimed_program_id?: string | null
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          tenant_id?: string
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_bonus_credits_claimed_program_id_fkey"
            columns: ["claimed_program_id"]
            isOneToOne: false
            referencedRelation: "reward_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_bonus_credits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_bonus_credits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          customer_id: string
          id: string
          progress: number
          tenant_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          progress?: number
          tenant_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          progress?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_challenge_progress_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_challenge_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_program_enrollments: {
        Row: {
          current_points: number
          customer_id: string
          enrolled_at: string
          id: string
          last_activity_at: string
          lifetime_points: number
          program_id: string
          stamp_count: number
          tenant_id: string
          tier_color: string | null
          tier_label: string | null
          visit_count: number
        }
        Insert: {
          current_points?: number
          customer_id: string
          enrolled_at?: string
          id?: string
          last_activity_at?: string
          lifetime_points?: number
          program_id: string
          stamp_count?: number
          tenant_id: string
          tier_color?: string | null
          tier_label?: string | null
          visit_count?: number
        }
        Update: {
          current_points?: number
          customer_id?: string
          enrolled_at?: string
          id?: string
          last_activity_at?: string
          lifetime_points?: number
          program_id?: string
          stamp_count?: number
          tenant_id?: string
          tier_color?: string | null
          tier_label?: string | null
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_program_enrollments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "reward_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_program_enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_reward_redemptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          customer_id: string
          expires_at: string | null
          id: string
          redemption_code: string
          reward_id: string
          status: Database["public"]["Enums"]["redemption_status"]
          tenant_id: string
          transaction_id: string
          used_at: string | null
          whatsapp_expiry_notified_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          redemption_code: string
          reward_id: string
          status?: Database["public"]["Enums"]["redemption_status"]
          tenant_id: string
          transaction_id: string
          used_at?: string | null
          whatsapp_expiry_notified_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          redemption_code?: string
          reward_id?: string
          status?: Database["public"]["Enums"]["redemption_status"]
          tenant_id?: string
          transaction_id?: string
          used_at?: string | null
          whatsapp_expiry_notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_reward_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reward_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reward_redemptions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          access_code: string
          birth_day: number | null
          birth_month: number | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          loyalty_score: number
          name: string
          notes: string | null
          phone: string | null
          referral_code: string
          tenant_id: string
          tier_color: string | null
          tier_label: string | null
          updated_at: string
          whatsapp_opt_in: boolean
          whatsapp_opted_in_at: string | null
        }
        Insert: {
          access_code: string
          birth_day?: number | null
          birth_month?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          loyalty_score?: number
          name: string
          notes?: string | null
          phone?: string | null
          referral_code: string
          tenant_id: string
          tier_color?: string | null
          tier_label?: string | null
          updated_at?: string
          whatsapp_opt_in?: boolean
          whatsapp_opted_in_at?: string | null
        }
        Update: {
          access_code?: string
          birth_day?: number | null
          birth_month?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          loyalty_score?: number
          name?: string
          notes?: string | null
          phone?: string | null
          referral_code?: string
          tenant_id?: string
          tier_color?: string | null
          tier_label?: string | null
          updated_at?: string
          whatsapp_opt_in?: boolean
          whatsapp_opted_in_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          program_id: string | null
          referred_id: string
          referrer_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          program_id?: string | null
          referred_id: string
          referrer_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          program_id?: string | null
          referred_id?: string
          referrer_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "reward_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_programs: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          max_enrollments: number | null
          name: string
          starts_at: string | null
          status: Database["public"]["Enums"]["program_status"]
          tenant_id: string
          type: Database["public"]["Enums"]["program_type"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          max_enrollments?: number | null
          name: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          tenant_id: string
          type?: Database["public"]["Enums"]["program_type"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          max_enrollments?: number | null
          name?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["program_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_programs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          cost_points: number
          created_at: string
          description: string | null
          expiry_days: number | null
          min_tier_score: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          program_id: string
          redeemed_count: number
          stock: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cost_points: number
          created_at?: string
          description?: string | null
          expiry_days?: number | null
          min_tier_score?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          program_id: string
          redeemed_count?: number
          stock?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cost_points?: number
          created_at?: string
          description?: string | null
          expiry_days?: number | null
          min_tier_score?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          program_id?: string
          redeemed_count?: number
          stock?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "reward_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          message: string
          replied_at: string | null
          status: string
          subject: string
          tenant_id: string
          tenant_name: string
          updated_at: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message: string
          replied_at?: string | null
          status?: string
          subject: string
          tenant_id: string
          tenant_name?: string
          updated_at?: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message?: string
          replied_at?: string | null
          status?: string
          subject?: string
          tenant_id?: string
          tenant_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          birthday_bonus_expiry_days: number
          birthday_bonus_points: number
          birthday_bonus_stamps: number
          birthday_bonus_visits: number
          created_at: string
          currency: string
          id: string
          logo_padding: number
          notify_new_customer: boolean
          notify_redemption: boolean
          notify_weekly_digest: boolean
          phone_prefix: string | null
          primary_color: string
          program_label: string
          reactivation_bonus_expiry_days: number
          reactivation_bonus_points: number
          reactivation_bonus_stamps: number
          reactivation_bonus_visits: number
          referral_enabled: boolean
          referral_program_configs: Json
          secondary_color: string
          stamp_icon: string
          tenant_id: string
          terms_url: string | null
          tier_score_per_cashback_cent: number
          tier_score_per_point: number
          tier_score_per_stamp: number
          tier_score_per_visit: number
          tiers: Json
          tiers_enabled: boolean
          tier_window_months: number | null
          tier_grandfather_until: string | null
          timezone: string
          updated_at: string
          wa_notify_balance_reminder: boolean
          wa_notify_birthday: boolean
          wa_notify_milestone_80: boolean
          wa_notify_promotion: boolean
          wa_notify_reactivation: boolean
          wa_notify_streak_at_risk: boolean
          wa_notify_voucher_expiry: boolean
          wa_notify_welcome: boolean
          welcome_message: string | null
        }
        Insert: {
          birthday_bonus_expiry_days?: number
          birthday_bonus_points?: number
          birthday_bonus_stamps?: number
          birthday_bonus_visits?: number
          created_at?: string
          currency?: string
          id?: string
          logo_padding?: number
          notify_new_customer?: boolean
          notify_redemption?: boolean
          notify_weekly_digest?: boolean
          phone_prefix?: string | null
          primary_color?: string
          program_label?: string
          reactivation_bonus_expiry_days?: number
          reactivation_bonus_points?: number
          reactivation_bonus_stamps?: number
          reactivation_bonus_visits?: number
          referral_enabled?: boolean
          referral_program_configs?: Json
          secondary_color?: string
          stamp_icon?: string
          tenant_id: string
          terms_url?: string | null
          tier_score_per_cashback_cent?: number
          tier_score_per_point?: number
          tier_score_per_stamp?: number
          tier_score_per_visit?: number
          tiers?: Json
          tiers_enabled?: boolean
          tier_window_months?: number | null
          tier_grandfather_until?: string | null
          timezone?: string
          updated_at?: string
          wa_notify_balance_reminder?: boolean
          wa_notify_birthday?: boolean
          wa_notify_milestone_80?: boolean
          wa_notify_promotion?: boolean
          wa_notify_reactivation?: boolean
          wa_notify_streak_at_risk?: boolean
          wa_notify_voucher_expiry?: boolean
          wa_notify_welcome?: boolean
          welcome_message?: string | null
        }
        Update: {
          birthday_bonus_expiry_days?: number
          birthday_bonus_points?: number
          birthday_bonus_stamps?: number
          birthday_bonus_visits?: number
          created_at?: string
          currency?: string
          id?: string
          logo_padding?: number
          notify_new_customer?: boolean
          notify_redemption?: boolean
          notify_weekly_digest?: boolean
          phone_prefix?: string | null
          primary_color?: string
          program_label?: string
          reactivation_bonus_expiry_days?: number
          reactivation_bonus_points?: number
          reactivation_bonus_stamps?: number
          reactivation_bonus_visits?: number
          referral_enabled?: boolean
          referral_program_configs?: Json
          secondary_color?: string
          stamp_icon?: string
          tenant_id?: string
          terms_url?: string | null
          tier_score_per_cashback_cent?: number
          tier_score_per_point?: number
          tier_score_per_stamp?: number
          tier_score_per_visit?: number
          tiers?: Json
          tiers_enabled?: boolean
          tier_window_months?: number | null
          tier_grandfather_until?: string | null
          timezone?: string
          updated_at?: string
          wa_notify_balance_reminder?: boolean
          wa_notify_birthday?: boolean
          wa_notify_milestone_80?: boolean
          wa_notify_promotion?: boolean
          wa_notify_reactivation?: boolean
          wa_notify_streak_at_risk?: boolean
          wa_notify_voucher_expiry?: boolean
          wa_notify_welcome?: boolean
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          deleted_at: string | null
          deletion_reason: string | null
          email: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["tenant_plan"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subdomain: string
          subscription_end_date: string | null
          subscription_status: string | null
          updated_at: string
          whatsapp_from: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          email: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["tenant_plan"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subdomain: string
          subscription_end_date?: string | null
          subscription_status?: string | null
          updated_at?: string
          whatsapp_from?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          email?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["tenant_plan"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subdomain?: string
          subscription_end_date?: string | null
          subscription_status?: string | null
          updated_at?: string
          whatsapp_from?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          balance_after: number
          created_at: string
          customer_id: string
          enrollment_id: string
          id: string
          note: string | null
          loyalty_delta: number | null
          points_delta: number
          program_id: string
          reward_id: string | null
          staff_id: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          balance_after: number
          created_at?: string
          customer_id: string
          enrollment_id: string
          id?: string
          note?: string | null
          loyalty_delta?: number | null
          points_delta: number
          program_id: string
          reward_id?: string | null
          staff_id?: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          balance_after?: number
          created_at?: string
          customer_id?: string
          enrollment_id?: string
          id?: string
          note?: string | null
          loyalty_delta?: number | null
          points_delta?: number
          program_id?: string
          reward_id?: string | null
          staff_id?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "customer_program_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "reward_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          customer_count: number
          program_count: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          customer_count?: number
          program_count?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          customer_count?: number
          program_count?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          business_name: string | null
          created_at: string
          email: string
          id: string
          ip: string | null
          name: string | null
          phone: string | null
          source: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email: string
          id?: string
          ip?: string | null
          name?: string | null
          phone?: string | null
          source?: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string
          id?: string
          ip?: string | null
          name?: string | null
          phone?: string | null
          source?: string
        }
        Relationships: []
      }
      whatsapp_frequency_caps: {
        Row: {
          cap_type: string
          customer_id: string
          id: string
          send_count: number
          tenant_id: string
          updated_at: string
          window_start: string
        }
        Insert: {
          cap_type: string
          customer_id: string
          id?: string
          send_count?: number
          tenant_id: string
          updated_at?: string
          window_start: string
        }
        Update: {
          cap_type?: string
          customer_id?: string
          id?: string
          send_count?: number
          tenant_id?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_frequency_caps_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_frequency_caps_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_queue: {
        Row: {
          claimed_at: string | null
          created_at: string
          customer_id: string
          error_message: string | null
          from_number: string | null
          id: string
          max_retries: number
          phone_number: string
          priority: number
          retry_count: number
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["whatsapp_msg_status"]
          template_category: Database["public"]["Enums"]["whatsapp_template_category"]
          template_name: string
          template_params: Json
          tenant_id: string
          waba_message_id: string | null
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          customer_id: string
          error_message?: string | null
          from_number?: string | null
          id?: string
          max_retries?: number
          phone_number: string
          priority?: number
          retry_count?: number
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_msg_status"]
          template_category: Database["public"]["Enums"]["whatsapp_template_category"]
          template_name: string
          template_params?: Json
          tenant_id: string
          waba_message_id?: string | null
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          customer_id?: string
          error_message?: string | null
          from_number?: string | null
          id?: string
          max_retries?: number
          phone_number?: string
          priority?: number
          retry_count?: number
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_msg_status"]
          template_category?: Database["public"]["Enums"]["whatsapp_template_category"]
          template_name?: string
          template_params?: Json
          tenant_id?: string
          waba_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_queue_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_quality_state: {
        Row: {
          id: string
          is_paused: boolean
          last_webhook_at: string | null
          paused_at: string | null
          rating: string
          raw_payload: Json | null
          updated_at: string
        }
        Insert: {
          id?: string
          is_paused?: boolean
          last_webhook_at?: string | null
          paused_at?: string | null
          rating?: string
          raw_payload?: Json | null
          updated_at?: string
        }
        Update: {
          id?: string
          is_paused?: boolean
          last_webhook_at?: string | null
          paused_at?: string | null
          rating?: string
          raw_payload?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_whatsapp_messages: {
        Args: { batch_size?: number }
        Returns: {
          claimed_at: string | null
          created_at: string
          customer_id: string
          error_message: string | null
          from_number: string | null
          id: string
          max_retries: number
          phone_number: string
          priority: number
          retry_count: number
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["whatsapp_msg_status"]
          template_category: Database["public"]["Enums"]["whatsapp_template_category"]
          template_name: string
          template_params: Json
          tenant_id: string
          waba_message_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "whatsapp_message_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      current_tenant_id: { Args: never; Returns: string }
      is_authenticated: { Args: never; Returns: boolean }
      plan_customer_limit: { Args: { p_plan: string }; Returns: number }
      plan_program_limit: { Args: { p_plan: string }; Returns: number }
      rpc_add_loyalty_score: {
        Args: { p_customer_id: string; p_delta: number; p_tenant_id: string }
        Returns: number
      }
      rpc_earn_points: {
        Args: {
          p_customer_id: string
          p_note?: string
          p_points_delta: number
          p_program_id: string
          p_staff_id?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      rpc_expire_vouchers: { Args: never; Returns: number }
      rpc_mark_redemption_used: {
        Args: { p_redemption_code: string; p_tenant_id: string }
        Returns: Json
      }
      rpc_redeem_reward: {
        Args: {
          p_customer_id: string
          p_enrollment_id: string
          p_note?: string
          p_reward_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      program_status: "draft" | "active" | "paused" | "archived"
      program_type: "points" | "stamp" | "visit" | "cashback"
      redemption_status: "pending" | "used" | "expired" | "cancelled"
      tenant_plan: "free" | "starter" | "pro" | "enterprise"
      transaction_type: "earn" | "redeem" | "expire" | "adjustment" | "refund"
      whatsapp_msg_status:
        | "pending"
        | "sending"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
        | "cancelled"
      whatsapp_template_category: "utility" | "marketing"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      program_status: ["draft", "active", "paused", "archived"],
      program_type: ["points", "stamp", "visit", "cashback"],
      redemption_status: ["pending", "used", "expired", "cancelled"],
      tenant_plan: ["free", "starter", "pro", "enterprise"],
      transaction_type: ["earn", "redeem", "expire", "adjustment", "refund"],
      whatsapp_msg_status: [
        "pending",
        "sending",
        "sent",
        "delivered",
        "read",
        "failed",
        "cancelled",
      ],
      whatsapp_template_category: ["utility", "marketing"],
    },
  },
} as const
