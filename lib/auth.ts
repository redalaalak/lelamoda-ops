import { createHmac } from 'crypto'

const SECRET = process.env.ADMIN_SECRET || 'tawsilak-secret-dev'

export function generateToken(): string {
  return createHmac('sha256', SECRET).update('admin_v1').digest('hex')
}

export function verifyToken(token: string): boolean {
  const expected = generateToken()
  return token === expected
}
