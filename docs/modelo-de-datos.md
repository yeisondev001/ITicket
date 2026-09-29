# Modelo de datos

Diagrama entidad-relación (nivel lógico-físico, notación pata de gallo) de la base de datos de
ITicket en Supabase (PostgreSQL). Es la referencia para las migraciones, las políticas RLS y los
formularios del frontend: si una tabla cambia, este diagrama se actualiza en el mismo PR.

```mermaid
erDiagram
    AUTH_USERS ||--|| PERFILES : "tiene"
    PERFILES |o--o{ TICKETS : "crea"
    PERFILES |o--o{ TICKETS : "atiende"
    PERFILES ||--o{ TECNICO_CATEGORIAS : "cubre"
    CATEGORIAS ||--o{ TECNICO_CATEGORIAS : "es cubierta por"
    CATEGORIAS |o--o{ TICKETS : "clasifica"
    SERVICIOS |o--o{ TICKETS : "es afectado por"
    SERVICIOS ||--o| PLAYBOOKS : "tiene"
    TICKETS ||--o{ COMENTARIOS : "tiene"
    PERFILES ||--o{ COMENTARIOS : "escribe"
    TICKETS ||--o{ ESCALAMIENTOS : "registra"
    PERFILES |o--o{ ESCALAMIENTOS : "es notificado en"
    TICKETS ||--o| POSTMORTEMS : "documenta"
    PERFILES ||--o{ POSTMORTEMS : "redacta"
    PERFILES |o--o{ BITACORA : "genera"

    AUTH_USERS {
        uuid id PK
        text email
    }
    PERFILES {
        uuid id PK, FK "mismo id que auth.users"
        text nombre
        rol_usuario rol
        text telegram_chat_id
        boolean activo
        timestamptz created_at
    }
    CATEGORIAS {
        smallint id PK
        text nombre UK
        text descripcion
    }
    TECNICO_CATEGORIAS {
        uuid tecnico_id PK, FK
        smallint categoria_id PK, FK
    }
    SERVICIOS {
        bigint id PK
        text nombre UK
        text descripcion
        boolean es_critico
        int rto_minutos "tiempo maximo para volver a funcionar"
        int rpo_minutos "perdida maxima de datos aceptable"
    }
    PLAYBOOKS {
        bigint id PK
        bigint servicio_id FK, UK
        text titulo
        text pasos "pasos de recuperacion en markdown"
        timestamptz updated_at
    }
    TICKETS {
        bigint id PK
        text titulo
        text descripcion
        origen_ticket origen
        estado_ticket estado
        smallint categoria_id FK
        bigint servicio_id FK
        uuid creado_por FK "nulo si viene del monitoreo"
        uuid asignado_a FK
        nivel_impacto impacto
        nivel_urgencia urgencia
        prioridad prioridad "final, puede corregirla el tecnico"
        prioridad prioridad_ia "la que propuso la IA"
        numeric ia_confianza
        text ia_explicacion
        boolean requiere_revision
        timestamptz sla_vence_en
        smallint nivel_escalamiento
        text solucion
        timestamptz created_at
        timestamptz updated_at
        timestamptz cerrado_en
    }
    COMENTARIOS {
        bigint id PK
        bigint ticket_id FK
        uuid autor_id FK
        text contenido
        timestamptz created_at
    }
    ESCALAMIENTOS {
        bigint id PK
        bigint ticket_id FK
        smallint nivel
        text motivo
        uuid notificado_a FK
        timestamptz created_at
    }
    POSTMORTEMS {
        bigint id PK
        bigint ticket_id FK, UK
        uuid autor_id FK
        text causa_raiz
        text lecciones
        int tiempo_recuperacion_min
        timestamptz created_at
    }
    BITACORA {
        bigint id PK
        text tabla
        text registro_id
        accion_bitacora accion
        jsonb cambios
        uuid actor_id FK
        timestamptz created_at
    }
```

## Tipos enumerados

| Tipo | Valores |
|---|---|
| `rol_usuario` | `usuario`, `tecnico`, `supervisor`, `administrador` |
| `origen_ticket` | `usuario`, `monitoreo` |
| `estado_ticket` | `nuevo`, `asignado`, `en_progreso`, `escalado`, `resuelto`, `cerrado` |
| `nivel_impacto` | `alto`, `medio`, `bajo` |
| `nivel_urgencia` | `alta`, `media`, `baja` |
| `prioridad` | `P1`, `P2`, `P3`, `P4` |
| `accion_bitacora` | `insert`, `update`, `delete` |

## Decisiones

- **`perfiles` extiende el login de Supabase.** Supabase Auth guarda correo y contraseña en `auth.users`; los datos propios del sistema (nombre, rol) van en `perfiles`, con el mismo `id`.
- **Prioridad de la IA separada de la final.** `prioridad_ia` guarda lo que propuso el modelo y `prioridad` la decisión final, que el técnico puede corregir. Comparar ambas mide la precisión de la IA para el Capítulo IV.
- **La prioridad sale de la matriz ITIL.** La IA estima `impacto` y `urgencia`; la prioridad se calcula con `src/lib/prioridad.ts`. Un servicio con `es_critico` nunca queda por debajo de P2.
- **Los tickets del monitoreo no tienen creador.** Por eso `creado_por` puede ser nulo.
- **No se borran usuarios.** Se desactivan con `activo`, para conservar el historial de sus tickets.

## Qué tabla se crea en cada tarea

| Tarea | Tablas |
|---|---|
| #6 Crear tablas base | `perfiles`, `categorias`, `tecnico_categorias`, `tickets`, `comentarios` |
| #22 Escalamiento por SLA | `escalamientos` |
| #23 Servicios críticos y playbooks | `servicios`, `playbooks` |
| #24 Bitácora de auditoría | `bitacora` |
| #29 Post-mortem | `postmortems` |

La columna `tickets.servicio_id` se agrega en la migración de #23, cuando ya existe `servicios`.
