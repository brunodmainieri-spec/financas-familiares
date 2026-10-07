-- Schema + RLS para o app de Finanças Familiares
-- Execute este script inteiro no Supabase Dashboard -> SQL Editor -> New query

create extension if not exists "uuid-ossp";

-- 1. Famílias (grupos)
create table if not exists families (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Perfis de usuário
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  family_id uuid references families on delete set null,
  display_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Transações (receitas e despesas)
create table if not exists transactions (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references families on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  amount numeric(12,2) not null,
  type text check (type in ('income', 'expense')) not null,
  category text not null,
  description text,
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Orçamentos (metas mensais)
create table if not exists budgets (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references families on delete cascade not null,
  category text not null,
  limit_amount numeric(12,2) not null,
  month_year text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (family_id, category, month_year)
);

-- Função auxiliar (security definer) para evitar recursão de RLS
-- em "profiles" ao checar a família do usuário logado.
create or replace function public.get_my_family_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select family_id from public.profiles where id = auth.uid()
$$;

alter table families enable row level security;
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;

-- FAMILIES
-- Leitura liberada para qualquer usuário autenticado: necessário para o
-- fluxo de "entrar com código de convite" (join), que busca a família
-- pelo invite_code antes do usuário pertencer a ela.
create policy "Authenticated users can view families" on families
  for select to authenticated using (true);

create policy "Authenticated users can create a family" on families
  for insert to authenticated with check (true);

-- PROFILES
create policy "Users can view own profile or family members" on profiles
  for select to authenticated using (
    id = auth.uid() or family_id = public.get_my_family_id()
  );

create policy "Users can insert own profile" on profiles
  for insert to authenticated with check (id = auth.uid());

create policy "Users can update own profile" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- TRANSACTIONS
create policy "Family members can view transactions" on transactions
  for select to authenticated using (family_id = public.get_my_family_id());

create policy "Family members can insert transactions" on transactions
  for insert to authenticated with check (
    family_id = public.get_my_family_id() and user_id = auth.uid()
  );

create policy "Family members can update transactions" on transactions
  for update to authenticated using (family_id = public.get_my_family_id())
  with check (family_id = public.get_my_family_id());

create policy "Family members can delete transactions" on transactions
  for delete to authenticated using (family_id = public.get_my_family_id());

-- BUDGETS
create policy "Family members can view budgets" on budgets
  for select to authenticated using (family_id = public.get_my_family_id());

create policy "Family members can insert budgets" on budgets
  for insert to authenticated with check (family_id = public.get_my_family_id());

create policy "Family members can update budgets" on budgets
  for update to authenticated using (family_id = public.get_my_family_id())
  with check (family_id = public.get_my_family_id());
