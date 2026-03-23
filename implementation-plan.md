# Implementation plan — Visitor Management System

This document outlines how to implement, configure, and deploy the self-service visitor check-in app end-to-end. Use it alongside **README.md** (detailed setup) and **table.md** (column reference).

---

## 1. Goals and scope

| Goal | Outcome |
|------|---------|
| Visitors submit requests without logging in | Check-in form inserts into `visitors` with status `PENDING` |
| Staff review and control access | Admins sign in, approve/reject, check in/out, see audit trail |
| Visitor communication | EmailJS notifies host on new request; optional email to visitor on approve/reject (same template ID as configured in code — see §4) |
| On-site verification | QR links to `/visit/:id` (scan toggles `APPROVED` → `CHECKED_IN` → `CHECKED_OUT`); printable badge at `/badge` |

**Out of scope for the current frontend-only app:** server-side webhooks, hiding Supabase anon key, or SMTP for approval mail without EmailJS.

---

## 2. Architecture (as implemented)

```
Visitor (browser, anon)          Admin (browser, Supabase Auth)
        |                                    |
        v                                    v
   CheckIn.tsx                         AdminDashboard.tsx
        |                                    |
        +------------ Supabase REST ----------+------------+
        |  visitors | admins | admin_whitelist | audit_log |
        +---------------------------------------------------+
EmailJS (host notify, approve/reject HTML) — client-side, public key only
```

**Routes:** `/`, `/check-in`, `/admin/login`, `/admin-create`, `/admin`, `/visit/:id`, `/badge`

---

## 3. Implementation phases

### Phase A — Supabase project

1. Create a Supabase project.
2. Note **Project URL** and **anon public key** for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. **Authentication:** configure email provider (e.g. custom SMTP via Resend per README) if you use email confirmation for admin sign-up.
4. For local admin creation without email friction: disable “Confirm email” for development if your team policy allows it (see README admin-create notes).

**Exit criteria:** You can open the SQL editor and Auth dashboard.

---

### Phase B — Database schema and RLS

1. Run the DDL in **README.md** (or mirror **table.md**) for:
   - `audit_log` (+ insert policy for `anon` and `authenticated`)
   - `visitors` (+ RLS: anon insert, authenticated read/update)
   - `admins`, `admin_whitelist` (+ policies as in README)
2. Ensure **`visitors.updated_at`** exists and the **`visitors_updated_at`** trigger is applied (admin UI shows created/updated times).
3. Add **`floor`** if not in base DDL:

   ```sql
   alter table public.visitors add column if not exists floor text;
   ```

4. Revisit RLS for production: restrict who can read/update `visitors` if you move beyond “any authenticated user” (e.g. policy tied to `admins`).

**Exit criteria:** Tables exist; anon can insert `visitors`; authenticated admin session can select/update `visitors`.

---

### Phase C — Admin users and whitelist

1. Insert allowed admin emails into **`admin_whitelist`**.
2. Create Supabase Auth users (or use `/admin-create` after whitelist + policies allow insert into `admins`).
3. Ensure each active admin has a row in **`admins`** with matching **`user_id`** (`auth.users.id`).

**Exit criteria:** `/admin/login` succeeds; `/admin` loads visitor list.

---

### Phase D — Frontend environment

1. Copy `.env.example` → `.env` (do not commit secrets).
2. Set Supabase variables.
3. Set EmailJS:
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`
   - `VITE_EMAILJS_ADMIN_NOTIFY_TEMPLATE_ID` — used for **host notification** (CheckIn) and for **visitor approve/reject HTML** (AdminDashboard) in the current code. Template should accept `{{message}}` (and To field `{{email}}` / `{{to_email}}` as documented in `src/lib/emailTemplates.ts` / README).

**Exit criteria:** `npm run dev` runs; check-in can submit; emails send when keys/templates match.

---

### Phase E — EmailJS templates

1. **Admin notify (new visitor):** body includes visitor summary + admin link; variables aligned with `CheckIn.tsx` / README.
2. **Approval / rejection:** HTML built in `getApprovalMessage` / `getRejectionMessage` — EmailJS template should pass through `{{message}}` (or equivalent) so QR/badge links render.

**Exit criteria:** Host receives email on submit; visitor receives email on approve/reject when email is present and env is set.

---

### Phase F — Verification checklist (QA)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Submit check-in as visitor | Row `PENDING`; optional host email |
| 2 | Approve with duration + floor | `APPROVED`, `duration_minutes`, `floor` set; visitor email if configured |
| 3 | Open badge link from email | `/badge` shows visitor + floor + QR |
| 4 | Scan QR (`/visit/:id`) while `APPROVED` | `CHECKED_IN`, success UI shows floor if set |
| 5 | Scan again while `CHECKED_IN` | `CHECKED_OUT` |
| 6 | Reject pending | `REJECTED`, `notes` if provided |
| 7 | Admin dashboard | Filters, detail panel, created/updated timestamps, audit tab |

---

### Phase G — Deployment

1. Build: `npm run build`.
2. Host static assets (Vercel, Netlify, S3+CloudFront, etc.).
3. Set production env vars on the host (same `VITE_*` names).
4. **Supabase Auth:** add production URL to redirect allow list.
5. **CORS / site URL:** ensure Supabase Auth “Site URL” matches deployed origin.
6. QR codes and badge links use `window.location.origin` — production domain must be correct.

**Exit criteria:** Production URL completes Phases F1–F4 against production Supabase.

---

## 4. Known implementation notes

- **EmailJS template for approvals:** `AdminDashboard.tsx` uses `VITE_EMAILJS_ADMIN_NOTIFY_TEMPLATE_ID` for visitor-facing approve/reject mail. If you want a separate layout, add a new env var and a small code change to select it.
- **QR image URL:** Approval email uses a third-party QR API URL; ensure that is acceptable for privacy/policy or replace with a self-hosted or inline generator later.
- **Public anon key:** All visitor and audit inserts from the browser use the anon key; RLS is your security boundary.

---

## 5. Optional roadmap (future work)

| Item | Benefit |
|------|---------|
| Dedicated `VITE_EMAILJS_APPROVAL_TEMPLATE_ID` | Separate styling for visitor vs host emails |
| Edge Function or backend for email | Remove EmailJS from client; hide template logic |
| Stricter RLS | Only `admins` can update `visitors` |
| Rate limiting / CAPTCHA on check-in | Reduce spam submissions |
| Export visitor log (CSV) | Reporting |
| i18n | Multi-language UI |

---

## 6. Reference files

| Area | Location |
|------|----------|
| Routes | `src/App.tsx` |
| Supabase client | `src/lib/supabase.ts` |
| Check-in insert + host email | `src/pages/CheckIn.tsx` |
| Admin queue, approve/reject, audit | `src/pages/AdminDashboard.tsx` |
| Email HTML bodies | `src/lib/emailTemplates.ts` |
| QR scan flow | `src/pages/VisitorQrCheckIn.tsx` |
| Printable badge | `src/pages/VisitorBadge.tsx` |
| Schema notes | `table.md` |

---

*Last aligned with repo behavior: visitor `floor`, admin dashboard timestamps, EmailJS env usage as in `AdminDashboard.tsx` and `CheckIn.tsx`.*
