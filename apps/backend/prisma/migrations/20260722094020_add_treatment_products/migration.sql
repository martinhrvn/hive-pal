-- CreateEnum
CREATE TYPE "TreatmentPhysicalForm" AS ENUM ('LIQUID', 'POWDER', 'GEL', 'STRIP', 'GASEOUS');

-- CreateEnum
CREATE TYPE "TreatmentApplicationMethod" AS ENUM ('TRICKLE', 'SPRAY', 'SUBLIMATE', 'EVAPORATE', 'INSERT', 'OTHER');

-- CreateEnum
CREATE TYPE "MiteCountMethod" AS ENUM ('NATURAL_DROP', 'SUGAR_ROLL', 'ALCOHOL_WASH', 'CO2', 'OTHER');

-- AlterTable
ALTER TABLE "TreatmentAction" ADD COLUMN     "miteCountAfter" DOUBLE PRECISION,
ADD COLUMN     "miteCountBefore" DOUBLE PRECISION,
ADD COLUMN     "miteCountMethod" "MiteCountMethod",
ADD COLUMN     "miteSampleSize" INTEGER,
ADD COLUMN     "productId" TEXT;

-- CreateTable
CREATE TABLE "ActiveIngredient" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "physicalForm" "TreatmentPhysicalForm" NOT NULL,
    "applicationMethod" "TreatmentApplicationMethod",
    "defaultUnit" TEXT,
    "density" DOUBLE PRECISION,
    "withdrawalPeriodDays" INTEGER,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentProductIngredient" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "activeIngredientId" TEXT NOT NULL,
    "concentration" DOUBLE PRECISION NOT NULL,
    "concentrationUnit" TEXT NOT NULL,

    CONSTRAINT "TreatmentProductIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveIngredient_key_key" ON "ActiveIngredient"("key");

-- CreateIndex
CREATE INDEX "TreatmentProduct_userId_idx" ON "TreatmentProduct"("userId");

-- CreateIndex
CREATE INDEX "TreatmentProductIngredient_activeIngredientId_idx" ON "TreatmentProductIngredient"("activeIngredientId");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentProductIngredient_productId_activeIngredientId_key" ON "TreatmentProductIngredient"("productId", "activeIngredientId");

-- CreateIndex
CREATE INDEX "TreatmentAction_productId_idx" ON "TreatmentAction"("productId");

-- AddForeignKey
ALTER TABLE "TreatmentAction" ADD CONSTRAINT "TreatmentAction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TreatmentProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentProduct" ADD CONSTRAINT "TreatmentProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentProductIngredient" ADD CONSTRAINT "TreatmentProductIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TreatmentProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentProductIngredient" ADD CONSTRAINT "TreatmentProductIngredient_activeIngredientId_fkey" FOREIGN KEY ("activeIngredientId") REFERENCES "ActiveIngredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- Uniqueness: built-in product names are globally unique; custom product names
-- are unique per owning user. (Partial unique indexes — not expressible in the
-- Prisma schema, kept in sync here.)
-- ============================================================================
CREATE UNIQUE INDEX "TreatmentProduct_builtin_name_key" ON "TreatmentProduct"("name") WHERE "userId" IS NULL;
CREATE UNIQUE INDEX "TreatmentProduct_user_name_key" ON "TreatmentProduct"("userId", "name") WHERE "userId" IS NOT NULL;

-- ============================================================================
-- Seed: built-in active ingredients (canonical identities for cross-product totals)
-- ============================================================================
INSERT INTO "ActiveIngredient" (id, key, name, "isBuiltIn", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'OXALIC_ACID', 'Oxalic acid (dihydrate)', true, NOW(), NOW()),
  (gen_random_uuid(), 'FORMIC_ACID', 'Formic acid', true, NOW(), NOW()),
  (gen_random_uuid(), 'LACTIC_ACID', 'Lactic acid', true, NOW(), NOW()),
  (gen_random_uuid(), 'THYMOL', 'Thymol', true, NOW(), NOW()),
  (gen_random_uuid(), 'MENTHOL', 'Menthol', true, NOW(), NOW()),
  (gen_random_uuid(), 'AMITRAZ', 'Amitraz', true, NOW(), NOW()),
  (gen_random_uuid(), 'TAU_FLUVALINATE', 'Tau-fluvalinate', true, NOW(), NOW()),
  (gen_random_uuid(), 'COUMAPHOS', 'Coumaphos', true, NOW(), NOW()),
  (gen_random_uuid(), 'FLUMETHRIN', 'Flumethrin', true, NOW(), NOW()),
  (gen_random_uuid(), 'HOP_BETA_ACIDS', 'Hop beta acids', true, NOW(), NOW()),
  (gen_random_uuid(), 'LITHIUM_CHLORIDE', 'Lithium chloride', true, NOW(), NOW());

