# Plan de Pruebas — ITicket

## 1. Objetivo

Definir la estrategia de aseguramiento de calidad de ITicket, identificando los módulos que deben probarse, las herramientas a utilizar, los recorridos funcionales prioritarios y el calendario de ejecución.

## 2. Alcance

Se contemplan las siguientes áreas:

- Autenticación y autorización por roles.
- Registro, clasificación, asignación y cierre de tickets.
- Cálculo de prioridad y validación de respuestas de IA.
- Gestión de SLA y escalamiento.
- Notificaciones, dashboard y auditoría.
- Evaluación de usabilidad mediante SUS.

Las pruebas se limitarán a las funcionalidades implementadas y disponibles en el entorno de pruebas.

## 3. Estrategia y herramientas

| Nivel | Herramienta | Propósito |
|---|---|---|
| Unitario | Vitest | Validar funciones y reglas de negocio de forma aislada. |
| End-to-end | Playwright | Verificar recorridos completos mediante el navegador. |
| Usabilidad | SUS y observación de tareas | Evaluar la facilidad de uso con participantes representativos. |
| Integración complementaria | Pruebas controladas de Supabase | Verificar persistencia, permisos y comportamiento de servicios externos cuando corresponda. |

## 4. Pruebas unitarias

Se priorizarán las funciones de cálculo de prioridad, reglas para servicios críticos, validación de datos y gestión de SLA.

Los casos se definirán a partir de las funciones existentes en `src/lib/` y otros módulos de lógica de negocio. Cada prueba deberá especificar sus datos de entrada, resultado esperado y criterio de aprobación.

## 5. Pruebas end-to-end

Se planifican los siguientes recorridos:

1. Inicio y cierre de sesión.
2. Registro y consulta de un incidente.
3. Actualización, asignación y cierre de un ticket.
4. Denegación de operaciones no autorizadas.
5. Verificación de los resultados visibles del flujo de SLA, cuando esté implementado.

Los recorridos se ejecutarán en un entorno de pruebas con datos controlados.

## 6. Pruebas con usuarios

Se propone una muestra inicial de 8–12 participantes, incluyendo perfiles de usuarios y personal de soporte.

El instrumento principal será el cuestionario SUS de 10 ítems, complementado con tareas prácticas, observación de errores y registro del tiempo necesario para completar cada tarea.

Se documentarán la puntuación SUS, las dificultades observadas y las oportunidades de mejora. La muestra se considerará exploratoria.

## 7. Planificación por sprint

- Sprint 2: acceso, autenticación y roles.
- Sprint 3: tickets, clasificación y prioridad.
- Sprint 4: atención, SLA y continuidad de negocio.
- Sprint 5: notificaciones, dashboard y auditoría.
- Sprint 6: pruebas de flujo, regresión, evaluación SUS y cierre.

## 8. Criterios de entrada y salida

Entrada:
- Funcionalidad disponible en un entorno de pruebas.
- Datos y cuentas de prueba preparados.
- Requisitos y resultados esperados definidos.

Salida:
- Casos ejecutados y resultados documentados.
- Defectos identificados y clasificados por severidad.
- Ningún defecto crítico abierto para los flujos considerados imprescindibles.
- Resultados de usabilidad y limitaciones documentados.

## 9. Gestión de defectos

Cada defecto deberá incluir identificador, descripción, pasos para reproducirlo, resultado esperado, resultado obtenido, severidad, evidencia y estado.

## 10. Limitaciones

La disponibilidad de cada prueba dependerá del estado real de implementación de los módulos, la configuración del entorno y el acceso a servicios externos.

Este documento constituye un plan de pruebas. La existencia del plan no implica que todas las pruebas hayan sido automatizadas o ejecutadas.