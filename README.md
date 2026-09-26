# ITicket

Sistema Inteligente de Gestión de Incidentes de TI — Proyecto Final, Instituto Tecnológico
de Las Américas (ITLA). Tema pre-aprobado No. 28: *Sistema de Gestión de Incidentes y
Continuidad de Negocio*.

## Descripción

ITicket es una plataforma web para centralizar el registro, la clasificación, el
seguimiento y el cierre de incidentes tecnológicos. Un modelo de inteligencia artificial
clasifica cada ticket por categoría, impacto y urgencia, calcula su prioridad según la
matriz de ITIL, y el sistema vigila el cumplimiento del SLA para escalar automáticamente
los casos que no se atienden a tiempo.

## Stack tecnológico

- **Frontend:** React + Vite + TypeScript, Tailwind CSS + shadcn/ui
- **Backend / BaaS:** Supabase (PostgreSQL, Auth + RLS, Realtime, Edge Functions, pg_cron)
- **Inteligencia Artificial:** Groq (Llama) o Google Gemini, validado con Zod
- **Notificaciones:** Telegram Bot API, Resend
- **Calidad:** Vitest, Playwright, GitHub Actions
- **Despliegue:** Vercel o Netlify

## Desarrollo local

Requiere Node.js 22 o superior.

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo
npm run lint     # revisar el código
npm test         # pruebas unitarias
npm run build    # build de producción
```

## Flujo de trabajo

1. Crear una rama desde `develop` (`feature/nombre`, `fix/nombre`).
2. Abrir un Pull Request hacia `develop`. El CI corre lint, build y pruebas.
3. `main` solo recibe cambios por Pull Request desde `develop`.

Detalle del pipeline en [docs/CI-CD.md](docs/CI-CD.md).

## Equipo

Proyecto desarrollado por un equipo de 10 estudiantes del ITLA, bajo el marco Scrum
(Product Owner, Scrum Master y Development Team).

## Estado

🚧 En desarrollo — fase inicial del proyecto.
