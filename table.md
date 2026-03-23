# Database tables used by this app

Backend: **Supabase** (`public` schema unless noted). Table names match `supabase.from("…")` in the codebase.

## Summary

| Table (schema)           | Purpose | Sample data (illustrative) |
|--------------------------|---------|----------------------------|
| `public.visitors`        | Visitor check-in requests, status, check-in/out times, approved floor | One row: Jane Doe, `PENDING` → `APPROVED` (with `duration_minutes`, `floor`) → `CHECKED_IN` |
| `public.admins`          | Maps Supabase Auth users to admin records (host list + access) | `email`: `admin@school.edu`, `name`: `Ms. Lee`, `user_id` matches `auth.users` |
| `public.admin_whitelist` | Emails allowed to sign in or self-register as admin | `email`: `admin@school.edu` |
| `public.audit_log`       | Append-only audit events (login, check-in, status changes, etc.) | `action`: `ADMIN_LOGIN`, `user_id`: Supabase user id string |
| `auth.users`             | Supabase-managed; `admins.user_id` references it (not queried directly as a table in app code) | *(managed by Supabase — e.g. same user as admin row above)* |

---

## `public.visitors`

| Column             | Type         | Notes | Sample data |
|--------------------|--------------|-------|-------------|
| `id`               | uuid         | PK, default `gen_random_uuid()` | `3f8b2c1a-4d5e-6f70-a891-234567890abc` |
| `full_name`        | text         | Required | `Jane Doe` |
| `email`            | text         | Optional | `jane.doe@example.com` |
| `phone`            | text         | Optional | `+1 555-0100` |
| `purpose`          | text         | Required | `Parent–teacher conference` |
| `host_name`        | text         | Required | `Ms. Lee` |
| `appointment_time` | timestamptz  | Optional | `2025-03-24T14:00:00.000Z` |
| `duration_minutes` | integer      | Optional (set when admin approves) | `30` |
| `floor`            | text         | Optional (set when admin approves; shown in email, badge, QR flow) | `2` or `3B` |
| `status`           | text         | `PENDING` \| `APPROVED` \| `REJECTED` \| `CHECKED_IN` \| `CHECKED_OUT` | `CHECKED_IN` |
| `checked_in_at`    | timestamptz  | Optional | `2025-03-24T14:05:00.000Z` |
| `checked_out_at`   | timestamptz  | Optional | *(null until checkout)* |
| `notes`            | text         | Optional (e.g. rejection reason) | *(null)* or `No ID badge visible` if rejected |
| `created_at`       | timestamptz  | Default `now()` | `2025-03-24T13:00:00.000Z` |
| `updated_at`       | timestamptz  | Default `now()` | `2025-03-24T14:05:00.000Z` |

**Used in:** `src/pages/CheckIn.tsx` (insert), `src/pages/AdminDashboard.tsx` (select, update), `src/pages/VisitorBadge.tsx` (select), `src/pages/VisitorQrCheckIn.tsx` (select, update).

**Migration:** If `floor` is missing in Supabase, run: `alter table public.visitors add column if not exists floor text;`

---

## `public.admins`

| Column       | Type        | Notes | Sample data |
|--------------|-------------|-------|-------------|
| `id`         | uuid        | PK | `a7e6d5c4-b3a2-1098-7654-3210fedcba98` |
| `user_id`    | uuid        | FK → `auth.users(id)` | `b8f7e6d5-c4b3-2109-8765-43210fedcba9` *(same as Auth user)* |
| `email`      | text        | Required | `admin@school.edu` |
| `name`       | text        | Optional | `Ms. Lee` |
| `created_at` | timestamptz | Default `now()` | `2025-01-15T09:00:00.000Z` |

**Used in:** `src/pages/CheckIn.tsx` (select — host dropdown), `src/pages/AdminLogin.tsx` (select), `src/pages/AdminCreate.tsx` (insert), `src/pages/AdminDashboard.tsx` (select).

---

## `public.admin_whitelist`

| Column       | Type        | Notes | Sample data |
|--------------|-------------|-------|-------------|
| `id`         | uuid        | PK | `c9d8e7f6-a5b4-3210-9876-543210fedcba` |
| `email`      | text        | Unique | `admin@school.edu` |
| `created_at` | timestamptz | Default `now()` | `2025-01-01T12:00:00.000Z` |

**Used in:** `src/pages/AdminLogin.tsx` (select), `src/pages/AdminCreate.tsx` (select), `src/pages/AdminDashboard.tsx` (select).

---

## `public.audit_log`

| Column      | Type        | Notes | Sample data |
|-------------|-------------|-------|-------------|
| `log_id`    | uuid        | PK | `d0e1f2a3-b4c5-6789-d0e1-f2a3b4c5d6e7` |
| `user_id`   | text        | Optional (string in app) | `b8f7e6d5-c4b3-2109-8765-43210fedcba9` or *(null)* for anon visitor actions |
| `action`    | text        | Required | `VISITOR_STATUS_UPDATE` |
| `timestamp` | timestamptz | Default `now()` | `2025-03-24T14:02:00.000Z` |
| `details`   | text        | Optional JSON string | `{"from":"PENDING","to":"APPROVED","durationMinutes":30,"floorNumber":"2"}` |

**Used in:** `src/lib/audit.ts` (insert), `src/pages/AdminDashboard.tsx` (select — audit view).

**Example actions (from code):** `VISITOR_CHECKIN_REQUEST`, `VISITOR_STATUS_UPDATE`, `QR_CHECKIN`, `QR_CHECKOUT`, `ADMIN_LOGIN`, `ADMIN_LOGOUT`, `ADMIN_CREATE`.

---

## `auth.users` (Supabase Auth)

Not selected with `.from()` in this repo. Referenced by **`public.admins.user_id`**. Users are created via Supabase Auth (sign-up / dashboard); the app uses `supabase.auth.*` for session, not direct table access.

**Sample data (conceptual):** same identity as the `admins` row — e.g. `email` `admin@school.edu`, UUID matches `admins.user_id`. Other columns (`encrypted_password`, etc.) are managed by Supabase.

---

Full DDL and RLS examples: see **README.md** → “Database structure (Supabase)”.
