-- Create deal_stages table
CREATE TABLE "deal_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'secondary',
    "probability" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isWon" BOOLEAN NOT NULL DEFAULT false,
    "isLost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "deal_stages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint
CREATE UNIQUE INDEX "deal_stages_tenantId_name_key" ON "deal_stages"("tenantId", "name");

-- Create indexes
CREATE INDEX "deal_stages_tenantId_idx" ON "deal_stages"("tenantId");
CREATE INDEX "deal_stages_order_idx" ON "deal_stages"("order");

-- Migrate existing deals: Create default stages for each tenant
INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    t.id,
    'Lead',
    0,
    'secondary',
    10,
    true,
    false,
    false,
    NOW(),
    NOW()
FROM "tenants" t;

INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    t.id,
    'Qualified',
    1,
    'primary',
    25,
    false,
    false,
    false,
    NOW(),
    NOW()
FROM "tenants" t;

INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    t.id,
    'Proposal',
    2,
    'warning',
    50,
    false,
    false,
    false,
    NOW(),
    NOW()
FROM "tenants" t;

INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    t.id,
    'Negotiation',
    3,
    'info',
    75,
    false,
    false,
    false,
    NOW(),
    NOW()
FROM "tenants" t;

INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    t.id,
    'Closed Won',
    4,
    'success',
    100,
    false,
    true,
    false,
    NOW(),
    NOW()
FROM "tenants" t;

INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    t.id,
    'Closed Lost',
    5,
    'danger',
    0,
    false,
    false,
    true,
    NOW(),
    NOW()
FROM "tenants" t;

-- Add stageId column to deals table
ALTER TABLE "deals" ADD COLUMN "stageId" TEXT;

-- Migrate existing deal stages to new format
UPDATE "deals" d
SET "stageId" = (
    SELECT ds.id 
    FROM "deal_stages" ds 
    WHERE ds."tenantId" = d."tenantId" 
    AND ds.name = CASE d.stage
        WHEN 'LEAD' THEN 'Lead'
        WHEN 'QUALIFIED' THEN 'Qualified'
        WHEN 'PROPOSAL' THEN 'Proposal'
        WHEN 'NEGOTIATION' THEN 'Negotiation'
        WHEN 'CLOSED_WON' THEN 'Closed Won'
        WHEN 'CLOSED_LOST' THEN 'Closed Lost'
    END
);

-- Make stageId required
ALTER TABLE "deals" ALTER COLUMN "stageId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "deals" ADD CONSTRAINT "deals_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "deal_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create index
CREATE INDEX "deals_stageId_idx" ON "deals"("stageId");

-- Drop old stage column and index
DROP INDEX IF EXISTS "deals_stage_idx";
ALTER TABLE "deals" DROP COLUMN "stage";

-- Drop old DealStage enum
DROP TYPE IF EXISTS "DealStage";
