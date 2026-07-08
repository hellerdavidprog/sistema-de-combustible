'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { fuelReceipts } from "@/lib/db/schema"
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getFuelReceipts() {
  const userId = await getUserId()
  return db
    .select()
    .from(fuelReceipts)
    .where(eq(fuelReceipts.userId, userId))
    .orderBy(desc(fuelReceipts.createdAt))
}

export async function createFuelReceipt(data: {
  date: string
  time: string
  aircraft_registration: string
  supplier?: string
  initial_reading: number
  final_reading: number
  liters_dispensed: number
  origin: string
  destination: string
  notes?: string
  receipt_number?: string
  operation_type?: string
}) {
  const userId = await getUserId()
  await db.insert(fuelReceipts).values({
    userId,
    ...data,
  })
  revalidatePath("/operator")
  revalidatePath("/admin/receipts")
}

export async function updateFuelReceipt(
  id: string,
  fields: Partial<{
    date: string
    time: string
    aircraft_registration: string
    supplier?: string
    initial_reading: number
    final_reading: number
    liters_dispensed: number
    origin: string
    destination: string
    notes?: string
    receipt_number?: string
    operation_type?: string
  }>
) {
  const userId = await getUserId()
  await db
    .update(fuelReceipts)
    .set(fields)
    .where(and(eq(fuelReceipts.id, id), eq(fuelReceipts.userId, userId)))
  revalidatePath("/operator")
  revalidatePath("/admin/receipts")
}

export async function deleteFuelReceipt(id: string) {
  const userId = await getUserId()
  await db
    .delete(fuelReceipts)
    .where(and(eq(fuelReceipts.id, id), eq(fuelReceipts.userId, userId)))
  revalidatePath("/operator")
  revalidatePath("/admin/receipts")
}
