import { NextResponse } from 'next/server'
import { moveOrderBusinessStatus } from '@/lib/orders/actions'

const ALLOWED = ['confirmed', 'to_edit', 'canceled_confirmation']

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const orderId = formData.get('orderId') as string
    const newStatus = formData.get('status') as string
    const redirectTo = (formData.get('redirect') as string) || '/centers/confirmation'

    if (!ALLOWED.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await moveOrderBusinessStatus(orderId, newStatus, 'user', `Agent changed to ${newStatus}`)

    return NextResponse.redirect(new URL(redirectTo, req.url))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
