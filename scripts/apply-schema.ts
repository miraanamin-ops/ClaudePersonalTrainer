/**
 * Applies the database schema to Turso (or any libsql target).
 * Run once after creating the Turso database:  npx tsx scripts/apply-schema.ts
 * Uses CREATE TABLE IF NOT EXISTS so it is safe to re-run.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@libsql/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(root, '.env.local') })
dotenv.config({ path: path.join(root, '.env') })

const statements = [
  `CREATE TABLE IF NOT EXISTS "body_metrics" (
    "id"         INTEGER PRIMARY KEY AUTOINCREMENT,
    "date"       TEXT    NOT NULL,
    "weightKg"   REAL    NOT NULL,
    "bodyFatPct" REAL,
    "notes"      TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS "exercises" (
    "id"           INTEGER PRIMARY KEY AUTOINCREMENT,
    "name"         TEXT    NOT NULL,
    "muscleGroup"  TEXT    NOT NULL,
    "repRangeLow"  INTEGER NOT NULL,
    "repRangeHigh" INTEGER NOT NULL,
    "incrementKg"  REAL    NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "workout_templates" (
    "id"       INTEGER PRIMARY KEY AUTOINCREMENT,
    "name"     TEXT    NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1
  )`,

  `CREATE TABLE IF NOT EXISTS "template_exercises" (
    "id"         INTEGER PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL REFERENCES "workout_templates"("id"),
    "exerciseId" INTEGER NOT NULL REFERENCES "exercises"("id"),
    "order"      INTEGER NOT NULL,
    "targetSets" INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "mesocycles" (
    "id"          INTEGER PRIMARY KEY AUTOINCREMENT,
    "startDate"   TEXT    NOT NULL,
    "lengthWeeks" INTEGER NOT NULL,
    "currentWeek" INTEGER NOT NULL DEFAULT 1
  )`,

  `CREATE TABLE IF NOT EXISTS "workouts" (
    "id"          INTEGER PRIMARY KEY AUTOINCREMENT,
    "date"        TEXT    NOT NULL,
    "templateId"  INTEGER NOT NULL REFERENCES "workout_templates"("id"),
    "mesocycleId" INTEGER REFERENCES "mesocycles"("id"),
    "weekInBlock" INTEGER,
    "notes"       TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS "workout_sets" (
    "id"         INTEGER PRIMARY KEY AUTOINCREMENT,
    "workoutId"  INTEGER NOT NULL REFERENCES "workouts"("id"),
    "exerciseId" INTEGER NOT NULL REFERENCES "exercises"("id"),
    "setNumber"  INTEGER NOT NULL,
    "weightKg"   REAL    NOT NULL,
    "reps"       INTEGER NOT NULL,
    "rir"        INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "readiness" (
    "id"         INTEGER PRIMARY KEY AUTOINCREMENT,
    "date"       TEXT    NOT NULL,
    "sleepHours" REAL    NOT NULL,
    "soreness"   INTEGER NOT NULL,
    "energy"     INTEGER NOT NULL,
    "notes"      TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS "meals" (
    "id"             INTEGER PRIMARY KEY AUTOINCREMENT,
    "name"           TEXT    NOT NULL,
    "type"           TEXT    NOT NULL,
    "kcal"           INTEGER NOT NULL,
    "proteinG"       REAL    NOT NULL,
    "fatG"           REAL    NOT NULL,
    "carbsG"         REAL    NOT NULL,
    "isAirFryer"     INTEGER NOT NULL DEFAULT 0,
    "makesLeftovers" INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS "meal_ingredients" (
    "id"               INTEGER PRIMARY KEY AUTOINCREMENT,
    "mealId"           INTEGER NOT NULL REFERENCES "meals"("id"),
    "ingredientName"   TEXT    NOT NULL,
    "quantity"         REAL    NOT NULL,
    "unit"             TEXT    NOT NULL,
    "supermarketAisle" TEXT    NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "meal_plan" (
    "id"              INTEGER PRIMARY KEY AUTOINCREMENT,
    "date"            TEXT    NOT NULL,
    "breakfastMealId" INTEGER NOT NULL REFERENCES "meals"("id"),
    "dinnerMealId"    INTEGER NOT NULL REFERENCES "meals"("id")
  )`,
]

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Create .env.local with your Turso credentials.')
  }

  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  try {
    console.log(`Applying schema to: ${process.env.DATABASE_URL}`)
    for (const sql of statements) {
      const tableName = sql.match(/"(\w+)"/)?.[1] ?? '?'
      await client.execute(sql)
      console.log(`  ✓ ${tableName}`)
    }
    console.log('✅ Schema applied.')
  } finally {
    client.close()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
