import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { currentPassword, newPassword } = await req.json()

  const expectedPass = process.env.ADMIN_PASSWORD || 'test'

  if (currentPassword !== expectedPass) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 })
  }

  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: 'Minimum 4 caractères' }, { status: 400 })
  }

  // Update env var in Vercel
  const vercelToken = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID

  if (vercelToken && projectId) {
    // Get env var ID first
    const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    })
    const { envs } = await listRes.json()
    const envVar = envs?.find((e: { key: string }) => e.key === 'ADMIN_PASSWORD')

    if (envVar) {
      await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${envVar.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newPassword }),
      })
    }
  }

  return NextResponse.json({ ok: true })
}
