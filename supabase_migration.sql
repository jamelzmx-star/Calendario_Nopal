-- ─────────────────────────────────────────────────────────────────
-- Control Nopal — Migración de Supabase
-- Ejecuta este SQL en: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────

-- 1. Tabla de perfiles de usuarios
create table if not exists public.profiles (
  id                  uuid references auth.users on delete cascade primary key,
  email               text unique not null,
  nombre              text,
  activo              boolean not null default true,
  plan                text not null default 'mensual'  -- 'mensual' | 'anual'
                      check (plan in ('mensual', 'anual')),
  suscripcion_inicio  timestamptz default now(),
  suscripcion_fin     timestamptz,
  notas               text,
  created_at          timestamptz default now()
);

-- 2. Habilitar Row Level Security
alter table public.profiles enable row level security;

-- 3. Políticas de acceso
-- El usuario solo puede leer SU propio perfil
create policy "Usuario lee su perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- Solo el admin (service_role o función) puede insertar/actualizar perfiles
-- Para el panel admin usaremos la Supabase API con clave de servicio (service_role)
-- O si prefieres simplicidad, permite que cualquier usuario autenticado gestione (menos seguro):
create policy "Admin gestiona perfiles"
  on public.profiles for all
  using (true)          -- Cambiar a: auth.jwt() ->> 'email' = 'TU_ADMIN@correo.com'
  with check (true);

-- 4. Función que crea el perfil automáticamente al registrar un usuario (opcional)
-- Útil si usas inviteUserByEmail o signUp
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- NO insertamos automáticamente para que el admin controle quién entra
  -- Descomenta las líneas de abajo si quieres perfil automático:
  -- insert into public.profiles (id, email)
  -- values (new.id, new.email);
  return new;
end;
$$;

-- Trigger al crear usuario (descomenta si quieres el insert automático)
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────
-- CONFIGURACIÓN ADICIONAL EN EL DASHBOARD DE SUPABASE:
-- 
-- 1. Authentication → Settings:
--    - "Enable email confirmations": DESACTIVAR (para acceso inmediato)
--    - O usa "Confirm email" = false al crear usuarios vía Admin API
-- 
-- 2. Para el panel Admin, si quieres usar supabase.auth.admin.createUser():
--    - Necesitas la SERVICE ROLE KEY (nunca la expongas en el frontend)
--    - Crea una Edge Function de Supabase que reciba los datos y llame a Admin API
--    - O gestiona usuarios directamente desde el Dashboard de Supabase > Authentication > Users
-- 
-- 3. La clave ANON (pública) solo permite signUp + signIn normales.
-- ─────────────────────────────────────────────────────────────────
