import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(root, '.env.local') })
dotenv.config({ path: path.join(root, '.env') })

import { createClient } from '@libsql/client'

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `You are a recipe writer. Given a meal name and ingredient list, write concise numbered cooking steps.
Output ONLY a JSON array of strings — no prose, no markdown, no code fences.
Example: ["Heat oil in a pan over medium heat.", "Season chicken and cook for 5 minutes each side."]
Use Celsius for temperatures. Include timings. 5–8 steps maximum.`

async function generateInstructions(
  client: Anthropic,
  mealName: string,
  mealType: string,
  ingredients: { name: string; quantity: number; unit: string }[],
): Promise<string[]> {
  const ingredientList = ingredients
    .map(i => `- ${i.quantity} ${i.unit} ${i.name}`)
    .join('\n')

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Meal: ${mealName} (${mealType}, 1 serving)\nIngredients:\n${ingredientList}`,
      },
    ],
  })

  const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  const parsed = JSON.parse(cleaned)
  if (!Array.isArray(parsed)) throw new Error('Response is not an array')
  return parsed as string[]
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set in .env.local')
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')

  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const mealsResult = await db.execute(
    'SELECT id, name, type FROM meals WHERE instructions IS NULL ORDER BY type, name',
  )

  if (mealsResult.rows.length === 0) {
    console.log('All meals already have instructions.')
    db.close()
    return
  }

  console.log(`Generating instructions for ${mealsResult.rows.length} meals...\n`)

  for (const row of mealsResult.rows) {
    const id = row.id as number
    const name = row.name as string
    const type = row.type as string

    const ingResult = await db.execute({
      sql: 'SELECT ingredientName, quantity, unit FROM meal_ingredients WHERE mealId = ? ORDER BY id',
      args: [id],
    })

    const ingredients = ingResult.rows.map(r => ({
      name:     r.ingredientName as string,
      quantity: r.quantity as number,
      unit:     r.unit as string,
    }))

    process.stdout.write(`  ${name}... `)

    try {
      const steps = await generateInstructions(anthropic, name, type, ingredients)
      const json = JSON.stringify(steps)

      await db.execute({
        sql: 'UPDATE meals SET instructions = ? WHERE id = ?',
        args: [json, id],
      })

      console.log(`✓ (${steps.length} steps)`)
    } catch (e) {
      console.log(`✗ failed — ${e instanceof Error ? e.message : String(e)}`)
    }

    // Small pause to avoid rate limits
    await new Promise(r => setTimeout(r, 300))
  }

  db.close()
  console.log('\nDone.')
}

main().catch(e => { console.error(e); process.exit(1) })
