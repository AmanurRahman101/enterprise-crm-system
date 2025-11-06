-- Step 1: Create deal_stages table
CREATE TABLE "deal_stages" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "deal_stages_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create indexes for deal_stages
CREATE INDEX "deal_stages_tenantId_idx" ON "deal_stages"("tenantId");
CREATE INDEX "deal_stages_tenantId_order_idx" ON "deal_stages"("tenantId", "order");
CREATE UNIQUE INDEX "deal_stages_tenantId_name_key" ON "deal_stages"("tenantId", "name");

-- Step 3: Add foreign key to tenants
ALTER TABLE "deal_stages" ADD CONSTRAINT "deal_stages_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Insert default stages for all existing tenants
INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid() || '-LEAD', 
    t."id",
    'Lead',
    0,
    'secondary',
    10,
    true,
    false,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "tenants" t;

INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid() || '-QUALIFIED', 
    t."id",
    'Qualified',
    1,
    'primary',
    25,
    false,
    false,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "tenants" t;

INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid() || '-PROPOSAL', 
    t."id",
    'Proposal',
    2,
    'warning',
    50,
    false,
    false,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "tenants" t;

INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid() || '-NEGOTIATION', 
    t."id",
    'Negotiation',
    3,
    'primary',
    75,
    false,
    false,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "tenants" t;

INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid() || '-CLOSED_WON', 
    t."id",
    'Closed Won',
    4,
    'success',
    100,
    false,
    true,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "tenants" t;

INSERT INTO "deal_stages" ("id", "tenantId", "name", "order", "color", "probability", "isDefault", "isWon", "isLost", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid() || '-CLOSED_LOST', 
    t."id",
    'Closed Lost',
    5,
    'danger',
    0,
    false,
    false,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "tenants" t;

-- Step 5: Add stageId column to deals (nullable first)
ALTER TABLE "deals" ADD COLUMN "stageId" TEXT;

-- Step 6: Migrate existing data - map old enum stage to new stageId
UPDATE "deals" d
SET "stageId" = ds."id"
FROM "deal_stages" ds
WHERE d."tenantId" = ds."tenantId"
  AND (
    (d."stage" = 'LEAD' AND ds."name" = 'Lead') OR
    (d."stage" = 'QUALIFIED' AND ds."name" = 'Qualified') OR
    (d."stage" = 'PROPOSAL' AND ds."name" = 'Proposal') OR
    (d."stage" = 'NEGOTIATION' AND ds."name" = 'Negotiation') OR
    (d."stage" = 'CLOSED_WON' AND ds."name" = 'Closed Won') OR
    (d."stage" = 'CLOSED_LOST' AND ds."name" = 'Closed Lost')
  );

-- Step 7: Make stageId NOT NULL
ALTER TABLE "deals" ALTER COLUMN "stageId" SET NOT NULL;

-- Step 8: Create index on stageId
CREATE INDEX "deals_stageId_idx" ON "deals"("stageId");

-- Step 9: Add foreign key constraint
ALTER TABLE "deals" ADD CONSTRAINT "deals_stageId_fkey" 
    FOREIGN KEY ("stageId") REFERENCES "deal_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 10: Drop the old stage column and index
DROP INDEX IF EXISTS "deals_stage_idx";
ALTER TABLE "deals" DROP COLUMN "stage";

-- Step 11: Drop the DealStage enum
DROP TYPE IF EXISTS "DealStage";
