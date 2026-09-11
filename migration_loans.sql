-- Run this in your Supabase SQL Editor. This only adds the two new
-- tables for loan tracking — safe to run even though you already ran
-- the original schema.sql, since it doesn't touch your existing tables.

create table loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lender_name text not null,
  lender_type text not null default 'person', -- 'person' | 'tabby' | 'botim' | 'bank' | 'other'
  original_amount numeric not null,
  due_date date,
  encrypted_notes text,
  created_at timestamptz default now()
);

create table loan_payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  paid_on date not null default current_date,
  encrypted_note text,
  created_at timestamptz default now()
);

alter table loans enable row level security;
alter table loan_payments enable row level security;

create policy "own rows only" on loans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on loan_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
