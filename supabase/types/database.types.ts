// Tipos de la base de datos para las Edge Functions, generados por Supabase.
// Se importan con: import type { Database } from "../../types/database.types.ts"
// No se editan a mano: se regeneran cuando cambia una migración con
//   npx supabase gen types typescript --project-id lwwokrawvwtjuekwuobd > supabase/types/database.types.ts
// Uso: createClient<Database>(url, clave). Así `deno check` avisa si un insert
// usa una columna o un valor de enum que no existe (p. ej. "Monitoreo").

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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          descripcion: string | null
          id: number
          nombre: string
        }
        Insert: {
          descripcion?: string | null
          id?: never
          nombre: string
        }
        Update: {
          descripcion?: string | null
          id?: never
          nombre?: string
        }
        Relationships: []
      }
      comentarios: {
        Row: {
          autor_id: string
          contenido: string
          created_at: string
          id: number
          ticket_id: number
        }
        Insert: {
          autor_id: string
          contenido: string
          created_at?: string
          id?: never
          ticket_id: number
        }
        Update: {
          autor_id?: string
          contenido?: string
          created_at?: string
          id?: never
          ticket_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          telegram_chat_id: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telegram_chat_id?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telegram_chat_id?: string | null
        }
        Relationships: []
      }
      tecnico_categorias: {
        Row: {
          categoria_id: number
          tecnico_id: string
        }
        Insert: {
          categoria_id: number
          tecnico_id: string
        }
        Update: {
          categoria_id?: number
          tecnico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tecnico_categorias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tecnico_categorias_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          alerta_id: string | null
          asignado_a: string | null
          asignado_en: string | null
          categoria_id: number | null
          cerrado_en: string | null
          creado_por: string | null
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["estado_ticket"]
          id: number
          impacto: Database["public"]["Enums"]["nivel_impacto"] | null
          nivel_escalamiento: number
          origen: Database["public"]["Enums"]["origen_ticket"]
          prioridad: Database["public"]["Enums"]["prioridad"] | null
          requiere_revision: boolean
          resuelto_en: string | null
          sla_vence_en: string | null
          solucion: string | null
          titulo: string
          updated_at: string
          urgencia: Database["public"]["Enums"]["nivel_urgencia"] | null
        }
        Insert: {
          alerta_id?: string | null
          asignado_a?: string | null
          asignado_en?: string | null
          categoria_id?: number | null
          cerrado_en?: string | null
          creado_por?: string | null
          created_at?: string
          descripcion: string
          estado?: Database["public"]["Enums"]["estado_ticket"]
          id?: never
          impacto?: Database["public"]["Enums"]["nivel_impacto"] | null
          nivel_escalamiento?: number
          origen?: Database["public"]["Enums"]["origen_ticket"]
          prioridad?: Database["public"]["Enums"]["prioridad"] | null
          requiere_revision?: boolean
          resuelto_en?: string | null
          sla_vence_en?: string | null
          solucion?: string | null
          titulo: string
          updated_at?: string
          urgencia?: Database["public"]["Enums"]["nivel_urgencia"] | null
        }
        Update: {
          alerta_id?: string | null
          asignado_a?: string | null
          asignado_en?: string | null
          categoria_id?: number | null
          cerrado_en?: string | null
          creado_por?: string | null
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_ticket"]
          id?: never
          impacto?: Database["public"]["Enums"]["nivel_impacto"] | null
          nivel_escalamiento?: number
          origen?: Database["public"]["Enums"]["origen_ticket"]
          prioridad?: Database["public"]["Enums"]["prioridad"] | null
          requiere_revision?: boolean
          resuelto_en?: string | null
          sla_vence_en?: string | null
          solucion?: string | null
          titulo?: string
          updated_at?: string
          urgencia?: Database["public"]["Enums"]["nivel_urgencia"] | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      rol_actual: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
    }
    Enums: {
      estado_ticket:
        | "nuevo"
        | "asignado"
        | "en_progreso"
        | "escalado"
        | "resuelto"
        | "cerrado"
      nivel_impacto: "alto" | "medio" | "bajo"
      nivel_urgencia: "alta" | "media" | "baja"
      origen_ticket: "usuario" | "monitoreo"
      prioridad: "P1" | "P2" | "P3" | "P4"
      rol_usuario: "usuario" | "tecnico" | "supervisor" | "administrador"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      estado_ticket: [
        "nuevo",
        "asignado",
        "en_progreso",
        "escalado",
        "resuelto",
        "cerrado",
      ],
      nivel_impacto: ["alto", "medio", "bajo"],
      nivel_urgencia: ["alta", "media", "baja"],
      origen_ticket: ["usuario", "monitoreo"],
      prioridad: ["P1", "P2", "P3", "P4"],
      rol_usuario: ["usuario", "tecnico", "supervisor", "administrador"],
    },
  },
} as const
