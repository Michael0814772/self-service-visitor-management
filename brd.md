# Business Requirement Document (BRD)

**Project Name:** Implementation of Self-Service Visitor Management System (VMS)

**Date:** 3rd March, 2026

**Department:** Group 8

**Document Version:** 1.1 *(aligned with implemented Phase 1 web application)*

**Stakeholders:** Facilities, Security, IT, HR, Compliance, Reception

---

**Scope note:** Sections below follow the original VMS template. Where the **implemented product** differs from a full enterprise VMS, requirements are stated as delivered in **Phase 1 (this build)** vs **future / not in this release**. Technical detail: **README.md**, **table.md**, **implementation-plan.md**.

---

## 1. Executive Summary

Manual visitor registration (paper logbooks or reception-only entry) is inefficient, weak on auditability, and can weaken the visitor experience. This document defines requirements for a **digital visitor management process**.

**Phase 1 (implemented):** A **web-based** self-service check-in flow, **admin review** (approve or reject) before a visit is treated as authorized, **email notifications** (host on new request; visitor on decision when email is provided), **QR-assisted check-in/out**, a **printable visitor badge** in the browser, and a **digital audit log**. The solution runs in the browser (including on tablets); it is **not** a dedicated kiosk OS or native mobile app.

---

## 2. Project Objectives

| # | Objective | Phase 1 (implemented) | Not in this release |
|---|-----------|------------------------|---------------------|
| i | Improve security | Visitors identified and recorded digitally; **admin approval** required before “authorized” status; **audit trail** for key actions | Terms & conditions capture; ID screening; blacklist |
| ii | Automate check-in | **Self-service web form** replaces paper for the request step; usable on desktop/tablet/mobile browser | Dedicated kiosk software; zero hardware dependency in product |
| iii | Visitor experience | Short form; optional email with QR and badge link after approval | Sub-30s SLA not formally measured |
| iv | Compliance / audit | **Digital log** of requests and status; **append-only audit events** (e.g. login, status changes, QR check-in/out) | GDPR/HIPAA program controls; automated retention purge |
| v | Reduce reception load | Host can be notified by **email** when a request is submitted | Full reception desk workflow tooling |
| vi | Analytics | **Dashboard** lists and filters visitors; timestamps (created/updated) | Trend charts, peak-hour reports, department analytics |
| vii | Host notification | **Email** (EmailJS) when visitor submits; visitor email on approve/reject | SMS, Slack, Microsoft Teams |
| viii | Professionalism | Modern responsive UI | Branded kiosk enclosures |

---

## 3. Scope

### a) In scope — Phase 1 (this implementation)

- **Self-service visitor request** (no visitor account): name, email, phone, host (from configured admin list), purpose, optional appointment time.
- **Administrator review:** approve (with **duration** and **floor**) or reject (optional reason stored).
- **QR code** encoding visit URL for **check-in** (approved → checked in) and **check-out** (checked in → checked out).
- **Visitor badge:** web page with visitor details, appointment, duration, floor, QR; **print / save as PDF** from the browser (not a dedicated badge printer driver).
- **Host notification:** **email** when a new request is submitted (configured template).
- **Visitor notification:** **email** on approve/reject when visitor email exists and email service is configured (HTML body includes QR and badge link).
- **Visitor check-out:** via **QR scan** or **admin** action on dashboard.
- **Digital visitor log:** admin dashboard with status filters and visitor detail panel.
- **Audit log:** recent events viewable by admin (login, check-in request, status updates, QR events, etc.).
- **Secure admin access:** Supabase Auth + **admin whitelist** + **admins** registry.

### b) In scope — original template but **not** in Phase 1

*(Documented for roadmap; not implemented in the current codebase.)*

- Visitor **pre-registration portal** owned by host (invite-before-arrival product flow).
- Physical **kiosks** as a product deliverable (beyond “works in a browser on a tablet”).
- **SMS / Teams / Slack** host alerts.
- **Government ID scan**, **photo on badge**, **face recognition**, **blacklist** screening.
- **Access control** or **Active Directory / Google Workspace** directory sync.
- **NDA / policy** e-signature capture.
- **Reporting & analytics** beyond list/filter + audit (no trends, peak hours, department reports).
- **Automatic check-out** after time limit.
- **Calendar** integration (Outlook / Google).

### c) Out of scope

- Employee attendance management  
- Contractor workforce management  
- Building access card issuance  
- Employee time-tracking  
- Custom hardware manufacturing  
- HR onboarding systems  

---

## 4. Stakeholders

| Stakeholder | Role in Phase 1 |
|-------------|-----------------|
| **Facilities / Reception** | End-users of the **admin dashboard**; approve/reject; manual check-in/out; monitor queue |
| **Security** | Can rely on **status** and **audit log**; no dedicated watchlist/evacuation module in app |
| **IT** | Hosts Supabase project, env vars, EmailJS templates, deployment URL for QR/badge links |
| **HR / Compliance** | Define policy around data retention and use of email third parties; not automated in app |
| **Employees / Hosts** | Appear in **host dropdown** (from `admins`); receive **email** when a visitor selects them and submits *(if configured)* |
| **Visitors** | Complete **check-in form**; use **QR** and **badge** links after approval |

