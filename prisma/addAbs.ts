import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(root, '.env.local') })
dotenv.config({ path: path.join(root, '.env') })

import { createClient } from '@libsql/client'

// Idempotent: adds core/ab exercises and appends one to the end of each
// training template. Safe to re-run — it skips anything already present and
// never touches meals, meal plans, or logged workouts.

const ABS_EXERCISES = [
  { name: 'Cable Crunch',      muscleGroup: 'abs', repRangeLow: 10, repRangeHigh: 15, incrementKg: 2.5 },
  { name: 'Hanging Leg Raise', muscleGroup: 'abs', repRangeLow: 8,  repRangeHigh: 15, incrementKg: 2.5 },
  { name: 'Cable Woodchop',    muscleGroup: 'abs', repRangeLow: 12, repRangeHigh: 15, incrementKg: 2.5 },
]

// One core movement at the end of each session (3 sets), rotated for variety
const TEMPLATE_ABS: Record<string, string> = {
  'Upper A':     'Cable Crunch',
  'Lower A':     'Hanging Leg Raise',
  'Upper B':     'Cable Woodchop',
  'Lower B':     'Cable Crunch',
  'Full Body A': 'Hanging Leg Raise',
  'Full Body B': 'Cable Woodchop',
  'Full Body C': 'Cable Crunch',
}
const AB_SETS = 3

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  console.log('Adding ab exercises...')
  for (const ex of ABS_EXERCISES) {
    const existing = await client.execute({ sql: 'SELECT id FROM exercises WHERE name = ?', args: [ex.name] })
    if (existing.rows.length > 0) {
      console.log(`  · ${ex.name} already exists`)
    } else {
      await client.execute({
        sql: `INSERT INTO exercises (name, muscleGroup, repRangeLow, repRangeHigh, incrementKg, is_priority)
              VALUES (?, ?, ?, ?, ?, 0)`,
        args: [ex.name, ex.muscleGroup, ex.repRangeLow, ex.repRangeHigh, ex.incrementKg],
      })
      console.log(`  ✓ ${ex.name} added`)
    }
  }

  const exRows = await client.execute('SELECT id, name FROM exercises')
  const exId = new Map<string, number>(exRows.rows.map(r => [r.name as string, r.id as number]))

  console.log('Appending core work to templates...')
  for (const [templateName, abName] of Object.entries(TEMPLATE_ABS)) {
    const t = await client.execute({ sql: 'SELECT id FROM workout_templates WHERE name = ?', args: [templateName] })
    if (t.rows.length === 0) { console.log(`  · template ${templateName} not found (skip)`); continue }
    const templateId = t.rows[0].id as number
    const abId = exId.get(abName)
    if (abId === undefined) { console.log(`  · exercise ${abName} missing (skip)`); continue }

    const already = await client.execute({
      sql: 'SELECT id FROM template_exercises WHERE templateId = ? AND exerciseId = ?',
      args: [templateId, abId],
    })
    if (already.rows.length > 0) { console.log(`  · ${templateName} already has ${abName}`); continue }

    const maxOrder = await client.execute({
      sql: 'SELECT COALESCE(MAX("order"), 0) AS m FROM template_exercises WHERE templateId = ?',
      args: [templateId],
    })
    const nextOrder = Number((maxOrder.rows[0] as unknown as { m: number }).m) + 1
    await client.execute({
      sql: 'INSERT INTO template_exercises (templateId, exerciseId, "order", targetSets) VALUES (?, ?, ?, ?)',
      args: [templateId, abId, nextOrder, AB_SETS],
    })
    console.log(`  ✓ ${templateName} += ${abName} (order ${nextOrder}, ${AB_SETS} sets)`)
  }

  client.close()
  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
