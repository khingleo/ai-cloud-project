import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AssignedTask {
  id: string;
  title: string;
  assignedToUserId: string;
  assignedTo: string;
  assignedToEmail?: string;
  assignedToRole?: string;
  priority: string;
  dueDate: string;
  category: string;
  customerName?: string;
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);

function isAssignedTask(value: unknown): value is AssignedTask {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const task = value as Record<string, unknown>;
  return typeof task.id === 'string'
    && task.id.trim().length > 0
    && typeof task.title === 'string'
    && task.title.trim().length > 0
    && typeof task.assignedToUserId === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.assignedToUserId)
    && typeof task.assignedTo === 'string'
    && typeof task.priority === 'string'
    && typeof task.dueDate === 'string'
    && typeof task.category === 'string'
    && (task.assignedToEmail === undefined || typeof task.assignedToEmail === 'string')
    && (task.customerName === undefined || typeof task.customerName === 'string');
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Task notification service is not configured.' }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return jsonResponse({ error: 'A valid sign-in is required.' }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'A valid task payload is required.' }, 400);
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body) || !isAssignedTask(body.task)) {
    return jsonResponse({ error: 'The task must include an ID, title, and registered assignee.' }, 400);
  }
  const task = body.task;

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: recipientData, error: recipientError } =
    await adminClient.auth.admin.getUserById(task.assignedToUserId);
  const recipientEmail = recipientData.user?.email;
  if (recipientError || !recipientEmail) {
    return jsonResponse({ error: 'The assigned user does not have a deliverable login email.' }, 400);
  }

  const message = `${authData.user.user_metadata?.full_name || authData.user.email || 'A team member'} assigned you "${task.title}".`;
  const { data: notification, error: notificationError } = await userClient
    .rpc('create_task_assignment_notification', {
      p_task: task,
      p_notification_id: `NOTIF-${crypto.randomUUID()}`,
      p_title: 'New task assigned to you',
      p_message: message,
      p_link: `/tasks?task=${encodeURIComponent(task.id)}`,
    })
    .single();
  if (notificationError || !notification) {
    console.error('Task notification persistence failed:', notificationError?.message || 'No notification returned');
    return jsonResponse({ error: 'The in-app task notification could not be saved.' }, 500);
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromAddress = Deno.env.get('TASK_NOTIFICATION_FROM');
  const appUrl = Deno.env.get('TASK_NOTIFICATION_APP_URL')?.replace(/\/+$/, '');
  if (!resendApiKey || !fromAddress || !appUrl) {
    return jsonResponse({
      notification,
      emailSent: false,
      emailError: 'Email delivery is not configured on the server.',
    });
  }

  const taskUrl = `${appUrl}/tasks?task=${encodeURIComponent(task.id)}`;
  const escapedTitle = escapeHtml(task.title);
  const escapedAssignee = escapeHtml(task.assignedTo || recipientEmail);
  const escapedPriority = escapeHtml(task.priority || 'Normal');
  const escapedCategory = escapeHtml(task.category || 'Task');
  const escapedDueDate = escapeHtml(task.dueDate || 'Not specified');
  const escapedCustomer = escapeHtml(task.customerName || 'Not specified');
  let emailResponse: Response;
  try {
    emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipientEmail],
        subject: `New task assigned: ${task.title.replace(/[\r\n]+/g, ' ').slice(0, 200)}`,
        text: [
          `Hello ${task.assignedTo || recipientEmail},`,
          '',
          `You have been assigned a new task: ${task.title}`,
          `Category: ${task.category || 'Task'}`,
          `Priority: ${task.priority || 'Normal'}`,
          `Due date: ${task.dueDate || 'Not specified'}`,
          `Customer: ${task.customerName || 'Not specified'}`,
          '',
          `View task: ${taskUrl}`,
        ].join('\n'),
        html: `<p>Hello ${escapedAssignee},</p><p>You have been assigned a new task: <strong>${escapedTitle}</strong></p><ul><li>Category: ${escapedCategory}</li><li>Priority: ${escapedPriority}</li><li>Due date: ${escapedDueDate}</li><li>Customer: ${escapedCustomer}</li></ul><p><a href="${escapeHtml(taskUrl)}">View task</a></p>`,
      }),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Email provider request failed.';
    console.error('Task email delivery failed:', detail);
    return jsonResponse({ notification, emailSent: false, emailError: detail });
  }

  if (!emailResponse.ok) {
    console.error('Task email provider rejected the request:', emailResponse.status);
    return jsonResponse({
      notification,
      emailSent: false,
      emailError: `Email delivery failed (provider returned ${emailResponse.status}).`,
    });
  }

  return jsonResponse({ notification, emailSent: true });
});
