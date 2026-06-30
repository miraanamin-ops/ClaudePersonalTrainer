'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function deleteTrip(id: number) {
  await prisma.gymTrip.delete({ where: { id } })
  revalidatePath('/activity')
}
