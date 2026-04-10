'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type OrderStatusContextType = {
  status: string
  paymentStatus: string
  setStatus: (s: string) => void
  setPaymentStatus: (s: string) => void
}

const OrderStatusContext = createContext<OrderStatusContextType | null>(null)

export function OrderStatusProvider({
  orderId,
  initialStatus,
  initialPaymentStatus,
  children,
}: {
  orderId: string
  initialStatus: string
  initialPaymentStatus: string
  children: React.ReactNode
}) {
  const [status, setStatus] = useState(initialStatus)
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)

  useEffect(() => {
    // ── Step 1: Immediately fetch latest status from DB ──────────────────────
    // This bypasses any Next.js router cache that might have served stale HTML.
    // The server component initialStatus might be stale if the page was cached.
    async function syncLatest() {
      const { data } = await supabase
        .from('orders')
        .select('business_status, payment_status')
        .eq('id', orderId)
        .single()
      if (data) {
        setStatus(data.business_status)
        setPaymentStatus(data.payment_status)
      }
    }
    syncLatest()

    // ── Step 2: Subscribe to realtime for live updates ───────────────────────
    // Fires whenever another user / center / webhook changes this order in DB.
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updated = payload.new as any
          // Always update from DB payload — never trust local state only
          if (updated.business_status !== undefined) setStatus(updated.business_status)
          if (updated.payment_status !== undefined) setPaymentStatus(updated.payment_status)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  return (
    <OrderStatusContext.Provider value={{ status, paymentStatus, setStatus, setPaymentStatus }}>
      {children}
    </OrderStatusContext.Provider>
  )
}

export function useOrderStatus() {
  const ctx = useContext(OrderStatusContext)
  if (!ctx) throw new Error('useOrderStatus must be used inside OrderStatusProvider')
  return ctx
}
