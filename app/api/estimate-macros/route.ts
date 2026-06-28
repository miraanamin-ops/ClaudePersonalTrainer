import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `You are a nutrition assistant. When given a food description, respond with ONLY valid JSON in this exact shape — no prose, no markdown, no explanation:
{"kcal":number,"proteinG":number,"fatG":number,"carbsG":number}
Estimate for a typical single portion. Use an integer for kcal and one decimal place for macros.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key missing — add ANTHROPIC_API_KEY to your environment variables' },
      { status: 503 },
    )
  }

  let description: string
  try {
    const body = await req.json()
    description = typeof body.description === 'string' ? body.description.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!description) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 })
  }

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 128,
      system: SYSTEM,
      messages: [{ role: 'user', content: description }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: "Couldn't estimate — enter manually" }, { status: 422 })
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return NextResponse.json({ error: "Couldn't estimate — enter manually" }, { status: 422 })
    }

    const { kcal, proteinG, fatG, carbsG } = parsed as Record<string, unknown>

    if (
      typeof kcal !== 'number' || typeof proteinG !== 'number' ||
      typeof fatG !== 'number'  || typeof carbsG !== 'number'
    ) {
      return NextResponse.json({ error: "Couldn't estimate — enter manually" }, { status: 422 })
    }

    if (kcal < 0 || proteinG < 0 || fatG < 0 || carbsG < 0) {
      return NextResponse.json({ error: 'Estimate contained negative values — enter manually' }, { status: 422 })
    }

    // Plausibility: macros-derived kcal should be within 25% of stated kcal
    const derivedKcal = proteinG * 4 + carbsG * 4 + fatG * 9
    const plausible = kcal > 0 && Math.abs(derivedKcal - kcal) / kcal < 0.25

    return NextResponse.json({
      kcal:     Math.round(kcal),
      proteinG: Math.round(proteinG * 10) / 10,
      fatG:     Math.round(fatG * 10)     / 10,
      carbsG:   Math.round(carbsG * 10)   / 10,
      plausible,
    })
  } catch {
    return NextResponse.json({ error: "Couldn't estimate — enter manually" }, { status: 422 })
  }
}
