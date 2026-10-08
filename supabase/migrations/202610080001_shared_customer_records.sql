create table if not exists public.shared_records (
  collection text not null check (
    collection in (
      'customers',
      'subscriptions',
      'network_configs',
      'billing_accounts',
      'invoices',
      'customer_prices',
      'documents',
      'audit_logs'
    )
  ),
  id text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id),
  check (data ? 'id' and data->>'id' = id)
);

create index if not exists shared_records_collection_idx
  on public.shared_records (collection);

create index if not exists shared_records_customer_idx
  on public.shared_records (collection, (data->>'customerId'))
  where data ? 'customerId';

alter table public.shared_records enable row level security;

revoke all on public.shared_records from public, anon;
grant select, insert, update, delete on public.shared_records to authenticated;

drop policy if exists "Authenticated users share customer records" on public.shared_records;
create policy "Authenticated users share customer records"
  on public.shared_records
  for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'shared_records'
     ) then
    alter publication supabase_realtime add table public.shared_records;
  end if;
end;
$$;