-- ============================================================================
-- Seed: built-in treatment products (global, userId = NULL).
-- withdrawalPeriodDays and concentrations are sensible, EDITABLE defaults;
-- generic substances use a pure-substance basis, branded products use documented
-- label values (e.g. VarroMed 5 mg/ml formic + 44 mg/ml oxalic acid).
-- ============================================================================
INSERT INTO "TreatmentProduct" (id, "userId", name, "physicalForm", "applicationMethod", "defaultUnit", density, "withdrawalPeriodDays", "isBuiltIn", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), NULL, 'VarroMed',    'LIQUID',  'TRICKLE',   'ml',  NULL, 0,    true, NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Oxalic Acid', 'POWDER',  'SUBLIMATE', 'g',   NULL, 0,    true, NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Formic Acid', 'LIQUID',  'EVAPORATE', 'ml',  1.22, 0,    true, NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Thymol',      'POWDER',  NULL,        'g',   NULL, 0,    true, NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Apivar',      'STRIP',   'INSERT',    'pcs', NULL, NULL, true, NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Apistan',     'STRIP',   'INSERT',    'pcs', NULL, NULL, true, NOW(), NOW()),
  (gen_random_uuid(), NULL, 'CheckMite+',  'STRIP',   'INSERT',    'pcs', NULL, 42,   true, NOW(), NOW()),
  (gen_random_uuid(), NULL, 'HopGuard',    'STRIP',   'INSERT',    'pcs', NULL, 0,    true, NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Api-Bioxal',  'POWDER',  'SUBLIMATE', 'g',   NULL, 0,    true, NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Apiguard',    'GEL',     NULL,        'g',   NULL, 0,    true, NOW(), NOW()),
  (gen_random_uuid(), NULL, 'MAQS',        'STRIP',   'EVAPORATE', 'pcs', NULL, 0,    true, NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Fumigation',  'GASEOUS', NULL,        'pcs', NULL, NULL, true, NOW(), NOW());

-- ============================================================================
-- Seed: built-in product compositions (documented label values where known;
-- HopGuard/Fumigation intentionally left without composition rather than guess).
-- ============================================================================
INSERT INTO "TreatmentProductIngredient" (id, "productId", "activeIngredientId", concentration, "concentrationUnit")
SELECT gen_random_uuid(), p.id, i.id, c.conc, c.unit
FROM (VALUES
  ('VarroMed',    'FORMIC_ACID',     5,     'mg/ml'),
  ('VarroMed',    'OXALIC_ACID',     44,    'mg/ml'),
  ('Oxalic Acid', 'OXALIC_ACID',     1000,  'mg/g'),
  ('Formic Acid', 'FORMIC_ACID',     1000,  'mg/g'),
  ('Thymol',      'THYMOL',          1000,  'mg/g'),
  ('Apivar',      'AMITRAZ',         500,   'mg/piece'),
  ('Apistan',     'TAU_FLUVALINATE', 824,   'mg/piece'),
  ('CheckMite+',  'COUMAPHOS',       1360,  'mg/piece'),
  ('Api-Bioxal',  'OXALIC_ACID',     886,   'mg/g'),
  ('Apiguard',    'THYMOL',          25,    '%w/w'),
  ('MAQS',        'FORMIC_ACID',     31850, 'mg/piece')
) AS c(prod, ing, conc, unit)
JOIN "TreatmentProduct" p ON p.name = c.prod AND p."userId" IS NULL
JOIN "ActiveIngredient" i ON i.key = c.ing;

-- ============================================================================
-- Data migration: link existing treatment records to the new built-in catalog
-- (match either the stored enum key or its label). Unknown/OTHER stay uncatalogued.
-- ============================================================================
UPDATE "TreatmentAction" ta SET "productId" = p.id
FROM "TreatmentProduct" p
WHERE p."userId" IS NULL AND ta."productId" IS NULL AND (
  (ta.product IN ('OXALIC_ACID','Oxalic Acid')     AND p.name = 'Oxalic Acid') OR
  (ta.product IN ('FORMIC_ACID','Formic Acid')     AND p.name = 'Formic Acid') OR
  (ta.product IN ('THYMOL','Thymol')               AND p.name = 'Thymol') OR
  (ta.product IN ('APIVAR','Apivar')               AND p.name = 'Apivar') OR
  (ta.product IN ('APISTAN','Apistan')             AND p.name = 'Apistan') OR
  (ta.product IN ('CHECKMITE_PLUS','CheckMite+')   AND p.name = 'CheckMite+') OR
  (ta.product IN ('HOPGUARD','HopGuard')           AND p.name = 'HopGuard') OR
  (ta.product IN ('API_BIOXAL','Api-Bioxal')       AND p.name = 'Api-Bioxal') OR
  (ta.product IN ('APIGUARD','Apiguard')           AND p.name = 'Apiguard') OR
  (ta.product IN ('MAQS')                          AND p.name = 'MAQS') OR
  (ta.product IN ('FUMIGATION','Fumigation')       AND p.name = 'Fumigation')
);
