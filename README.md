# Self-Service Visitor Management System

School assignment: a simple visitor check-in system with **admin approval** (no automatic approval).

## Workflow

1. **Visitor** fills the check-in form (name, email, phone, host, purpose) and submits.
2. **Status = PENDING** — request waits for admin review.
3. **Admin** logs in and goes to **Admin Review** to see all pending requests.
4. **Admin** approves or rejects each request (optional rejection reason).
5. **Status** becomes:
   - **APPROVED** — visitor is allowed on-site.
   - **REJECTED** — request denied (reason stored if given).
6. Admin **checks in** the visitor on the Dashboard → **Status = CHECKED_IN** (and `checked_in_at` is set).
7. When the visitor leaves, admin **checks them out** → **Status = CHECKED_OUT**.

## Statuses

| Status       | Meaning                                      |
|--------------|----------------------------------------------|
| PENDING      | Awaiting admin approval                      |
| APPROVED     | Admin approved; not yet checked in           |
| REJECTED     | Admin rejected the request                   |
| CHECKED_IN   | Visitor is on-site (checked in)              |
| CHECKED_OUT  | Visitor has left (checked out)               |

## Roles

- **Visitor** (no login): can only use the **Check In** page to submit a request.
- **Admin** (login required): can **approve/reject** pending requests, view **Dashboard** (current visitors), **Visitor Log** (all visitors), and **Check Out** visitors.

## Admin Login

Admin credentials are stored in **Supabase Auth**; the app does not use mock or hardcoded login. Create an admin user in Supabase (Authentication → Users) and add them to the `admins` table so they can access Check In, Dashboard, Visitor Log, and Admin Review.

## Set up email with Resend

