-- RoV Pastel Top-up starter schema
-- Run in Supabase SQL Editor. Review RLS policies before production.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  title text not null,
  amount_label text not null,
  price numeric(10,2) not null check (price >= 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id text references public.products(id),
  product_name text not null,
  amount_label text not null,
  price numeric(10,2) not null check (price >= 0),
  player_uid text not null,
  player_name text,
  customer_contact text not null,
  payment_method text not null check (payment_method in ('promptpay','bank_transfer')),
  payment_slip_path text,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment','queued','processing','completed','cancelled')),
  queue_number bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.queue_number_seq;

create unique index if not exists orders_queue_number_unique
on public.orders(queue_number) where queue_number is not null;

create table if not exists public.shop_settings (
  id int primary key default 1 check (id = 1),
  shop_name text not null default 'ชื่อร้านของคุณ',
  logo_url text,
  promptpay_qr_url text,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  line_url text,
  facebook_url text,
  instagram_url text,
  announcement text,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  channel text not null check (channel in ('web','line')),
  message text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Public storefront may read active product list.
alter table public.products enable row level security;
create policy "Public can read active products"
on public.products for select using (active = true);

-- Intentionally no public insert/select policies for orders.
-- Create orders through a Supabase Edge Function that validates input,
-- inserts order and returns a safe order reference. Admin actions must be
-- performed server-side after verifying an authenticated admin role.
alter table public.orders enable row level security;
alter table public.shop_settings enable row level security;
alter table public.notifications enable row level security;

-- Do not expose orders, customer contact details, slips, or admin settings
-- with anon policies. Add authenticated admin policies only after setting up
-- an admin role and server-side authorization.
