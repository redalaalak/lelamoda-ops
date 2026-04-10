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
    // Subscribe to realtime changes for this specific order
    const channel = supabase
      .channel(`order-${orderId}`)
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
          if (updated.business_status) setStatus(updated.business_status)
          if (updated.payment_status) setPaymentStatus(updated.payment_status)
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
