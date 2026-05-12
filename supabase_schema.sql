-- Run this entire file in your Supabase SQL editor (Database > SQL Editor > New query)

-- Profiles (created automatically on sign-in via trigger)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  role text default 'client', -- 'trainer' or 'client'
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Clients
create table clients (
  id uuid default gen_random_uuid() primary key,
  trainer_id uuid references profiles(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null, -- linked when client signs in
  name text not null,
  email text not null,
  goal text,
  current_week int default 1,
  created_at timestamptz default now()
);
alter table clients enable row level security;
create policy "Trainers can manage their clients" on clients for all using (auth.uid() = trainer_id);
create policy "Clients can read own record" on clients for select using (auth.uid() = user_id);

-- Circuits
create table circuits (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  trainer_id uuid references profiles(id) on delete cascade,
  name text not null,
  type text default 'circuit', -- 'circuit', 'amrap', 'emom'
  sets int default 3,
  amrap_duration text default '10 min',
  emom_duration text default '10 min',
  rest_after text default '60s',
  position int default 0,
  created_at timestamptz default now()
);
alter table circuits enable row level security;
create policy "Trainers can manage circuits" on circuits for all using (auth.uid() = trainer_id);
create policy "Clients can read their circuits" on circuits for select using (
  exists (select 1 from clients where id = circuit_id and user_id = auth.uid())
);

-- Exercises
create table exercises (
  id uuid default gen_random_uuid() primary key,
  circuit_id uuid references circuits(id) on delete cascade,
  name text not null,
  sets int default 3,
  reps text default '10',
  position int default 0,
  created_at timestamptz default now()
);
alter table exercises enable row level security;
create policy "Trainers can manage exercises" on exercises for all using (
  exists (select 1 from circuits c join clients cl on cl.id = c.client_id where c.id = circuit_id and cl.trainer_id = auth.uid())
);
create policy "Clients can read their exercises" on exercises for select using (
  exists (select 1 from circuits c join clients cl on cl.id = c.client_id where c.id = circuit_id and cl.user_id = auth.uid())
);

-- Messages
create table messages (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text not null,
  attachment_type text, -- 'w' for workout, 'p' for photo
  is_checkin boolean default false,
  created_at timestamptz default now()
);
alter table messages enable row level security;
create policy "Trainers can manage messages" on messages for all using (
  exists (select 1 from clients where id = client_id and trainer_id = auth.uid())
);
create policy "Clients can read and send messages" on messages for all using (
  exists (select 1 from clients where id = client_id and user_id = auth.uid())
);

-- Enable realtime for messages
alter publication supabase_realtime add table messages;