---

## 5. Current State (Problem Statement)

Manual logbooks or single-point reception entry can cause **wait time**, **incomplete records**, **weak traceability**, **inconsistent host awareness**, and **limited reporting**. Analytics and instant multi-channel host alerts are typically missing.

---

## 6. Future State — Phase 1 (implemented)

1. Visitor completes **self-service web check-in** (no pre-invite portal required in product).
2. Request is **pending** until an **administrator approves or rejects** it.
3. If **approved**, visitor may receive **email** with **QR** and **badge** link; badge shows **floor**, **duration**, and visit details.
4. **Host** may receive **email** that a request needs review *(when EmailJS is configured)*.
5. **Check-in:** visitor or staff opens **QR URL** while status is approved → status becomes **checked in**; **check-out** via second scan or **admin**.
6. **Admins** see **real-time list** of visitors and statuses on the dashboard; **audit** entries record key actions.

**Not in Phase 1:** pre-registration-only arrival path, automatic badge hardware print, SMS/Teams arrival pings, evacuation report export.

---

## 7. Functional Requirements

**Phase 1 summary:** Self-service **request**, **admin decision**, **email** notifications, **QR** lifecycle, **web badge**, **admin dashboard**, **audit log**. No identity document pipeline or enterprise integrations in this build.

### 7.1 Visitor pre-registration *(template)* / **Visitor request** *(Phase 1)*

**Template:** Host pre-registers visitor in advance.

**Phase 1 (as built):** The **visitor** submits the request. The **host** is chosen from a list of **admins** (not a full corporate directory sync).

| Capability | Phase 1 |
|------------|---------|
| Visitor details, purpose, date/time | Yes (form + optional `appointment_time`) |
| Visitor company | **No** dedicated field *(optional future field)* |
| Automatic invitation email before visit | **No** — email to visitor on **approval**, not on submit |
| QR code generation | **Yes** — included in **approval email** and **badge page** |

### 7.2 Self-service check-in

**Phase 1:** Web application accessible from **any device with a browser** (desktop, tablet, phone). Suitable for use at a reception tablet; no separate kiosk binary.

**Visitor inputs (implemented):** Full name, email (optional but needed for visitor emails), phone (optional), **host** (from admin list), **purpose**, optional **appointment time**.

**Not implemented:** “Company” as required field; dedicated touchscreen kiosk app.

### 7.3 Identity verification

**Phase 1:** **Not implemented.** Trust is based on **admin approval** and optional reception **manual check-in**.

**Not implemented:** ID scanning, photo capture, face recognition, blacklist / watchlist.

### 7.4 Badge printing

**Phase 1 (as built):**

- **Print / PDF** from browser (“Print badge” on badge page).
- Badge includes: **visitor name**, **host**, **purpose**, **appointment**, **approved duration**, **floor** (when set), **QR** (same target as email).

**Not implemented:** Automatic hardware badge printer; **visitor photo** on badge; separate “expiry” field *(duration is shown as approved length)*.

### 7.5 Host notification

**Phase 1:** **Email only** via **EmailJS** when a visitor submits a request (template variables per README).

**Not implemented:** SMS, mobile app push, Microsoft Teams, Slack. Notification is **“action required / new request”**, not strictly “guest has arrived” unless process maps submit to arrival.

### 7.6 Visitor check-out

**Phase 1:**

- **QR URL** `/visit/:id` — second scan performs check-out when already checked in.
- **Admin** can check visitor out from dashboard.

**Not implemented:** Dedicated physical kiosk checkout screen; **automatic** checkout after time limit.

**Recorded:** `checked_out_at`, status; duration can be inferred from timestamps / approved duration.

### 7.7 Security management

**Phase 1:** **Audit log**; **admin-only** dashboard access; **status** workflow.

**Not implemented:** Blacklist detection, evacuation list generator, watchlist, security alert rules engine.

### 7.8 Reporting & analytics *(renumbered from template 8.8)*

**Phase 1:** **Visitor table** with filters; **detail** view; **created_at / updated_at**; **audit log** table with filter by action.

**Not implemented:** Daily export reports, trends, peak hours, department analytics, compliance report packs, dedicated evacuation list report.

---

## 8. Non-Functional Requirements

