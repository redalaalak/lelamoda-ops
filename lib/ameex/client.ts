const BASE = 'https://api.ameex.app/customer/Delivery'
const API_ID = process.env.AMEEX_API_ID!
const API_KEY = process.env.AMEEX_API_KEY!

function headers() {
  return { 'C-Api-Id': API_ID, 'C-Api-Key': API_KEY }
}

async function ameexFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers || {}) },
  })
  return res.json()
}

export interface AmeexParcelInput {
  receiver: string
  phone: string
  city: string       // City ID
  address: string
  cod: number
  product?: string
  comment?: string
  order_num?: string
  open?: boolean
  fragile?: boolean
}

export async function createParcel(input: AmeexParcelInput) {
  const form = new FormData()
  form.append('type', 'SIMPLE')
  form.append('business', API_ID)
  form.append('receiver', input.receiver)
  form.append('phone', input.phone)
  form.append('city', input.city)
  form.append('address', input.address)
  form.append('cod', String(input.cod))
  if (input.product) form.append('product', input.product)
  if (input.comment) form.append('comment', input.comment)
  if (input.order_num) form.append('order_num', input.order_num)
  form.append('open', input.open ? 'YES' : 'NO')
  form.append('fragile', input.fragile ? '1' : '0')
  form.append('try', 'YES')

  return ameexFetch('/Parcels/Action/Type/Add', { method: 'POST', body: form })
}

export async function getParcelInfo(code: string) {
  return ameexFetch(`/Parcels/Info?ParcelCode=${encodeURIComponent(code)}`)
}

export async function getParcelTracking(code: string) {
  return ameexFetch(`/Parcels/Tracking?ParcelCode=${encodeURIComponent(code)}`)
}

export async function deleteParcel(code: string) {
  return ameexFetch(`/Parcels/Action/Type/Delete?ParcelCode=${encodeURIComponent(code)}`, { method: 'DELETE' })
}

export async function relaunchParcel(code: string) {
  return ameexFetch(`/Parcels/Action/Type/Relaunch?ParcelCode=${encodeURIComponent(code)}`)
}

export async function massTracking(codes: string[]) {
  const form = new FormData()
  form.append('codes', codes.join(','))
  return ameexFetch('/Parcels/MassTracking', { method: 'POST', body: form })
}

export async function getCities() {
  return ameexFetch('/Cities')
}
