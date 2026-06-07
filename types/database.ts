export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TrafficQuoteStatus =
  | "pending"
  | "missing_fields"
  | "ready_for_worker"
  | "running_doganium"
  | "pdf_downloaded"
  | "parsed"
  | "sent_to_customer"
  | "manual_review"
  | "failed";

export type WhatsAppMessageDirection = "incoming" | "outgoing";

export type Database = {
  public: {
    Tables: {
      traffic_quote_requests: {
        Row: {
          id: string;
          customer_phone: string;
          whatsapp_message_id: string | null;
          raw_message: string;
          tckn: string | null;
          tckn_masked: string | null;
          plate: string | null;
          document_serial_no: string | null;
          document_serial_no_masked: string | null;
          birth_date: string | null;
          birth_date_masked: string | null;
          status: TrafficQuoteStatus;
          missing_fields: string[];
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_phone: string;
          whatsapp_message_id?: string | null;
          raw_message: string;
          tckn?: string | null;
          tckn_masked?: string | null;
          plate?: string | null;
          document_serial_no?: string | null;
          document_serial_no_masked?: string | null;
          birth_date?: string | null;
          birth_date_masked?: string | null;
          status?: TrafficQuoteStatus;
          missing_fields?: string[];
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_phone?: string;
          whatsapp_message_id?: string | null;
          raw_message?: string;
          tckn?: string | null;
          tckn_masked?: string | null;
          plate?: string | null;
          document_serial_no?: string | null;
          document_serial_no_masked?: string | null;
          birth_date?: string | null;
          birth_date_masked?: string | null;
          status?: TrafficQuoteStatus;
          missing_fields?: string[];
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      traffic_quote_results: {
        Row: {
          id: string;
          request_id: string;
          pdf_url: string | null;
          cheapest_company: string;
          cheapest_price: number | string;
          highest_company: string | null;
          highest_price: number | string | null;
          recommended_company: string | null;
          recommended_price: number | string | null;
          raw_result_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          pdf_url?: string | null;
          cheapest_company: string;
          cheapest_price: number | string;
          highest_company?: string | null;
          highest_price?: number | string | null;
          recommended_company?: string | null;
          recommended_price?: number | string | null;
          raw_result_json?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          pdf_url?: string | null;
          cheapest_company?: string;
          cheapest_price?: number | string;
          highest_company?: string | null;
          highest_price?: number | string | null;
          recommended_company?: string | null;
          recommended_price?: number | string | null;
          raw_result_json?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "traffic_quote_results_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "traffic_quote_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_messages: {
        Row: {
          id: string;
          customer_phone: string;
          whatsapp_message_id: string | null;
          direction: WhatsAppMessageDirection;
          body: string;
          status: string | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_phone: string;
          whatsapp_message_id?: string | null;
          direction: WhatsAppMessageDirection;
          body: string;
          status?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_phone?: string;
          whatsapp_message_id?: string | null;
          direction?: WhatsAppMessageDirection;
          body?: string;
          status?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "traffic_quote_requests";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
