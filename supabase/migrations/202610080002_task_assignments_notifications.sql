alter table public.shared_records
  drop constraint if exists shared_records_collection_check;

alter table public.shared_records
  add constraint shared_records_collection_check
  check (
    collection in (
      'customers',
      'subscriptions',
      'network_configs',
      'billing_accounts',
      'invoices',
      'customer_prices',
      'documents',
      'audit_logs',
      'tasks'
    )
  );

create table if not exists public.user_notifications (
  id text primary key,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null,
  title text not null,
  message text not null,
  category text not null default 'Task' check (category = 'Task'),
  created_at timestamptz not null default now(),
  read boolean not null default false,
  link text not null
);

create index if not exists user_notifications_recipient_created_idx
  on public.user_notifications (recipient_id, created_at desc);

alter table public.user_notifications enable row level security;

revoke all on public.user_notifications from public, anon;
grant select, insert, update on public.user_notifications to authenticated;

drop policy if exists "Users read their own notifications" on public.user_notifications;
create policy "Users read their own notifications"
  on public.user_notifications
  for select
  to authenticated
  using (auth.uid() = recipient_id);

drop policy if exists "Authenticated users create task notifications" on public.user_notifications;
create policy "Authenticated users create task notifications"
  on public.user_notifications
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and exists (
      select 1
      from public.shared_records
      where collection = 'tasks'
        and id = task_id
        and data->>'assignedToUserId' = recipient_id::text
    )
  );

drop policy if exists "Users update their own notifications" on public.user_notifications;
create policy "Users update their own notifications"
  on public.user_notifications
  for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'user_notifications'
     ) then
    alter publication supabase_realtime add table public.user_notifications;
  end if;
end;
$$;
