-- Farm Linker — full schema, exactly as deployed to the live Supabase
-- project. Run this in a fresh project's SQL Editor to reproduce it.

create extension if not exists "uuid-ossp";

create table profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('Farmer','Buyer','Supplier','Vet','Admin')),
  phone text,
  district text default 'Mukono',
  subcounty text,
  avatar_initials text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_admin boolean default false,
  is_banned boolean default false,
  created_at timestamptz default now()
);

create table listings (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid references profiles(id) on delete cascade,
  type text not null check (type in ('Live birds','Eggs')),
  title text not null,
  quantity text,
  price numeric(12,2) not null,
  location text not null,
  trace_stamp text unique not null,
  status text default 'active' check (status in ('active','sold','expired')),
  created_at timestamptz default now()
);

create table supplier_products (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid references profiles(id) on delete cascade,
  category text not null check (category in ('Feed','Day-old chicks','Equipment','Drugs & vaccines')),
  name text not null,
  price numeric(12,2) not null,
  location text not null,
  created_at timestamptz default now()
);

create table vets (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  specialty text not null,
  location text not null,
  status text default 'Available' check (status in ('Available','Busy')),
  created_at timestamptz default now()
);

create table vet_requests (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid references profiles(id) on delete cascade,
  vet_id uuid references vets(id),
  issue text not null,
  urgency text default 'Routine' check (urgency in ('Routine','Urgent')),
  location text not null,
  status text default 'open' check (status in ('open','accepted','resolved')),
  created_at timestamptz default now()
);

create table posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references profiles(id) on delete cascade,
  type text default 'Question' check (type in ('Question','Disease alert','Price update')),
  body text not null,
  image_url text,
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('dm','group')),
  title text,
  category text check (category in ('Farmer','Buyer','Supplier','Vet')),
  created_at timestamptz default now()
);

create table conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  unread_count int default 0,
  primary key (conversation_id, profile_id)
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  text text,
  image_url text,
  created_at timestamptz default now()
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid references profiles(id) on delete cascade,
  kind text check (kind in ('message','post')),
  title text not null,
  body text not null,
  read boolean default false,
  target_screen text,
  target_id uuid,
  created_at timestamptz default now()
);

-- Mobile Money provision: records payment REQUESTS, not real charges.
-- See README "Mobile Money provision" section.
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  item_type text not null check (item_type in ('listing','supplier_product')),
  item_id uuid not null,
  buyer_id uuid references profiles(id) on delete cascade,
  seller_id uuid references profiles(id) on delete cascade,
  amount numeric(12,2) not null,
  commission_rate numeric(5,4) not null default 0.05,
  commission_amount numeric(12,2) not null,
  payment_method text check (payment_method in ('MTN Mobile Money','Airtel Money')),
  phone_number text,
  status text not null default 'pending_integration' check (
    status in ('pending_integration','paid','failed','cancelled')
  ),
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- ---------- Row Level Security ----------
alter table profiles enable row level security;
alter table listings enable row level security;
alter table supplier_products enable row level security;
alter table vets enable row level security;
alter table vet_requests enable row level security;
alter table posts enable row level security;
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

create policy "public read profiles" on profiles for select using (true);
create policy "public read listings" on listings for select using (true);
create policy "public read suppliers" on supplier_products for select using (true);
create policy "public read vets" on vets for select using (true);
create policy "public read posts" on posts for select using (true);

create policy "insert own profile" on profiles for insert with check (auth.uid() = auth_id);

-- Lets any authenticated (including anonymous) session "log in as" a demo
-- profile by attaching to it — supports the tap-to-login flow while every
-- write stays attributable and RLS-enforced. See README for the real-auth
-- roadmap (this is intentionally not a password/OTP system yet).
create policy "claim profile" on profiles for update
using (auth.uid() is not null)
with check (auth_id = auth.uid());

create policy "insert own listing" on listings for insert with check (
  farmer_id in (select id from profiles where auth_id = auth.uid())
);
create policy "insert own supplier product" on supplier_products for insert with check (
  supplier_id in (select id from profiles where auth_id = auth.uid())
);
create policy "insert own vet request" on vet_requests for insert with check (
  farmer_id in (select id from profiles where auth_id = auth.uid())
);
create policy "farmer reads own vet requests" on vet_requests for select using (
  farmer_id in (select id from profiles where auth_id = auth.uid())
  or vet_id in (select id from vets where profile_id in (select id from profiles where auth_id = auth.uid()))
);
create policy "vet updates requests" on vet_requests for update using (
  vet_id in (select id from vets where profile_id in (select id from profiles where auth_id = auth.uid()))
  or farmer_id in (select id from profiles where auth_id = auth.uid())
);
create policy "insert own post" on posts for insert with check (
  author_id in (select id from profiles where auth_id = auth.uid())
);

create policy "participants read conversations" on conversations for select using (
  id in (select conversation_id from conversation_participants cp join profiles p on p.id = cp.profile_id where p.auth_id = auth.uid())
);
create policy "participants read participant rows" on conversation_participants for select using (
  profile_id in (select id from profiles where auth_id = auth.uid())
  or conversation_id in (select conversation_id from conversation_participants cp join profiles p on p.id = cp.profile_id where p.auth_id = auth.uid())
);
create policy "participants update own unread" on conversation_participants for update using (
  profile_id in (select id from profiles where auth_id = auth.uid())
);
create policy "participants insert" on conversation_participants for insert with check (
  profile_id in (select id from profiles where auth_id = auth.uid())
);
create policy "participants read messages" on messages for select using (
  conversation_id in (select conversation_id from conversation_participants cp join profiles p on p.id = cp.profile_id where p.auth_id = auth.uid())
);
create policy "participants send messages" on messages for insert with check (
  sender_id in (select id from profiles where auth_id = auth.uid())
  and conversation_id in (select conversation_id from conversation_participants cp join profiles p on p.id = cp.profile_id where p.auth_id = auth.uid())
);
create policy "anyone authenticated can create conversation" on conversations for insert with check (auth.uid() is not null);

