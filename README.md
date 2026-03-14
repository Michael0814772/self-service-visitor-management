# Self-Service Visitor Management System

School assignment: a simple visitor check-in system with **admin approval** (no automatic approval).

## Workflow

1. **Visitor** fills the check-in form (name, email, phone, host, purpose) and submits.
2. **Status = PENDING** — request waits for admin review.
3. **Admin** logs in and goes to **Admin Review** to see all pending requests.
4. **Admin** approves or rejects each request (optional rejection reason).
5. **Status** becomes:
   - **APPROVED** — visitor is allowed on-site; they appear on **Dashboard** (current visitors).
   - **REJECTED** — request denied (reason stored if given).
6. When the visitor leaves, admin **checks them out** on the Dashboard → **Status = VISITED**.

## Statuses

| Status    | Meaning                                      |
|-----------|----------------------------------------------|
| PENDING   | Awaiting admin approval                      |
| APPROVED  | Admin approved; visitor is/was on-site       |
| REJECTED  | Admin rejected the request                   |
| VISITED   | Visitor has been checked out                 |

## Roles

- **Visitor** (no login): can only use the **Check In** page to submit a request.
- **Admin** (login required): can **approve/reject** pending requests, view **Dashboard** (current visitors), **Visitor Log** (all visitors), and **Check Out** visitors.

## Admin Login

- **Email:** `admin@school.edu`
- **Password:** `admin123`

After login, admin can use: Check In, Dashboard, Visitor Log, and Admin Review.

## Run the app

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). Use **Check In** as a visitor, then **Admin Login** to approve/reject and manage visitors.
