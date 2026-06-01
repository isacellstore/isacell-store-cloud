export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          rnc: string;
          phone: string;
          address: string;
          email: string;
          logo_url: string | null;
          tax_rate: number;
          max_discount_percent: number;
          sale_footer_message: string;
          repair_footer_message: string;
          seq_sale: number;
          seq_repair: number;
          seq_payment: number;
          seq_purchase: number;
          is_active: boolean;
          plan: string;
          created_at: string;
          trial_ends_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          rnc?: string;
          phone?: string;
          address?: string;
          email?: string;
          logo_url?: string | null;
          tax_rate?: number;
          max_discount_percent?: number;
          sale_footer_message?: string;
          repair_footer_message?: string;
          seq_sale?: number;
          seq_repair?: number;
          seq_payment?: number;
          seq_purchase?: number;
          is_active?: boolean;
          plan?: string;
          created_at?: string;
          trial_ends_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          auth_id: string;
          company_id: string;
          name: string;
          username: string;
          email: string;
          role: string;
          permissions: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          auth_id: string;
          company_id: string;
          name: string;
          username: string;
          email: string;
          role?: string;
          permissions?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          company_id: string;
          barcode: string;
          name: string;
          cost: number;
          price: number;
          category: string;
          stock: number;
          imeis: string[];
          min_stock: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          barcode?: string;
          name: string;
          cost?: number;
          price: number;
          category?: string;
          stock?: number;
          imeis?: string[];
          min_stock?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          doc_id: string;
          phone: string;
          email: string;
          address: string;
          credit_limit: number;
          balance: number;
          transactions: Json;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          doc_id?: string;
          phone?: string;
          email?: string;
          address?: string;
          credit_limit?: number;
          balance?: number;
          transactions?: Json;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      suppliers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          doc_id: string;
          phone: string;
          email: string;
          address: string;
          balance: number;
          transactions: Json;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          doc_id?: string;
          phone?: string;
          email?: string;
          address?: string;
          balance?: number;
          transactions?: Json;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>;
      };
      sales: {
        Row: {
          id: string;
          company_id: string;
          display_id: string;
          date: string;
          time: string;
          items: Json;
          total: number;
          payment_amount: number;
          change: number;
          type: string;
          client_id: string;
          client_name: string;
          seller: string;
          is_quote: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          display_id: string;
          date: string;
          time?: string;
          items?: Json;
          total?: number;
          payment_amount?: number;
          change?: number;
          type?: string;
          client_id?: string;
          client_name?: string;
          seller?: string;
          is_quote?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sales']['Insert']>;
      };
      repairs: {
        Row: {
          id: string;
          company_id: string;
          display_id: string;
          date_in: string;
          date_out: string | null;
          client_name: string;
          client_phone: string;
          model: string;
          imei: string;
          issue: string;
          solution: string;
          estimated_cost: number;
          final_cost: number;
          deposit: number;
          amount_paid_on_delivery: number;
          status: string;
          technician: string;
          is_repaired: boolean;
          notes: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          display_id: string;
          date_in: string;
          date_out?: string | null;
          client_name: string;
          client_phone?: string;
          model: string;
          imei?: string;
          issue: string;
          solution?: string;
          estimated_cost?: number;
          final_cost?: number;
          deposit?: number;
          amount_paid_on_delivery?: number;
          status?: string;
          technician?: string;
          is_repaired?: boolean;
          notes?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['repairs']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          company_id: string;
          date: string;
          description: string;
          amount: number;
          category: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          date: string;
          description: string;
          amount: number;
          category?: string;
          created_by?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
    };
    Functions: {
      decrement_stock: {
        Args: { product_id: string; amount: number };
        Returns: void;
      };
      increment_stock: {
        Args: { product_id: string; amount: number };
        Returns: void;
      };
    };
  };
}
