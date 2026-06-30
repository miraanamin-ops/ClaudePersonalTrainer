import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(root, '.env.local') })
dotenv.config({ path: path.join(root, '.env') })

import { createClient } from '@libsql/client'

const PRIORITY_EXERCISES = [
  'Dumbbell Chest Press',
  'Incline Dumbbell Press',
  'Lat Pulldown',
  'Dumbbell Row',
  'Dumbbell Shoulder Press',
  'Squat',
  'Romanian Deadlift',
  'Leg Press',
  'Deadlift',
]

async function addColumn(client: ReturnType<typeof createClient>, sql: string, label: string) {
  try {
    await client.execute(sql)
    console.log(`  ✓ ${label}`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('duplicate column') || msg.includes('already has a column') || msg.includes('already exists')) {
      console.log(`  · ${label} already exists`)
    } else {
      throw e
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')

  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  console.log('Applying schema additions...')

  await addColumn(
    client,
    'ALTER TABLE exercises ADD COLUMN is_priority INTEGER NOT NULL DEFAULT 0',
    'exercises.is_priority',
  )
  await addColumn(
    client,
    'ALTER TABLE mesocycles ADD COLUMN block_number INTEGER NOT NULL DEFAULT 1',
    'mesocycles.block_number',
  )
  await addColumn(
    client,
    'ALTER TABLE mesocycles ADD COLUMN workouts_per_week INTEGER NOT NULL DEFAULT 3',
    'mesocycles.workouts_per_week',
  )

  // Ensure readiness table exists (may not have been created if Phase 1 used local-only push)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS readiness (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       DATETIME NOT NULL,
      sleep_hours REAL NOT NULL,
      soreness   INTEGER NOT NULL,
      energy     INTEGER NOT NULL,
      notes      TEXT
    )
  `)
  console.log('  · readiness table ensured')

  console.log('Setting isPriority on compound lifts...')
  for (const name of PRIORITY_EXERCISES) {
    const result = await client.execute({
      sql: 'UPDATE exercises SET is_priority = 1 WHERE name = ?',
      args: [name],
    })
    if (result.rowsAffected > 0) {
      console.log(`  ✓ ${name}`)
    } else {
      console.log(`  · ${name} — not found (skip)`)
    }
  }

  // -------------------------------------------------------------------------
  // Phase 6: nutrition
  // -------------------------------------------------------------------------
  await addColumn(
    client,
    'ALTER TABLE meal_plan ADD COLUMN breakfast_locked INTEGER NOT NULL DEFAULT 0',
    'meal_plan.breakfast_locked',
  )
  await addColumn(
    client,
    'ALTER TABLE meal_plan ADD COLUMN dinner_locked INTEGER NOT NULL DEFAULT 0',
    'meal_plan.dinner_locked',
  )

  await client.execute(`
    CREATE TABLE IF NOT EXISTS meal_plan_snacks (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_plan_id INTEGER NOT NULL REFERENCES meal_plan(id),
      meal_id      INTEGER NOT NULL REFERENCES meals(id)
    )
  `)
  console.log('  · meal_plan_snacks table ensured')

  await client.execute(`
    CREATE TABLE IF NOT EXISTS nutrition_targets (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      kcal       INTEGER NOT NULL,
      protein_g  REAL NOT NULL,
      fat_g      REAL NOT NULL,
      carbs_g    REAL NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('  · nutrition_targets table ensured')

  // Phase 7: meal ingredients
  await client.execute(`
    CREATE TABLE IF NOT EXISTS meal_ingredients (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      mealId            INTEGER NOT NULL REFERENCES meals(id),
      ingredientName    TEXT NOT NULL,
      quantity          REAL NOT NULL,
      unit              TEXT NOT NULL,
      supermarketAisle  TEXT NOT NULL
    )
  `)
  console.log('  · meal_ingredients table ensured')

  // Seed default targets if table is empty
  const existing = await client.execute('SELECT COUNT(*) as n FROM nutrition_targets')
  const count = Number((existing.rows[0] as unknown as { n: number }).n)
  if (count === 0) {
    await client.execute('INSERT INTO nutrition_targets (kcal, protein_g, fat_g, carbs_g) VALUES (2400, 180, 70, 270)')
    console.log('  ✓ default nutrition targets seeded')
  } else {
    console.log('  · nutrition targets already set')
  }

  // -------------------------------------------------------------------------
  // Phase 8: off-plan meals + eaten tracking
  // -------------------------------------------------------------------------
  await addColumn(client, 'ALTER TABLE meal_plan ADD COLUMN breakfast_eaten INTEGER NOT NULL DEFAULT 0', 'meal_plan.breakfast_eaten')
  await addColumn(client, 'ALTER TABLE meal_plan ADD COLUMN lunch_eaten INTEGER NOT NULL DEFAULT 1', 'meal_plan.lunch_eaten')
  await addColumn(client, 'ALTER TABLE meal_plan ADD COLUMN dinner_eaten INTEGER NOT NULL DEFAULT 0', 'meal_plan.dinner_eaten')
  await addColumn(client, 'ALTER TABLE meal_plan_snacks ADD COLUMN eaten INTEGER NOT NULL DEFAULT 0', 'meal_plan_snacks.eaten')
  await addColumn(client, 'ALTER TABLE meals ADD COLUMN instructions TEXT', 'meals.instructions')
  await addColumn(client, 'ALTER TABLE meal_plan ADD COLUMN breakfast_skipped INTEGER NOT NULL DEFAULT 0', 'meal_plan.breakfast_skipped')
  await addColumn(client, 'ALTER TABLE meal_plan ADD COLUMN lunch_skipped INTEGER NOT NULL DEFAULT 0', 'meal_plan.lunch_skipped')
  await addColumn(client, 'ALTER TABLE meal_plan ADD COLUMN dinner_skipped INTEGER NOT NULL DEFAULT 0', 'meal_plan.dinner_skipped')
  await addColumn(client, 'ALTER TABLE meal_plan_snacks ADD COLUMN skipped INTEGER NOT NULL DEFAULT 0', 'meal_plan_snacks.skipped')

  await client.execute(`
    CREATE TABLE IF NOT EXISTS off_plan_meals (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        DATETIME NOT NULL,
      description TEXT NOT NULL,
      kcal        INTEGER NOT NULL,
      protein_g   REAL NOT NULL,
      fat_g       REAL NOT NULL,
      carbs_g     REAL NOT NULL
    )
  `)
  console.log('  · off_plan_meals table ensured')

  // -------------------------------------------------------------------------
  // Activity tracking: gym trips
  // -------------------------------------------------------------------------
  await client.execute(`
    CREATE TABLE IF NOT EXISTS gym_trips (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      date                 DATETIME NOT NULL,
      workout_id           INTEGER REFERENCES workouts(id),
      travel_to_mode       TEXT NOT NULL,
      travel_to_calories   INTEGER,
      travel_to_dist_km    REAL,
      travel_to_dur_min    REAL,
      travel_from_mode     TEXT NOT NULL,
      travel_from_calories INTEGER,
      travel_from_dist_km  REAL,
      travel_from_dur_min  REAL,
      workout_calories     INTEGER
    )
  `)
  console.log('  · gym_trips table ensured')

  // -------------------------------------------------------------------------
  // Standalone activities: runs/walks/cycles/swims logged outside the gym
  // -------------------------------------------------------------------------
  await client.execute(`
    CREATE TABLE IF NOT EXISTS activities (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      date     DATETIME NOT NULL,
      type     TEXT NOT NULL,
      dist_km  REAL,
      dur_min  REAL,
      calories INTEGER,
      note     TEXT
    )
  `)
  console.log('  · activities table ensured')

  // -------------------------------------------------------------------------
  // Daily targets: water intake + creatine supplement
  // -------------------------------------------------------------------------
  await client.execute(`
    CREATE TABLE IF NOT EXISTS supplement_settings (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      water_target_ml  INTEGER NOT NULL DEFAULT 2000,
      water_serving_ml INTEGER NOT NULL DEFAULT 500,
      creatine_dose_g  REAL NOT NULL DEFAULT 5,
      updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('  · supplement_settings table ensured')

  await client.execute(`
    CREATE TABLE IF NOT EXISTS water_intake (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      date           DATETIME NOT NULL,
      completed_mask INTEGER NOT NULL DEFAULT 0
    )
  `)
  console.log('  · water_intake table ensured')

  await client.execute(`
    CREATE TABLE IF NOT EXISTS creatine_log (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      date  DATETIME NOT NULL,
      taken INTEGER NOT NULL DEFAULT 0
    )
  `)
  console.log('  · creatine_log table ensured')

  const suppExisting = await client.execute('SELECT COUNT(*) as n FROM supplement_settings')
  const suppCount = Number((suppExisting.rows[0] as unknown as { n: number }).n)
  if (suppCount === 0) {
    await client.execute('INSERT INTO supplement_settings (water_target_ml, water_serving_ml, creatine_dose_g) VALUES (2000, 500, 5)')
    console.log('  ✓ default supplement settings seeded')
  } else {
    console.log('  · supplement settings already set')
  }

  client.close()
  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
