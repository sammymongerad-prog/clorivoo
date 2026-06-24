// Types générés automatiquement par Supabase
// Sera remplacé par : supabase gen types typescript --project-id <id>
// TODO: Remplacer avec les vrais types générés après création du schéma

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone_whatsapp: string;
          role: string;
          destination_country: string;
          destination_city: string;
          us_suite: string;
          loyalty_level: string;
          total_spent: number;
          is_active: boolean;
          is_verified: boolean;
          expo_push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      colis: {
        Row: {
          id: string;
          tracking_number: string;
          user_id: string;
          status: string;
          transport_mode: string;
          real_weight_lbs: number;
          billed_weight_lbs: number;
          declared_value: number;
          insurance_amount: number;
          destination_country: string;
          destination_city: string;
          destination_address: string;
          departure_id: string | null;
          shipping_rate: number;
          total_price: number;
          notes: string | null;
          admin_notes: string | null;
          received_at: string | null;
          shipped_at: string | null;
          arrived_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['colis']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['colis']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