| Category | Template | Phase 1 (implemented / honest) |
|----------|----------|--------------------------------|
| **Availability** | 99.5–99.9%, offline check-in | Depends on **hosting + Supabase**; **no offline mode** |
| **Performance** | &lt; 30s to badge | Reasonable for small data; **not benchmarked** in this project |
| **Scalability** | Multi-location | **Single Supabase project**; multi-site is operational (separate deployments possible), not a built-in “locations” module |
| **Security** | TLS/HTTPS | **Enforced by deployment** (e.g. HTTPS); API uses **Supabase** with **RLS** per README |
| **Compliance** | GDPR/CCPA, purge after X days | **Deploying org** defines retention; **no auto-purge** in app |
| **Accessibility** | Multi-language, ADA kiosk | **English UI**; standard HTML components; **no formal ADA audit** |
| **Usability** | Intuitive first-time use | **Goal**; responsive layout |

---

## 9. System integrations — Phase 1 vs template

| System | Template | Phase 1 |
|--------|----------|---------|
| **Access control** | Temporary door access | **None** |
| **Active Directory / Azure AD / Okta / Google** | Employee sync | **None** — hosts are **rows in `admins`** |
| **Email** | SMTP, Teams/Slack | **EmailJS** from browser for notifications; **Resend/SMTP** optional for Supabase Auth emails only (see README) |
| **HTTPS/TLS** | Required | **Yes** when app is served over HTTPS |
| **Calendar (Outlook / Google)** | Meeting sync | **None** |

---

## 10. Hardware requirements — Phase 1

**Template** listed kiosks, printers, scanners, cameras.

**Phase 1:** **No mandatory hardware.** Any device with a modern browser suffices. Optional: **tablet at reception**, **printer** for paper badge via browser print, **phone/tablet** to display QR for scanning.

---

## 11. User roles — Phase 1 (implemented)

| Role | Permissions | Remark |
|------|-------------|--------|
| **Visitor** | Submit request; open QR/badge links | No account |
| **Host (admin name)** | Receives email when selected as host on a new request *(if configured)* | Not a separate “host login” in app |
| **Administrator** | Login; view/edit visitor statuses; approve/reject; audit view | Whitelist + `admins` row required |
| **Receptionist** | *Same as admin in this build* | No separate receptionist role in database |
| **Security Admin** | *Same dashboard* | No extra security-only console |
| **IT Admin** | Configure Supabase, EmailJS, deploy frontend | Not a separate in-app IT role |

**User stories (adjusted):** Visitor wants a **short digital form**; host wants **email awareness** of new requests; admin wants **one place** to see who is pending, approved, on-site, or checked out.

---

## 12. Compliance & security — Phase 1

- **Role-based access:** Visitors unauthenticated; **only authenticated admins** (with whitelist + admin row) use the dashboard.  
- **Data in transit:** HTTPS in production; Supabase over TLS.  
- **Secure login:** Supabase Auth for admins.  
- **Audit logs:** Key actions written to **`audit_log`**.  
- **Encryption at rest:** Per **Supabase** provider.  
- **Terms / NDAs / photo on file:** **Not implemented** in this release.

---

## 13. Success metrics (KPIs) — Phase 1 (realistic)

| KPI | Template target | Phase 1 interpretation |
|-----|-----------------|------------------------|
| Check-in time | &lt; 30 s | Form is short; **no formal measurement** |
| Registration accuracy | 98%, 100% kiosk | **Qualitative** goal; web replaces paper for the **request** step |
| Reception wait reduction | 50% | **Out of scope** to measure here |
| Security compliance | 100% photo + terms | **Not applicable** — no photo/terms in product |
| Host satisfaction | 90% faster notify | **Email** path only; **no survey** in product |

**Suggested Phase 1 success criteria:** (1) End-to-end flow works: submit → approve → email → QR check-in → check-out. (2) Reject path stores reason. (3) Audit shows admin and visitor events.

---

## 14. Risks & mitigation — Phase 1

| Risk | Mitigation |
|------|------------|
| **Downtime** (Supabase / hosting) | No offline mode — **monitoring** and **fallback process** (manual list) are operational |
| **Privacy** | **RLS**, HTTPS, minimal data; **org policy** for retention |
| **Hardware failure** | Web-only — **any device** can substitute |
| **Adoption** | **Training**; clear URL at reception |
| **Email deliverability** | **EmailJS + visitor’s spam settings**; verify templates |

---

## 15. Implementation phases — this project

| Phase | Content |
|-------|---------|
| **1** | Requirements aligned to **template + feasible MVP** |
| **2** | **Supabase** schema, RLS, Auth, admin whitelist |
| **3** | **React** app: check-in, admin dashboard, QR, badge, audit |
| **4** | **EmailJS** templates and env configuration |
| **5** | **Deploy** frontend; configure production URLs for QR/badge |

*(Original template phases “vendor selection” **not** used — custom/class build.)*

---

## 16. Assumptions — Phase 1

- **Internet** required for check-in and admin dashboard (Supabase + hosted app).  
- **Visitors** may use **email** for approval messages; optional on form.  
- **Admins** have **browsers** and credentials.  
- **Hardware kiosks** are **optional**; a tablet browser is sufficient.  
- **Identification / smartphone** for QR is **helpful** but admin can still operate check-in/out manually.

---

*End of document.*
