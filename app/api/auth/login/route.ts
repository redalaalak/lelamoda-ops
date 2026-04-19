import { NextResponse } from 'next/server'
import { generateToken } from '@/lib/auth'

export async function POST(req: Request) {
  const { username, password } = await req.json()

  const expectedUser = process.env.ADMIN_USERNAME || 'test'
  const expectedPass = process.env.ADMIN_PASSWORD || 'test'

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
  }

  const token = generateToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return res
}