We use [Resend](https://resend.com/) to send emails (e.g. admin confirmation when signing up at `/admin-create`). Resend is configured as **custom SMTP in Supabase** so Supabase Auth can send the emails.

**Important:** Put your Resend API key only in the **Supabase Dashboard** (SMTP settings). Do not add it to this repo or to frontend `.env` — that would expose it.

1. **Get a Resend API key**  
   Sign up at [Resend](https://resend.com/), then create an API key at [resend.com/api-keys](https://resend.com/api-keys). If you ever shared a key (e.g. in chat), revoke it and create a new one.

2. **Configure Supabase to use Resend SMTP**  
   - Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).  
   - Go to **Project Settings** (gear) → **Authentication** → **SMTP Settings**.  
   - Turn **Enable Custom SMTP** on and set:

   | Field           | Value                |
   |-----------------|----------------------|
   | **Sender name** | e.g. `Visitor Management` |
   | **Sender email**| `onboarding@resend.dev` (testing) or your verified domain in Resend (e.g. `noreply@yourdomain.com`) |
   | **Host**        | `smtp.resend.com`    |
   | **Port**        | `465` (or `587`)     |
   | **Username**    | `resend`             |
   | **Password**    | Your Resend API key  |

   - Save. Supabase will send all auth emails (confirm, reset password, etc.) through Resend.

3. **Optional: custom domain in Resend**  
   For production, add and verify your domain in [Resend → Domains](https://resend.com/domains) and use that address as **Sender email** in Supabase (e.g. `noreply@yourdomain.com`). Resend’s [docs](https://resend.com/docs) describe DNS (SPF, DKIM) for better deliverability.

After this, sign up at `/admin-create` and you should receive the confirmation email at the address you used.

### Notify admin when a visitor submits

When a visitor submits the check-in form, the app sends an email to the selected host (admin) via [EmailJS](https://www.emailjs.com/) so they can review the request.

**Setup:**

1. Sign up at [EmailJS](https://www.emailjs.com/) and create an **Email Service** (e.g. Gmail) and note the **Service ID**. Get your **Public Key** from [Account](https://dashboard.emailjs.com/admin/account).

2. Create an **Email Template** for the admin notification. Set **To Email** to `{{email}}`. Example body:

   ```
   Hello {{Admin}},

   A visitor has submitted a request that requires your approval.

   Visitor Information:
   Name: {{name}}
   Purpose: {{purpose}}
   Host: {{host_name}}
   Visit Date: {{visit_date}}

   Action required:
   Please log in to review this request.

   Login here:
   {{admin_link}}

   Regards,
   Unilag.Inc
   Visitor Management Team
   ```

   Template variables: `{{email}}` (recipient), `{{Admin}}`, `{{name}}`, `{{purpose}}`, `{{host_name}}`, `{{visit_date}}`, `{{admin_link}}`.

3. In `.env` set:
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`
   - `VITE_EMAILJS_ADMIN_NOTIFY_TEMPLATE_ID` — the template ID for this admin-notify email

**Approval email to visitor:** When an admin approves a request, the app can send the visitor an email using a second template. Create another template in EmailJS with:
   - **To Email:** set to `{{email}}` (the app passes the visitor’s email as `email` and `to_email`; use either variable in the To field)
   - **Subject:** e.g. `Your visit request has been approved`
   - **Body variables:** `{{name}}`, `{{purpose}}`, `{{host_name}}`, `{{visit_date}}`, `{{qr_code_url}}`
   - To show a QR code (for entry verification), add in the template:  
     `<img src="{{qr_code_url}}" alt="QR Code" width="200" height="200" />`  
     The QR code encodes the visit ID so staff can scan to verify.
   - Add `VITE_EMAILJS_APPROVAL_TEMPLATE_ID` to `.env` with that template’s ID.

## Database structure (Supabase)

The app uses **Supabase as the backend**. All visitor and admin data comes from these tables; any mock or in-memory data in the code is replaced by Supabase. Create the following tables in the Supabase SQL Editor (or Table Editor).

### Table: `visitors`

| Column       | Type         | Nullable | Default           | Description                    |
|-------------|--------------|----------|-------------------|--------------------------------|
| `id`        | `uuid`       | No       | `gen_random_uuid()`| Primary key                    |
| `full_name` | `text`       | No       | —                 | Visitor’s full name            |
| `email`     | `text`       | Yes      | —                 | Email address                  |
| `phone`     | `text`       | Yes      | —                 | Phone number                   |
| `purpose`   | `text`       | No       | —                 | Purpose of visit                |
| `host_name` | `text`       | No       | —                 | Name of host/contact           |
| `appointment_time` | `timestamptz` | Yes | —              | Requested appointment date/time |
| `duration_minutes` | `integer` | Yes | —                 | Approved visit duration in minutes |
| `status`    | `text`       | No       | `'PENDING'`       | `PENDING` \| `APPROVED` \| `REJECTED` \| `CHECKED_IN` \| `CHECKED_OUT` |
| `checked_in_at`  | `timestamptz`| Yes      | —                 | Check-in time (set when status → CHECKED_IN) |
| `checked_out_at` | `timestamptz`| Yes      | —                 | Check-out time (set when status → CHECKED_OUT) |
| `notes`     | `text`       | Yes      | —                 | Admin notes / rejection reason |
| `created_at`| `timestamptz`| No       | `now()`           | When the request was created   |
| `updated_at`| `timestamptz`| No       | `now()`           | Last status/notes update       |

### SQL to create the table

```sql
create table public.visitors (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  email      text,
  phone      text,
  purpose    text not null,
  host_name  text not null,
  appointment_time  timestamptz,
  duration_minutes integer,
  status     text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT')),
  checked_in_at  timestamptz,
  checked_out_at timestamptz,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: trigger to keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger visitors_updated_at
  before update on public.visitors
  for each row execute function public.set_updated_at();

-- Enable RLS and allow anonymous insert (check-in form) and authenticated or service read/update
alter table public.visitors enable row level security;

create policy "Allow anonymous insert for check-in"
  on public.visitors for insert to anon with check (true);

create policy "Allow read and update for authenticated"
  on public.visitors for all to authenticated using (true) with check (true);
```

If your `visitors` table already exists:  
- If you have `visit_date` but no `checked_in_at`, rename and add check-out:  
  `alter table public.visitors rename column visit_date to checked_in_at;`  
  `alter table public.visitors add column if not exists checked_out_at timestamptz;`  
- If you have neither:  
  `alter table public.visitors add column if not exists checked_in_at timestamptz;`  
  `alter table public.visitors add column if not exists checked_out_at timestamptz;`

Adjust RLS policies to match your auth setup (e.g. if admins use Supabase Auth, restrict updates to authenticated users; if you use a service key from a backend, add a policy for that).

### Table: `admins` (for admin login)

Admin login uses **Supabase Auth** (no mock). Who counts as an admin is determined by the `admins` table below.

1. **Supabase Auth**  
   In the dashboard: **Authentication → Users**. Create a user (e.g. `admin@school.edu`) and set a password. The app signs admins in with `supabase.auth.signInWithPassword()`.

2. **`admins` table**  
   Restricts the admin dashboard to specific users (supports multiple admins). Add a row per admin, linking to `auth.users`:

| Column     | Type         | Nullable | Description                |
|------------|--------------|----------|----------------------------|
| `id`       | `uuid`       | No       | Primary key                |
| `user_id`  | `uuid`       | No       | References `auth.users(id)`|
| `email`    | `text`       | No       | Denormalized for display   |
| `name`     | `text`       | Yes      | Admin display name         |
| `created_at` | `timestamptz` | No     | When added as admin        |

```sql
create table public.admins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  email      text not null,
  name       text,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.admins enable row level security;

-- Let authenticated users read their own admin row (for login and dashboard check; no self-reference = no recursion)
create policy "Allow read own admin row"
  on public.admins for select to authenticated
  using (user_id = auth.uid());

-- Allow anonymous read so the check-in form can show the host dropdown (hosts = admins)
create policy "Allow anon to read admins for host dropdown"
  on public.admins for select to anon using (true);

-- Allow a user to add themselves to admins (for /admin-create self-signup)
create policy "Allow user to insert own admin row"
  on public.admins for insert to authenticated
  with check (auth.uid() = user_id);
```

If your `admins` table already exists without `name`, add it:  
`alter table public.admins add column if not exists name text;`

If you get **infinite recursion** on `admins`, you have an old policy that references `admins` inside its own check. Drop it and use only the non-recursive policies above:
```sql
drop policy if exists "Admins can read admins" on public.admins;
```

### Table: `admin_whitelist`

Only emails listed here are allowed to sign in as admin or create an admin account. If the signed-in user’s email is not in this table, the app shows **“Not authorized as admin.”**

```sql
create table public.admin_whitelist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz default now()
);

-- Allow the app to check if an email is whitelisted (e.g. authenticated users or anon, depending on when you check)
alter table public.admin_whitelist enable row level security;
create policy "Allow read admin_whitelist for auth check"
  on public.admin_whitelist for select to authenticated using (true);
-- Optional: allow anon so /admin-create can check before sign-up (or check after sign-up with authenticated)
create policy "Allow anon read admin_whitelist"
  on public.admin_whitelist for select to anon using (true);
```

Add rows for each allowed admin email, e.g. `insert into public.admin_whitelist (email) values ('admin@school.edu');`

In the app, after sign-in the app checks that the user’s email is in `admin_whitelist`, then that `auth.uid()` exists in `public.admins`; only then can they access the admin dashboard. The **Create admin** page (`/admin-create`) lets a user sign up with Supabase Auth and add themselves to `admins` (requires the policy above). The check-in page loads admins as the host list (so the selected host can be emailed for approval). The `visitors` RLS “Allow read and update for authenticated” limits visitor data to signed-in users.

---

## Run the app

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). Use **Check In** as a visitor, then **Admin Login** to approve/reject and manage visitors.
