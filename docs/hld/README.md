# High Level Design (HLD) — Job Board Platform

## Table of Contents
- [System Overview](#system-overview)
- [Users and Roles](#users-and-roles)
- [Architecture Decisions](#architecture-decisions)
- [Services](#services)
- [Event Flow](#event-flow)
- [Infrastructure](#infrastructure)
- [Frontend](#frontend)
- [Tech Stack](#tech-stack)

---

## System Overview

A microservices-based job board where employers post jobs and candidates apply.
Built with Node.js, Express.js, TypeScript, Angular 19, GCP Pub/Sub, AWS S3,
deployed on GCP Cloud Run via GitHub Actions.

Angular 19 (Browser)
|
| HTTP + JWT
|
API Gateway (Express - port 3000)
|
|── /api/auth        → User Service      (port 3001)
|── /api/jobs        → Job Service       (port 3002)
|── /api/apply       → Application Svc   (port 3003)
|── /api/search      → Search Service    (port 3004)
|── /api/notify      → Notification Svc  (port 3005)

---

## Users and Roles

| Role | Description |
|---|---|
| Candidate | Registers, searches jobs, applies, uploads resume (PDF), tracks status |
| Employer | Registers, posts jobs, uploads company logo, views applicants |
| Admin | Manages users, views all jobs and applications |

---

## Architecture Decisions

### 1. Database per service
Each service has its own PostgreSQL schema.
Services never share a DB connection — core microservices principle (loose coupling).

### 2. Synchronous vs asynchronous
- **Synchronous (REST)** — user-facing requests: login, post job, search jobs
- **Asynchronous (Pub/Sub)** — side effects: send notification, welcome email
- Never block a user response waiting for another service

### 3. API Gateway as single entry point
- Frontend only knows one URL
- JWT validated once at the gateway — not repeated in every service
- Rate limiting applied at gateway level

### 4. Infrastructure as code
- Terraform creates every GCP resource
- Entire cloud environment can be rebuilt with one command

### 5. S3 for file storage
- Files never stored in PostgreSQL
- DB stores only the S3 URL string
- Actual PDF/image lives in S3 with presigned URL for secure access

---

## Services

| Service | Port | Tech | Responsibility |
|---|---|---|---|
| API Gateway | 3000 | Express.js | JWT auth, routing, rate limiting |
| User Service | 3001 | Express + Prisma | Register, login, JWT |
| Job Service | 3002 | Express + Prisma | Post jobs, company logo → S3 |
| Application Service | 3003 | Express + Prisma | Apply, resume → S3, track status |
| Search Service | 3004 | Express + Prisma | Full-text search, filters |
| Notification Service | 3005 | Express | Pub/Sub consumer, email/SMS |

---

## Event Flow

Services communicate asynchronously via GCP Pub/Sub.
Publishers and subscribers are fully decoupled — they never call each other directly.

| Event | Publisher | Subscriber | Action |
|---|---|---|---|
| `job.created` | Job Service | Notification Service | Email to employer confirming job is live |
| `application.submitted` | Application Service | Notification Service | SMS to candidate + email to employer |
| `user.registered` | User Service | Notification Service | Welcome email to new user |

---

## Infrastructure

### CI/CD Pipeline (GitHub Actions)
git push to main
|
├── npm test (Jest)
├── docker build
├── push image → GCP Artifact Registry
└── deploy → GCP Cloud Run

### Terraform provisions
- GCP Cloud Run (5 services)
- GCP Pub/Sub (3 topics + subscriptions)
- GCP Cloud SQL (PostgreSQL 16)
- GCP Artifact Registry

### AWS S3
- Bucket: `job-board-uploads`
- resume PDFs (uploaded during application)
- company logos (uploaded during job post)
- Access via presigned URLs (15 min expiry)

---

## Frontend

**Angular 19** — standalone components, Signals, functional guards.

### Pages
| Route | Description |
|---|---|
| `/` | Landing page — search bar, featured jobs |
| `/auth/register` | Register as candidate or employer |
| `/auth/login` | Login |
| `/jobs` | Job listing with filters |
| `/jobs/:id` | Single job detail + Apply button |
| `/apply/:jobId` | Application form + resume PDF upload |
| `/dashboard/candidate` | My applications + status tracking |
| `/dashboard/employer` | My job posts + applicants list |

### Key Angular 19 concepts used
- Standalone components (no NgModule)
- Signals for state management
- Functional route guards
- HTTP Interceptor for JWT attachment
- `inject()` instead of constructor injection

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22 LTS |
| Backend framework | Express.js | 5.x |
| Language | TypeScript | 5.x |
| Frontend | Angular | 19 |
| ORM | Prisma | 6.x |
| Database | PostgreSQL | 16 |
| Events | GCP Pub/Sub | latest |
| File storage | AWS S3 | latest |
| Infra | Terraform | 1.8 |
| Containers | Docker | latest |
| Registry | GCP Artifact Registry | — |
| CI/CD | GitHub Actions | — |
| Testing | Jest + Supertest | — |
| API docs | Swagger (swagger-ui-express) | — |

