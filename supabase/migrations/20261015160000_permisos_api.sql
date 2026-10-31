-- Permisos de la API para el frontend.
--
-- Las políticas RLS deciden qué filas ve y cambia cada rol, pero el rol
-- authenticated también necesita el permiso base sobre cada tabla; sin él,
-- toda consulta desde la app falla con "permission denied".

-- Usuarios con sesión: leer y escribir, siempre filtrado por las políticas RLS.
grant select, insert, update, delete on
  public.perfiles,
  public.categorias,
  public.tecnico_categorias,
  public.tickets,
  public.comentarios,
to authenticated;

-- Permisos de lectura para el catálogo usado por el frontend.
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT
ON TABLE public.servicios, public.playbooks
TO authenticated;

-- Nadie desde la API puede vaciar tablas: TRUNCATE no pasa por RLS.
revoke truncate on
  public.perfiles,
  public.categorias,
  public.tecnico_categorias,
  public.tickets,
  public.comentarios,
  public.servicios,
  public.playbooks
from anon, authenticated;

-- Dos triggers en auth.users crean el perfil del usuario nuevo; se deja solo
-- al_crear_usuario.
drop trigger if exists on_auth_user_created on auth.users;
