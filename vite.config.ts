import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Alias @/ → src/ (lo usa shadcn/ui y evita rutas tipo ../../../)
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Excluye explícitamente la carpeta de Playwright y node_modules
    exclude: ['tests/**', 'node_modules/**'],
    // Las pruebas unitarias corren siempre en modo demo, aunque exista .env.local.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
  },
})