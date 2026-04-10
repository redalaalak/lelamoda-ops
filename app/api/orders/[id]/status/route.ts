import { NextResponse } from 'next/server'
import { moveOrderBusinessStatus, updateOrderPaymentStatus } from '@/lib/orders/actions'
import { VALID_BUSINESS_STATUSES } from '@/lib/orders/constants'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { status, paymentStatus, reason } = body

    // Business status change
    if (status) {
      if (!VALID_BUSINESS_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      const result = await moveOrderBusinessStatus(params.id, status, 'user', reason)
      return NextResponse.json(result)
    }

    // Payment status change
    if (paymentStatus) {
      if (!['pending', 'paid', 'refunded'].includes(paymentStatus)) {
        return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
      }
      const result = await updateOrderPaymentStatus(params.id, paymentStatus, 'user', reason)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'No status provided' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
