-- Farm Linker — full schema, exactly as deployed to the live Supabase
-- project. Run this in a fresh project's SQL Editor to reproduce it.

create extension if not exists "uuid-ossp";

create table profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('Farmer','Buyer','Supplier','Vet')),
  phone text,
  district text default 'Mukono',
  subcounty text,
  avatar_initials text,
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

-- ---------- Storage ----------
insert into storage.buckets (id, name, public) values ('farmlinker-media', 'farmlinker-media', true)
on conflict (id) do nothing;

create policy "public read farmlinker media" on storage.objects for select using (bucket_id = 'farmlinker-media');
create policy "authenticated upload farmlinker media" on storage.objects for insert
with check (bucket_id = 'farmlinker-media' and auth.uid() is not null);
