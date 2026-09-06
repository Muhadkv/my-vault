-- Run this once in your Supabase project's SQL Editor.
-- Every table has Row Level Security enabled so a user can only ever
-- read/write their own rows, even though the anon key is public.

-- One row per user, stores the encrypted "verifier" used to check the
-- master password locally, and lets us know a vault has been set up.
create table vault_meta (
  user_id uuid primary key references auth.users(id) on delete cascade,
  verifier text not null,
  created_at timestamptz default now()
);

-- Password categories, e.g. "Google", "Banking", "Work"
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text default 'folder',
  color text default '#3FA796',
  created_at timestamptz default now()
);

-- Password entries. `encrypted_data` holds everything sensitive
-- (username, password, notes, url) as one AES-GCM encrypted blob.
-- Only non-sensitive metadata (title, category) is stored in the clear
-- so the list view can render without unlocking every single item.
create table password_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  encrypted_data text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Expenses. Amounts/notes are encrypted; category + date stay in the
-- clear so charts and filters can run without decrypting every row.
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric not null,
  spent_on date not null default current_date,
  encrypted_note text,
  is_recurring boolean default false,
  recurring_interval text, -- 'monthly' | 'weekly' | 'yearly'
  created_at timestamptz default now()
);

-- Budgets per category, used for the "close to limit" warnings.
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric not null,
  unique(user_id, category)
);

alter table vault_meta enable row level security;
alter table categories enable row level security;
alter table password_items enable row level security;
alter table expenses enable row level security;
alter table budgets enable row level security;

create policy "own rows only" on vault_meta
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on password_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
