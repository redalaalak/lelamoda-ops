import { NextResponse } from 'next/server'
import { addOrderNote } from '@/lib/orders/actions'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { comment } = await req.json()
    const result = await addOrderNote(params.id, comment)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message === 'Note cannot be empty' ? 400 : 500 })
  }
}
