# LabFlow

Multi-tenant SaaS lab workflow management platform. Track specimens through configurable workflows from receipt to completed report.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Firebase Authentication + JWT session cookies
- **Payments**: Stripe (subscriptions, billing portal, webhooks)
- **UI**: Tailwind CSS v4, shadcn/ui, Lucide icons
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Firebase project (Authentication)
- Stripe account (optional, for billing)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Fill in your .env values (see Environment Variables below)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (creates default plans)
pnpm db:seed

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy Flow

**Local -> Staging -> Production. Never push directly to a production database from local development.**

Each environment uses separate service instances. Copy the appropriate env template:

```bash
cp .env.example .env              # local development
cp .env.staging.example .env      # staging (see below)
```

Environment separation rules:

- **Database**: Staging and production must use different Neon branches or projects. Same `DATABASE_URL` in both environments means one migration wipes the other's data.
- **Stripe**: Staging uses test mode keys (`sk_test_*`). Production uses live keys (`sk_live_*`). A test-mode webhook secret will not validate live-mode events.
- **Firebase**: Each environment should have its own Firebase project so test users don't pollute production auth records.
- **Redis/Upstash**: Separate instances per environment. Rate limit state and job queues should not bleed across environments.
- **Session secret**: Generate a unique `SESSION_SECRET` per environment. Sharing it means a local dev session cookie works against production.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run test suite |
| `pnpm lint` | Run ESLint |
| `pnpm db:seed` | Seed database with default plans |

## Project Structure

```
app/
  (auth)/           # Public auth pages (login, signup)
    login/
    signup/
  (dashboard)/      # Protected app pages
    billing/        # Subscription management
    samples/[id]/   # Sample detail view
    templates/      # Workflow template editor
    page.tsx        # Dashboard home (sample list)
  api/
    auth/           # Session + registration endpoints
    billing/        # Stripe billing + portal
    checkout/       # Stripe checkout sessions
    plans/          # Plan listing
    samples/        # Sample CRUD + advance
    templates/      # Template CRUD
    webhooks/       # Stripe + instrument webhooks
components/         # Shared React components
  ui/               # Primitives (button, badge, skeleton, etc.)
lib/                # Server utilities (auth, session, prisma, firebase)
prisma/             # Schema + seed
tests/              # Test files
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | JWT signing key (generate: `openssl rand -base64 32`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase Admin SDK project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Admin SDK service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin SDK private key |
| `STRIPE_SECRET_KEY` | Stripe secret key (optional) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (optional) |

## Roles

- **Admin** — Full access to all features
- **SeniorScientist** — Can approve flagged samples
- **Technician** — Can advance samples through stages

## Testing

```bash
pnpm test          # Run all tests
pnpm test -- --watch  # Watch mode
```

Tests cover auth flows, API route protection, session management, Stripe webhooks, and RBAC enforcement.

## Backup and Restore

LabFlow uses Neon, which supports instant database branching via copy-on-write. Backups are not a claim — they are tested.

### How it works

Neon continuously backs up your database (point-in-time recovery). Branching gives you instant, verifiable restores: a branch is a copy-on-write clone of your data at any point in time.

### Verification script

`scripts/backup-test.sh` proves a restore works end-to-end:

1. Creates a new branch from a source branch (instant copy-on-write clone)
2. Runs integrity checks against the restored branch (table existence, row counts, foreign key consistency)
3. Cleans up the test branch

```bash
# Set required env vars
export NEON_API_KEY=your_api_key
export NEON_PROJECT_ID=your_project_id

# Run the backup/restore test
chmod +x scripts/backup-test.sh
./scripts/backup-test.sh

# Or restore from a specific branch
./scripts/backup-test.sh --source main

# Or do a point-in-time restore
./scripts/backup-test.sh --point-in-time "2026-07-25T10:00:00Z"
```

Requires: `NEON_API_KEY`, `NEON_PROJECT_ID`, and `psql` (PostgreSQL client).

### Tested restore process

Backup/restore verified via Neon branching on 2026-07-27 — see `scripts/backup-test.sh`.

## Known Limitations

These are honest limitations of the current implementation, not a wishlist.

### Secrets management

Secrets currently live in `.env` files. This is acceptable for a demo or portfolio project. A real production deployment would move these to a managed secrets service:

- **AWS Secrets Manager** or **HashiCorp Vault** for self-hosted deployments
- **Vercel encrypted env vars** for Vercel deployments (built-in, zero config)
- **Neon's built-in connection string management** for database credentials

An `.env` file is fine for local development and even staging. It is not fine for production — secrets in plaintext on disk, in git history, or on a deployer's laptop are all attack surfaces.

### No automated migrations in CI

Database migrations (`prisma migrate deploy`) are run manually. A production deployment pipeline should run migrations automatically as part of the deploy process, with a rollback strategy for failed migrations.

### No rate limiting on auth endpoints

Rate limiting is configured via Upstash, but the auth endpoints (`/api/auth/register`, `/api/auth/session`) have limited protection. In production, add stricter rate limits on authentication endpoints (e.g., 5 attempts per minute per IP).

### Single-region deployment

The Kubernetes manifests deploy to a single region. For production, consider multi-region deployment with read replicas (Neon supports this natively) or a CDN-backed edge deployment.

## Local Kubernetes Setup

Run LabFlow on Minikube for local development and testing.

### Prerequisites

- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- Docker

### Steps

```bash
# 1. Start Minikube
minikube start

# 2. Build the Docker image inside Minikube's Docker daemon
eval $(minikube docker-env)
docker build -t labflow:latest .

# 3. (Optional) Build Redis image
docker build -t redis:7-alpine -f k8s/Dockerfile.redis .

# 4. Create secrets from the template
cp k8s/secret.yaml.example k8s/secret.yaml
# Edit k8s/secret.yaml with your real values
kubectl apply -f k8s/secret.yaml

# 5. Deploy everything
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/redis-service.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# 6. Verify
kubectl get pods
kubectl get svc

# 7. Access the app
kubectl port-forward svc/labflow 3000:80
# Open http://localhost:3000

# 8. Clean up
kubectl delete -f k8s/
minikube stop
```

### Kubernetes Manifests

| File | Description |
|------|-------------|
| `k8s/deployment.yaml` | LabFlow app (2 replicas, health probes, resource limits) |
| `k8s/service.yaml` | ClusterIP service (port 80 -> 3000) |
| `k8s/secret.yaml.example` | Template for environment secrets (copy to `secret.yaml`) |
| `k8s/redis-deployment.yaml` | Redis for BullMQ job queue |
| `k8s/redis-service.yaml` | Redis ClusterIP service |
