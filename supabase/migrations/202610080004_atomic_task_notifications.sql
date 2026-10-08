create or replace function public.create_task_assignment_notification(
  p_task jsonb,
  p_notification_id text,
  p_title text,
  p_message text,
  p_link text
)
returns setof public.user_notifications
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_task_id text;
  v_recipient_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to assign a task';
  end if;

  if p_task is null
     or jsonb_typeof(p_task) is distinct from 'object'
     or nullif(p_task->>'id', '') is null
     or nullif(p_task->>'assignedToUserId', '') is null then
    raise exception 'A task ID and registered assignee are required';
  end if;

  if nullif(p_notification_id, '') is null
     or nullif(p_title, '') is null
     or nullif(p_message, '') is null
     or nullif(p_link, '') is null then
    raise exception 'Notification details are required';
  end if;

  v_task_id := p_task->>'id';
  v_recipient_id := (p_task->>'assignedToUserId')::uuid;

  insert into public.shared_records (collection, id, data, updated_at)
  values ('tasks', v_task_id, p_task, clock_timestamp())
  on conflict (collection, id) do update
    set data = excluded.data,
        updated_at = excluded.updated_at;

  return query
  insert into public.user_notifications (
    id,
    recipient_id,
    task_id,
    title,
    message,
    category,
    read,
    link
  )
  values (
    p_notification_id,
    v_recipient_id,
    v_task_id,
    p_title,
    p_message,
    'Task',
    false,
    p_link
  )
  returning user_notifications.*;
end;
$function$;

revoke all on function public.create_task_assignment_notification(jsonb, text, text, text, text)
  from public, anon;
grant execute on function public.create_task_assignment_notification(jsonb, text, text, text, text)
  to authenticated;

drop policy if exists "Authenticated users create task notifications" on public.user_notifications;
revoke insert on public.user_notifications from authenticated;
