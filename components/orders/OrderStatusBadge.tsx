'use client'

import { useOrderStatus } from './OrderStatusContext'
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/orders/constants'

export default function OrderStatusBadge() {
  const { status } = useOrderStatus()
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}
