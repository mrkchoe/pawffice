-- Pawffice Supabase schema
-- Run in the Supabase SQL editor (or via supabase db push).

create extension if not exists "pgcrypto";

create type user_role as enum ('wfh', 'shelter');
create type dog_size as enum ('small', 'medium', 'large');
create type energy_level as enum ('low', 'medium', 'high');
create type size_preference as enum ('small', 'medium', 'large', 'no_preference');
create type energy_preference as enum ('low', 'medium', 'high', 'no_preference');
create type background_check_status as enum ('not_started', 'pending', 'approved', 'rejected');
create type appointment_status as enum ('scheduled', 'completed', 'cancelled');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'wfh',
  name text not null,
  email text not null unique,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists shelters (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  description text,
  availability jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists dogs (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references shelters(id) on delete cascade,
  name text not null,
  photo_url text,
  age_years numeric,
  breed text,
  sex text check (sex in ('male', 'female')),
  size dog_size not null,
  energy_level energy_level not null,
  temperament_tags text[] not null default '{}',
  description text,
  exercise_minutes int not null default 30,
  good_with_dogs boolean default true,
  good_with_cats boolean default true,
  good_with_children boolean default true,
  special_needs text,
  interaction_types text[] not null default '{}',
  availability jsonb not null default '[]'::jsonb,
  location text,
  distance_miles numeric default 0,
  created_at timestamptz not null default now()
);

create table if not exists user_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  wfh_schedule text,
  availability jsonb not null default '[]'::jsonb,
  housing_type text,
  pets_allowed boolean default true,
  has_yard boolean default false,
  dog_experience text,
  preferred_size size_preference not null default 'no_preference',
  preferred_energy energy_preference not null default 'no_preference',
  max_exercise_minutes int not null default 45,
  interested_in text[] not null default '{}',
  temperament_preferences text[] not null default '{}',
  max_distance_miles numeric not null default 25,
  updated_at timestamptz not null default now()
);

create table if not exists user_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  day_of_week text not null,
  start_time time not null,
  end_time time not null
);

create table if not exists dog_availability (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  day_of_week text not null,
  start_time time not null,
  end_time time not null
);

create table if not exists background_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  status background_check_status not null default 'not_started',
  provider text not null default 'mock_checkr',
  submitted_at timestamptz,
  decided_at timestamptz,
  notes text
);

create table if not exists saved_dogs (
  user_id uuid not null references profiles(id) on delete cascade,
  dog_id uuid not null references dogs(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, dog_id)
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  dog_id uuid not null references dogs(id) on delete cascade,
  score int not null,
  reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, dog_id)
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  dog_id uuid not null references dogs(id) on delete cascade,
  shelter_id uuid not null references shelters(id) on delete cascade,
  interaction_type text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'scheduled',
  calendar_event_id text,
  calendar_provider text not null default 'mock',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists dogs_shelter_idx on dogs(shelter_id);
create index if not exists appointments_user_idx on appointments(user_id);
create index if not exists appointments_shelter_idx on appointments(shelter_id);
create index if not exists saved_dogs_user_idx on saved_dogs(user_id);

alter table profiles enable row level security;
alter table shelters enable row level security;
alter table dogs enable row level security;
alter table user_preferences enable row level security;
alter table background_checks enable row level security;
alter table saved_dogs enable row level security;
alter table matches enable row level security;
alter table appointments enable row level security;

-- Demo-friendly policies (tighten for production)
create policy "Public read dogs" on dogs for select using (true);
create policy "Public read shelters" on shelters for select using (true);
create policy "Users manage own profile" on profiles for all using (auth.uid() = id);
create policy "Users manage own prefs" on user_preferences for all using (auth.uid() = user_id);
create policy "Users manage own bg check" on background_checks for all using (auth.uid() = user_id);
create policy "Users manage saved dogs" on saved_dogs for all using (auth.uid() = user_id);
create policy "Users manage matches" on matches for all using (auth.uid() = user_id);
create policy "Users manage appointments" on appointments for all using (auth.uid() = user_id);
