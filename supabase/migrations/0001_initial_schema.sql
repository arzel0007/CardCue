-- CardCue initial schema
-- Normalized, user-scoped, RLS on every table.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- users (Supabase auth.users mirror / profile)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  preferred_currency text not null default 'PHP',
  timezone text not null default 'UTC',
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- credit_cards
-- NEVER store full PAN, CVV, PIN, or bank credentials.
-- ---------------------------------------------------------------------------
create table if not exists public.credit_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  nickname text not null,
  issuer text not null,
  card_type text,
  last_four_digits text not null check (last_four_digits ~ '^[0-9]{4}$'),
  credit_limit numeric(12, 2) not null default 0 check (credit_limit >= 0),
  personal_cycle_limit numeric(12, 2) check (personal_cycle_limit is null or personal_cycle_limit >= 0),
  statement_day int not null check (statement_day between 1 and 31),
  due_day int not null check (due_day between 1 and 31),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credit_cards_user_id_idx on public.credit_cards (user_id);
create index if not exists credit_cards_user_archived_idx on public.credit_cards (user_id, is_archived);

-- ---------------------------------------------------------------------------
-- transactions (user-entered)
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  card_id uuid not null references public.credit_cards (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  transaction_date date not null,
  category text not null default 'Other',
  merchant text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_card_date_idx
  on public.transactions (user_id, card_id, transaction_date desc);
create index if not exists transactions_card_date_idx
  on public.transactions (card_id, transaction_date);

-- ---------------------------------------------------------------------------
-- notification_preferences
-- card_id null = global default for the user
-- ---------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  card_id uuid references public.credit_cards (id) on delete cascade,
  statement_7_days boolean not null default true,
  statement_3_days boolean not null default true,
  statement_1_day boolean not null default true,
  statement_generated boolean not null default true,
  due_7_days boolean not null default true,
  due_3_days boolean not null default true,
  due_1_day boolean not null default true,
  due_date boolean not null default true,
  threshold_50 boolean not null default false,
  threshold_75 boolean not null default true,
  threshold_90 boolean not null default true,
  threshold_100 boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, card_id)
);

create index if not exists notification_preferences_user_idx
  on public.notification_preferences (user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists credit_cards_set_updated_at on public.credit_cards;
create trigger credit_cards_set_updated_at
  before update on public.credit_cards
  for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();
