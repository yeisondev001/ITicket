# Frontend: estructura y convenciones

Guía rápida para trabajar en `src/`. Stack: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + React Router.

## Estructura

```
src/
├── app/router.tsx          Rutas de la aplicación
├── components/
│   ├── ui/                 Componentes generados por shadcn/ui (no se editan a mano)
│   ├── layout/             AppLayout, Sidebar y Topbar
│   ├── feedback/           Estados de carga, error y vacío
│   ├── common/             Piezas pequeñas compartidas (p. ej. NativeSelect)
│   └── StatCard.tsx        Tarjeta de indicador
├── config/navegacion.ts    Opciones del menú y qué rol ve cada una
├── hooks/                  Hooks compartidos (usuario actual, consultas, hora)
├── lib/                    Lógica compartida (matriz de prioridad, utilidades)
├── pages/                  Páginas genéricas (en construcción, 404)
├── types/                  Tipos compartidos
└── features/<módulo>/      Un módulo por funcionalidad
    ├── components/         Componentes del módulo
    ├── data/               Datos de prueba
    ├── hooks/              Hooks que usan las páginas
    ├── lib/                Lógica pura del módulo (con pruebas *.test.ts)
    ├── pages/              Pantallas del módulo
    ├── services/           Acceso a datos (hoy datos de prueba; luego Supabase)
    └── types/              Tipos del módulo
```

## Flujo de datos

```
Página → hook (useTickets, useTicket…) → service (tickets.service.ts) → datos de prueba / Supabase
```

Los componentes visuales nunca llaman a Supabase directamente. Para conectar el
backend se cambia solo el `service`: cada función hace la consulta real y
convierte los campos de `snake_case` (base de datos) a `camelCase` (frontend).

## Convenciones

- Importa con el alias `@/` (apunta a `src/`).
- Los tipos usan los mismos valores que los enums de la base de datos
  (`en_progreso`, `P1`…). Las etiquetas para mostrar están en `lib/etiquetas.ts`.
- Prioridad, estado y SLA siempre se muestran con texto, no solo con color.
- Para agregar un componente de shadcn/ui: `npx shadcn@latest add <componente>`.
- Cada ruta declara su título en `handle` (lo muestra la barra superior).

## Rutas

| Ruta | Pantalla |
|---|---|
| `/` | Inicio |
| `/tickets` | Lista de tickets |
| `/tickets/nuevo` | Formulario para reportar un incidente |
| `/tickets/:id` | Detalle del ticket |
| `/mis-tickets` | Panel del técnico |
