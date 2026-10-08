# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Supabase Auth and Resend SMTP

Supabase Auth generates and verifies passwordless email OTPs for sign-in and signup. Resend is only the SMTP delivery provider; do not put a Resend API key in Vite or frontend code.

### Setup

1. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `NVIDIA_API_KEY` in the ignored `.env.local` file. Use the Supabase publishable/anon key, never the service-role key. Get an NVIDIA NIM API key from [NVIDIA Nemotron 3.5 Lightning](https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b). The key is used only by the local proxy and server-side Vercel function; never give it a `VITE_` prefix or commit it.
2. Verify your sending domain in Resend and configure its DNS records.
3. In Supabase, open **Authentication → Email → SMTP Settings**, enable custom SMTP, and enter host `smtp.resend.com`, port `465`, username `resend`, a new Resend sending-only API key as the SMTP password, and a sender address on the verified domain.
4. In **Authentication → Email Templates**, set the confirmation and OTP templates to display `{{ .Token }}`. Keep email confirmations enabled.
5. Run `npm run dev`.

For Vercel, add `NVIDIA_API_KEY` as a Secret environment variable. The Supabase URL and publishable/anon key are browser-safe values and may be configured as Config variables. Redeploy after changing environment variables.

The first verified signup receives Staff access. Promote the first Super Admin from the Supabase SQL Editor after the account exists; do not grant elevated roles from frontend code.

### Task assignment notifications

Task assignments are persisted as in-app notifications and emailed to the assigned user's registered Supabase Auth email. The email is sent server-side through Resend; never expose the Resend API key or Supabase service-role key to the browser.

1. Apply `supabase/migrations/202610080002_task_assignments_notifications.sql` and then `supabase/migrations/202610080004_atomic_task_notifications.sql` to the Supabase project.
2. Deploy the Edge Function with `supabase functions deploy task-assignment-notification`.
3. Configure these Edge Function secrets in Supabase: `RESEND_API_KEY` (Resend sending key), `TASK_NOTIFICATION_FROM` (sender on the verified Resend domain), and `TASK_NOTIFICATION_APP_URL` (public app origin, such as `https://your-app.example.com`). Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to the Edge Function runtime.
4. Deploy the frontend that invokes the Edge Function. If email delivery fails, the in-app notification is retained and the task page reports the email failure separately.

### Shared customer data

Before using customer dossiers, apply `supabase/migrations/202610080001_shared_customer_records.sql` to the Supabase project (for example, paste and run it in the Supabase SQL Editor). It creates the shared JSONB record table, authenticated-user read/write policies, indexes, and Realtime publication entry. All authenticated users share the same customer records. Existing browser-local, user-added records are merged into the shared table on the first successful sign-in; built-in sample/seed records are not migrated. Local storage is only a cache. A visible application error indicates when the migration or database access is not configured.

The earlier custom-auth migration may have created `app_users`, `app_auth_challenges`, and `app_auth_sessions`. The Supabase Auth flow does not use these tables; leave them untouched unless you separately plan a database cleanup.
