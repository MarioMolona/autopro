-- ============================================================================
-- AutoPro · Migración 001 — esquema base para notificaciones y trazabilidad
-- ============================================================================
-- Convención del proyecto (respetarla SIEMPRE):
--   · Tablas en snake_case   → cards, card_assignees, push_subscriptions
--   · Columnas en camelCase  → "columnId", "createdAt", "isAiAgent"
--   No mezclar ambos estilos.
--
-- Notas del estado real (verificado 2026-10):
--   · users YA tiene isAiAgent, role, isActive → no hay que crearlo.
--   · notifications YA existe (userId, type, payload, isRead, createdAt).
--   · No existe tabla attachments: los adjuntos son arreglos dentro de
--     cards.attachments y comments.attachments.
-- ============================================================================

-- 1) MARCA DE ACTUALIZACIÓN -----------------------------------------------
-- Necesaria para Realtime, historial y para detectar actividad real.
alter table cards     add column if not exists "updatedAt" timestamptz not null default now();
alter table "columns" add column if not exists "updatedAt" timestamptz not null default now();
alter table comments  add column if not exists "updatedAt" timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end $$;

drop trigger if exists trg_cards_updated_at on cards;
create trigger trg_cards_updated_at before update on cards
  for each row execute function public.set_updated_at();

drop trigger if exists trg_columns_updated_at on "columns";
create trigger trg_columns_updated_at before update on "columns"
  for each row execute function public.set_updated_at();

drop trigger if exists trg_comments_updated_at on comments;
create trigger trg_comments_updated_at before update on comments
  for each row execute function public.set_updated_at();

-- 2) AVISOS POR COLUMNA ----------------------------------------------------
alter table "columns" add column if not exists "notifyOnEnter" boolean not null default false;

-- 3) SUSCRIPCIONES DE PUSH (web push del navegador) -----------------------
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  "userId"    text not null references users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  "userAgent" text,
  "createdAt" timestamptz not null default now(),
  active      boolean not null default true
);

-- 4) PREFERENCIAS POR USUARIO Y COLUMNA -----------------------------------
create table if not exists notification_prefs (
  "userId"    text not null references users(id) on delete cascade,
  "columnId"  text not null references "columns"(id) on delete cascade,
  active      boolean not null default true,
  "updatedAt" timestamptz not null default now(),
  primary key ("userId", "columnId")
);

-- 5) HISTORIAL DE LA TARJETA Y AUDITORÍA ----------------------------------
create table if not exists activity_log (
  id           bigserial primary key,
  "cardId"     text references cards(id) on delete cascade,
  "actorId"    text references users(id),
  "actionType" text not null,
  "oldValue"   jsonb,
  "newValue"   jsonb,
  "createdAt"  timestamptz not null default now()
);
create index if not exists activity_log_card_idx on activity_log ("cardId", "createdAt" desc);

create table if not exists audit_log (
  id             bigserial primary key,
  "actorId"      text references users(id),
  action         text not null,
  "resourceType" text not null,
  "resourceId"   text,
  "metadataJson" jsonb,
  "createdAt"    timestamptz not null default now()
);

-- 6) EL HISTORIAL SE LLENA POR DISPARADOR, NO DESDE EL FRONTEND -----------
-- Así ningún cliente puede saltárselo.
create or replace function public.log_card_activity()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into activity_log("cardId", "actorId", "actionType", "newValue")
    values (new.id, new."createdBy", 'card_created', to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    if new."columnId" is distinct from old."columnId" then
      insert into activity_log("cardId", "actorId", "actionType", "oldValue", "newValue")
      values (new.id, coalesce(new."createdBy", old."createdBy"), 'card_moved',
              to_jsonb(old."columnId"), to_jsonb(new."columnId"));
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_cards_activity on cards;
create trigger trg_cards_activity after insert or update on cards
  for each row execute function public.log_card_activity();

-- 7) RLS EN LAS TABLAS NUEVAS --------------------------------------------
alter table push_subscriptions enable row level security;
alter table notification_prefs  enable row level security;
alter table activity_log        enable row level security;
alter table audit_log           enable row level security;

-- Políticas provisionales: cualquier usuario autenticado puede leer y escribir.
-- NOTA: hoy users.id es tipo 'usr-001' y no está ligado a auth.uid() (la app
-- mapea por email). El permiso fino por rol y el audit_log solo para
-- administrador se definen en la migración 002, cuando exista ese enlace.
create policy "auth_lectura" on push_subscriptions for select to authenticated using (true);
create policy "auth_escritura" on push_subscriptions for insert to authenticated with check (true);
create policy "auth_actualiza" on push_subscriptions for update to authenticated using (true) with check (true);

create policy "auth_lectura" on notification_prefs for select to authenticated using (true);
create policy "auth_escritura" on notification_prefs for insert to authenticated with check (true);
create policy "auth_actualiza" on notification_prefs for update to authenticated using (true) with check (true);

create policy "auth_lectura" on activity_log for select to authenticated using (true);
create policy "auth_escritura" on activity_log for insert to authenticated with check (true);
