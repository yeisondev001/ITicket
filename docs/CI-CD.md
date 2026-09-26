# Pipeline de CI/CD

## Ramas

| Rama | Uso | Protección |
|---|---|---|
| `main` | Versión estable (entregas y producción) | Solo por Pull Request, sin force push ni borrado, CI obligatorio |
| `develop` | Integración del trabajo diario | Libre |
| `feature/...`, `fix/...`, `chore/...` | Trabajo de cada integrante | Libre |

Flujo: rama propia → PR a `develop` → cuando esté estable, PR de `develop` a `main`.

## CI — `.github/workflows/ci.yml`

Corre en cada Pull Request y en cada push a `develop` o `main`:

1. `npm ci` — instala dependencias exactas del `package-lock.json`
2. `npm run lint` — revisa el código con oxlint
3. `npm run build` — compila TypeScript y genera el build de Vite
4. `npm test` — pruebas unitarias con Vitest

Si un paso falla, el PR queda en rojo y no se puede mergear a `main`.

## CD

### Base de datos y Edge Functions — `.github/workflows/cd-supabase.yml`

Corre solo después de que el CI pasa en un push (es decir, al hacer merge):

| Merge a | Ambiente de GitHub | Proyecto Supabase |
|---|---|---|
| `develop` | `staging` | Pruebas |
| `main` | `production` | Producción |

**Está apagado** hasta que se configure. Para encenderlo:

1. Crear los proyectos en [supabase.com](https://supabase.com) (uno de pruebas y uno de producción; el plan gratis permite 2).
2. Inicializar Supabase en el repo: `npx supabase init` (crea la carpeta `supabase/`).
3. En GitHub → Settings → Environments, crear `staging` y `production`, y en cada uno agregar los secretos:
   - `SUPABASE_ACCESS_TOKEN` — token personal (supabase.com → Account → Access Tokens)
   - `SUPABASE_PROJECT_REF` — el ID del proyecto (aparece en la URL del dashboard)
   - `SUPABASE_DB_PASSWORD` — la contraseña de la base de datos de ese proyecto

Mientras falte algo, el workflow termina en verde con un aviso, sin desplegar nada.

### Frontend — pendiente de elegir hosting

Vercel y Netlify despliegan solos desde GitHub, sin workflow propio:

1. Crear la cuenta e importar el repo `ITicket`.
2. Rama de producción: `main`.
3. Activar vistas previas para Pull Requests y para `develop`.
4. Configurar las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de cada ambiente.
