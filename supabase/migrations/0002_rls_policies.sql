-- Row Level Security: every user-owned row is gated by auth.uid().
-- Clients never use the service role.

alter table public.users enable row level security;
alter table public.credit_cards enable row level security;
alter table public.transactions enable row level security;
alter table public.notification_preferences enable row level security;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- credit_cards
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view own cards" on public.credit_cards;
create policy "Users can view own cards"
  on public.credit_cards for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cards" on public.credit_cards;
create policy "Users can insert own cards"
  on public.credit_cards for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cards" on public.credit_cards;
create policy "Users can update own cards"
  on public.credit_cards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cards" on public.credit_cards;
create policy "Users can delete own cards"
  on public.credit_cards for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.credit_cards c
      where c.id = card_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- notification_preferences
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view own notification prefs" on public.notification_preferences;
create policy "Users can view own notification prefs"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notification prefs" on public.notification_preferences;
create policy "Users can insert own notification prefs"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification prefs" on public.notification_preferences;
create policy "Users can update own notification prefs"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notification prefs" on public.notification_preferences;
create policy "Users can delete own notification prefs"
  on public.notification_preferences for delete
  using (auth.uid() = user_id);
