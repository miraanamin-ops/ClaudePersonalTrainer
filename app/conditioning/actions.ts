'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { nextWod } from '@/lib/conditioning'

// Creates a conditioning session auto-filled from the rotating WOD library
// (picked by how many have been logged so far), then opens it for logging.
export async function startConditioning() {
  const completedCount = await prisma.conditioningSession.count()
  const wod = nextWod(completedCount)
  const session = await prisma.conditioningSession.create({
    data: {
      date: new Date(),
      title: wod.title,
      format: wod.format,
      prescription: wod.prescription.join('\n'),
      resultType: wod.resultType,
      resultText: null,
      note: null,
    },
  })
  redirect(`/conditioning/${session.id}`)
}

export async function saveConditioningResult(
  id: number,
  resultText: string | null,
  note: string | null,
) {
  await prisma.conditioningSession.update({
    where: { id },
    data: { resultText, note },
  })
  revalidatePath(`/conditioning/${id}`)
  revalidatePath('/workouts')
}

export async function deleteConditioningSession(id: number) {
  await prisma.conditioningSession.delete({ where: { id } })
  redirect('/workouts')
}
