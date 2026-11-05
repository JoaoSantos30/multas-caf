-- Esquema de referência da Caixinha de Multas.
-- ATENÇÃO: não correr sobre a base de dados em produção.
-- Serve para documentação e para recriar o projeto num Supabase novo.

-- Tabelas ---------------------------------------------------------------

create table public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now(),
  role text not null default 'jogador',
  active boolean not null default true,
  joined_on date
);

create table public.fines (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  reason text not null,
  amount numeric not null check (amount >= 0),
  paid boolean not null default false, -- não usada pelo site
  date date not null default current_date,
  created_at timestamptz default now(),
  kind text not null default 'multa',
  week date,
  game_day boolean not null default false
);

create unique index one_quota_per_week on public.fines (player_id, week)
  where kind = 'quota' and week is not null;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  amount numeric not null check (amount > 0),
  date date not null default current_date,
  note text,
  created_at timestamptz default now()
);

create table public.rules (
  id uuid primary key default gen_random_uuid(),
  reason text not null unique,
  amount numeric not null check (amount >= 0),
  per_minute boolean not null default false
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Outros',
  description text not null,
  amount numeric not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Regras de acesso (RLS) ------------------------------------------------
-- Todos podem ler. Só utilizadores com login podem escrever.
-- O registo de novas contas tem de ficar desativado em Authentication.

alter table public.players enable row level security;
alter table public.fines enable row level security;
alter table public.payments enable row level security;
alter table public.rules enable row level security;
alter table public.expenses enable row level security;

create policy "public read" on public.players for select to anon, authenticated using (true);
create policy "public read" on public.fines for select to anon, authenticated using (true);
create policy "public read" on public.payments for select to anon, authenticated using (true);
create policy "public read" on public.rules for select to anon, authenticated using (true);
create policy "public read" on public.expenses for select to anon, authenticated using (true);

create policy "admin write" on public.players for all to authenticated using (true) with check (true);
create policy "admin write" on public.fines for all to authenticated using (true) with check (true);
create policy "admin write" on public.payments for all to authenticated using (true) with check (true);
create policy "admin write" on public.rules for all to authenticated using (true) with check (true);
create policy "admin write" on public.expenses for all to authenticated using (true) with check (true);

-- Quotas semanais -------------------------------------------------------

create or replace function public.lancar_quotas(
  p_week date default (date_trunc('week', current_date::timestamptz))::date
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n integer;
begin
  insert into fines (player_id, reason, amount, date, kind, week)
  select id, 'Quota semanal', 0.50, p_week, 'quota', p_week
  from players where active and (joined_on is null or joined_on <= p_week)
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $function$;

revoke execute on function public.lancar_quotas(date) from public, anon;
grant execute on function public.lancar_quotas(date) to authenticated;

-- Lançamento automático: segunda-feira às 00:05 UTC.
create extension if not exists pg_cron;

select cron.schedule(
  'lancar-quotas-semanal',
  '5 0 * * 1',
  $$select public.lancar_quotas();$$
);
