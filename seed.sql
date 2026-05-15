-- SubKeep - Database Seed
-- Auto-executed on first PostgreSQL initialization via docker-entrypoint-initdb.d

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Enums
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'paused', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- Users (table: "users", matches Prisma @@map)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,       -- @map("password_hash")
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- @map("created_at")
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- @map("updated_at")
);

-- =============================================================================
-- Subscriptions (table: "subscriptions", matches Prisma @@map)
-- =============================================================================
-- Column names follow Prisma schema: fields WITHOUT @map use camelCase field name
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,  -- @map("user_id")
  "name" VARCHAR(255) NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "billingCycle" "BillingCycle" NOT NULL DEFAULT 'monthly',          -- no @map → field name
  "next_billing_date" TIMESTAMPTZ NOT NULL,                          -- @map("next_billing_date")
  "last_billing_date" TIMESTAMPTZ,                                   -- @map("last_billing_date")
  "category" VARCHAR(100),
  "description" TEXT,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),                   -- @map("created_at")
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()                    -- @map("updated_at")
);

CREATE INDEX IF NOT EXISTS "subscriptions_user_id_idx" ON "subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "subscriptions_next_billing_date_idx" ON "subscriptions"("next_billing_date");

-- =============================================================================
-- Refresh Tokens (table: "refresh_tokens", matches Prisma @@map)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,  -- @map("user_id")
  "token" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,                                 -- @map("expires_at")
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()                    -- @map("created_at")
);

CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- =============================================================================
-- Payments (table: "payments", matches Prisma @@map)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "payments" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,   -- @map("user_id")
  "subscription_id" UUID REFERENCES "subscriptions"(id) ON DELETE SET NULL, -- @map("subscription_id")
  "amount" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
  "payment_method" VARCHAR(100),                                       -- @map("payment_method")
  "transaction_id" VARCHAR(255),                                       -- @map("transaction_id")
  "paid_at" TIMESTAMPTZ,                                               -- @map("paid_at")
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),                     -- @map("created_at")
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()                      -- @map("updated_at")
);

CREATE INDEX IF NOT EXISTS "payments_user_id_idx" ON "payments"("user_id");

-- =============================================================================
-- Reminders (table: "reminders", matches Prisma @@map)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "reminders" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,     -- @map("user_id")
  "subscription_id" UUID NOT NULL REFERENCES "subscriptions"(id) ON DELETE CASCADE, -- @map("subscription_id")
  "type" VARCHAR(50) NOT NULL,
  "scheduled_at" TIMESTAMPTZ NOT NULL,                                  -- @map("scheduled_at")
  "sent_at" TIMESTAMPTZ,                                                -- @map("sent_at")
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()                       -- @map("created_at")
);

CREATE INDEX IF NOT EXISTS "reminders_user_id_idx" ON "reminders"("user_id");

-- =============================================================================
-- Detection Logs (table: "detection_logs", matches Prisma @@map)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "detection_logs" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,  -- @map("user_id")
  "type" VARCHAR(50) NOT NULL,
  "data" JSONB NOT NULL DEFAULT '{}',
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()                    -- @map("created_at")
);

CREATE INDEX IF NOT EXISTS "detection_logs_user_id_idx" ON "detection_logs"("user_id");

-- =============================================================================
-- Seed Data
-- =============================================================================

-- Demo user (password: "password123")
INSERT INTO "users" ("id", "email", "password_hash")
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'demo@example.com',
  '$2a$10$ILpjQksMweoLB5gSXBvqEOz8zE.M0wYE7AUjInQIj6hmDiZfoJpnq'
) ON CONFLICT ("email") DO NOTHING;

-- Demo subscriptions
-- Field order: id, user_id, name, amount, currency, "billingCycle", next_billing_date, last_billing_date, category, status
INSERT INTO "subscriptions" ("id", "user_id", "name", "amount", "currency", "billingCycle", "next_billing_date", "last_billing_date", "category", "status") VALUES
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Netflix',         649,  'INR', 'monthly', '2026-06-15 00:00:00+00', '2026-05-15 00:00:00+00', 'Entertainment', 'active'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Spotify',         119,  'INR', 'monthly', '2026-06-20 00:00:00+00', '2026-05-20 00:00:00+00', 'Entertainment', 'active'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Amazon Prime',    1499, 'INR', 'yearly',  '2026-06-01 00:00:00+00', '2025-06-01 00:00:00+00', 'Shopping',      'active'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Disney+ Hotstar', 1499, 'INR', 'yearly',  '2026-05-10 00:00:00+00', '2025-05-10 00:00:00+00', 'Entertainment', 'active'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'YouTube Premium', 139,  'INR', 'monthly', '2026-06-12 00:00:00+00', '2026-05-12 00:00:00+00', 'Entertainment', 'active'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Notion',          799,  'INR', 'yearly',  '2026-08-01 00:00:00+00', '2025-08-01 00:00:00+00', 'Productivity',  'active'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GitHub Pro',      467,  'INR', 'monthly', '2026-06-25 00:00:00+00', '2026-05-25 00:00:00+00', 'Development',   'active'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cloudflare Pro',  2083, 'INR', 'monthly', '2026-06-30 00:00:00+00', '2026-05-30 00:00:00+00', 'Development',   'active')
ON CONFLICT ("id") DO NOTHING;

-- Demo payments
INSERT INTO "payments" ("id", "user_id", "subscription_id", "amount", "currency", "status", "payment_method", "paid_at") VALUES
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 649,  'INR', 'completed', 'UPI',    '2026-05-15 10:30:00+00'),
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 119,  'INR', 'completed', 'UPI',    '2026-05-20 08:15:00+00'),
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 139,  'INR', 'completed', 'Card',   '2026-05-12 14:00:00+00'),
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 467,  'INR', 'completed', 'Card',   '2026-05-25 09:45:00+00'),
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 2083, 'INR', 'pending',   'NetBanking', NULL)
ON CONFLICT ("id") DO NOTHING;

-- Demo reminders
INSERT INTO "reminders" ("id", "user_id", "subscription_id", "type", "scheduled_at") VALUES
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'email', '2026-06-14 09:00:00+00'),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'email', '2026-05-30 09:00:00+00')
ON CONFLICT ("id") DO NOTHING;