create policy "recipient reads notifications" on notifications for select using (
  recipient_id in (select id from profiles where auth_id = auth.uid())
);
create policy "recipient updates notifications" on notifications for update using (
  recipient_id in (select id from profiles where auth_id = auth.uid())
);
create policy "system inserts notifications" on notifications for insert with check (auth.uid() is not null);

alter table transactions enable row level security;
create policy "buyer reads own transactions" on transactions for select using (
  buyer_id in (select id from profiles where auth_id = auth.uid())
  or seller_id in (select id from profiles where auth_id = auth.uid())
);
create policy "buyer creates transactions" on transactions for insert with check (
  buyer_id in (select id from profiles where auth_id = auth.uid())
);

-- ---------- Admin ----------
create or replace function is_admin() returns boolean
language sql security definer stable
set search_path = public as $$
  select coalesce((select is_admin from profiles where auth_id = auth.uid()), false);
$$;

create or replace function is_not_banned() returns boolean
language sql security definer stable
set search_path = public as $$
  select coalesce((select not is_banned from profiles where auth_id = auth.uid()), true);
$$;

create policy "admin reads all vet_requests" on vet_requests for select using (is_admin());
create policy "admin reads all conversations" on conversations for select using (is_admin());
create policy "admin reads all conversation_participants" on conversation_participants for select using (is_admin());
create policy "admin reads all messages" on messages for select using (is_admin());
create policy "admin reads all notifications" on notifications for select using (is_admin());
create policy "admin reads all transactions" on transactions for select using (is_admin());

create policy "admin updates profiles" on profiles for update using (is_admin());
create policy "admin deletes listings" on listings for delete using (is_admin());
create policy "admin updates listings" on listings for update using (is_admin());
create policy "admin deletes supplier_products" on supplier_products for delete using (is_admin());
create policy "admin updates supplier_products" on supplier_products for update using (is_admin());
create policy "admin deletes posts" on posts for delete using (is_admin());
create policy "admin deletes messages" on messages for delete using (is_admin());
create policy "admin deletes vets" on vets for delete using (is_admin());
create policy "admin updates vet_requests_admin" on vet_requests for update using (is_admin());
create policy "admin updates transactions" on transactions for update using (is_admin());

-- Ban enforcement baked directly into the insert policies (defense in
-- depth — a banned user is blocked even if the client-side gate is bypassed)
drop policy if exists "insert own listing" on listings;
create policy "insert own listing" on listings for insert with check (
  is_not_banned() and farmer_id in (select id from profiles where auth_id = auth.uid())
);
drop policy if exists "insert own supplier product" on supplier_products;
create policy "insert own supplier product" on supplier_products for insert with check (
  is_not_banned() and supplier_id in (select id from profiles where auth_id = auth.uid())
);
drop policy if exists "insert own vet request" on vet_requests;
create policy "insert own vet request" on vet_requests for insert with check (
  is_not_banned() and farmer_id in (select id from profiles where auth_id = auth.uid())
);
drop policy if exists "insert own post" on posts;
create policy "insert own post" on posts for insert with check (
  is_not_banned() and author_id in (select id from profiles where auth_id = auth.uid())
);
drop policy if exists "participants send messages" on messages;
create policy "participants send messages" on messages for insert with check (
  is_not_banned() and sender_id in (select id from profiles where auth_id = auth.uid())
  and conversation_id in (select conversation_id from conversation_participants cp join profiles p on p.id = cp.profile_id where p.auth_id = auth.uid())
);

-- Seed one admin account, UNCLAIMED (auth_id null). It does NOT appear in
-- the app's public tap-to-login list and cannot be claimed by the normal
-- anonymous "claim profile" mechanism (see policies below). It can only be
-- linked via real email/password sign-up through the app's hidden
-- "Platform admin? Access here" flow — a one-time bootstrap, first come
-- first served, enforced at the RLS level below.
insert into profiles (id, full_name, role, phone, district, subcounty, is_admin, latitude, longitude)
values ('99999999-9999-9999-9999-999999999999', 'Platform Admin', 'Admin', null, 'Mukono', 'Mukono Town', true, 0.353300, 32.755300);

-- Close the general "tap to claim" mechanism for any admin-flagged row —
-- anonymous or not, it must never work on an admin profile.
drop policy if exists "claim profile" on profiles;
create policy "claim profile" on profiles for update
using (auth.uid() is not null and coalesce(is_admin, false) = false)
with check (auth_id = auth.uid());

-- One-time secure bootstrap: an admin row can only be linked while
-- unclaimed (auth_id is null), and only by a REAL email/password session
-- (never anonymous — checked via the is_anonymous claim in the JWT).
create policy "bootstrap admin claim" on profiles for update
using (coalesce(is_admin, false) = true and auth_id is null)
with check (
  auth_id = auth.uid()
  and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

-- ---------- Storage ----------
insert into storage.buckets (id, name, public) values ('farmlinker-media', 'farmlinker-media', true)
on conflict (id) do nothing;

create policy "public read farmlinker media" on storage.objects for select using (bucket_id = 'farmlinker-media');
create policy "authenticated upload farmlinker media" on storage.objects for insert
with check (bucket_id = 'farmlinker-media' and auth.uid() is not null);
