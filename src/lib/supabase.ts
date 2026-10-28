import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente de Supabase para toda la app. Si no hay variables en .env.local
// (ver .env.example), la app funciona en modo demo con datos de prueba:
// así corren las pruebas y se puede trabajar sin acceso al proyecto.

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const clave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabase: SupabaseClient | null = url && clave ? createClient(url, clave) : null

export const usaSupabase = supabase !== null
