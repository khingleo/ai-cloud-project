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

1. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_NVIDIA_API_KEY` in the ignored `.env.local` file. Use the Supabase publishable/anon key, never the service-role key. Never commit API keys; rotate any key that has been exposed.
2. Verify your sending domain in Resend and configure its DNS records.
3. In Supabase, open **Authentication → Email → SMTP Settings**, enable custom SMTP, and enter host `smtp.resend.com`, port `465`, username `resend`, a new Resend sending-only API key as the SMTP password, and a sender address on the verified domain.
4. In **Authentication → Email Templates**, set the confirmation and OTP templates to display `{{ .Token }}`. Keep email confirmations enabled.
5. Run `npm run dev`.

The first verified signup receives Staff access. Promote the first Super Admin from the Supabase SQL Editor after the account exists; do not grant elevated roles from frontend code. Business data remains in browser local storage.

The earlier custom-auth migration may have created `app_users`, `app_auth_challenges`, and `app_auth_sessions`. The Supabase Auth flow does not use these tables; leave them untouched unless you separately plan a database cleanup.
