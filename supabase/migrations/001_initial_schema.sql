-- 001_initial_schema.sql

-- Activer l'extension pgcrypto pour uuid_generate_v4() si besoin (Supabase gère généralement ça nativement)
create extension if not exists "uuid-ossp";

-- Table des profils utilisateurs
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text default 'client' check (role in ('client', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table des commandes
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'uploaded' check (status in ('uploaded', 'processing', 'preview_ready', 'pending_payment', 'paid', 'delivered', 'failed')),
  formula text check (formula in ('standard', 'color')),
  chosen_result integer check (chosen_result in (1, 2)),
  original_filename text not null,
  upload_path text not null,
  preview_a_path text,
  preview_b_path text,
  output_a_path text,
  output_b_path text,
  price_fcfa integer,
  paid_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Active le Row Level Security
alter table public.profiles enable row level security;
alter table public.orders enable row level security;

-- Policies pour profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Admins can view all profiles"
  on public.profiles for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

-- Policies pour orders
create policy "Users can view their own orders"
  on public.orders for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own orders"
  on public.orders for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own orders"
  on public.orders for update
  using ( auth.uid() = user_id );

create policy "Admins can view all orders"
  on public.orders for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Admins can update all orders"
  on public.orders for update
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

-- Function pour mettre à jour automatiquement "updated_at"
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();
