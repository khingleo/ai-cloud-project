create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  access_tier text not null default 'staff' check (access_tier in ('staff', 'admin', 'super_admin')),
  department text not null default 'Enterprise Business Unit',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists app_users_email_lower_idx on public.app_users (lower(email));

create table if not exists public.app_auth_challenges (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  purpose text not null check (purpose in ('login', 'signup')),
  user_id uuid references public.app_users(id) on delete cascade,
  password_hash text,
  pending_name text,
  pending_department text,
  pending_phone text,
  otp_hash text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  expires_at timestamptz not null,
  last_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists app_auth_challenges_email_created_idx
  on public.app_auth_challenges (lower(email), purpose, created_at desc);

create table if not exists public.app_auth_sessions (
  token_hash text primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists app_auth_sessions_user_idx on public.app_auth_sessions (user_id);

alter table public.app_users enable row level security;
alter table public.app_auth_challenges enable row level security;
alter table public.app_auth_sessions enable row level security;

revoke all on public.app_users, public.app_auth_challenges, public.app_auth_sessions from anon, authenticated;
grant all on public.app_users, public.app_auth_challenges, public.app_auth_sessions to service_role;
