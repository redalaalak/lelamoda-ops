// Single source of truth for all order status definitions

export const BUSINESS_STATUS_LIST = [
  { value: 'pending_confirmation', label: 'Pending',        color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400' },
  { value: 'confirmed',            label: 'Confirmed',      color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  { value: 'to_edit',              label: 'To Edit',        color: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-400' },
  { value: 'canceled_confirmation',label: 'Canceled',       color: 'bg-red-100 text-red-700',        dot: 'bg-red-400' },
  { value: 'processing',           label: 'Processing',     color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400' },
  { value: 'shipped',              label: 'Shipped',        color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-400' },
  { value: 'delivered',            label: 'Delivered',      color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500' },
  { value: 'returned',             label: 'Returned',       color: 'bg-gray-100 text-gray-600',      dot: 'bg-gray-400' },
  { value: 'out_of_stock',         label: 'Out of Stock',   color: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-400' },
  { value: 'blocked_customer',     label: 'Blocked',        color: 'bg-red-200 text-red-800',        dot: 'bg-red-600' },
  { value: 'follow_up',            label: 'Follow Up',      color: 'bg-sky-100 text-sky-700',        dot: 'bg-sky-400' },
  { value: 'ready_processing',     label: 'Ready',          color: 'bg-teal-100 text-teal-700',      dot: 'bg-teal-400' },
  { value: 'packed',               label: 'Packed',         color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-400' },
  { value: 'closed',               label: 'Closed',         color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
  { value: 'duplicate_order',      label: 'Duplicate',      color: 'bg-rose-100 text-rose-700',      dot: 'bg-rose-400' },
]

// Quick lookups
export const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  BUSINESS_STATUS_LIST.map(s => [s.value, s.label])
)

export const STATUS_COLOR: Record<string, string> = Object.fromEntries(
  BUSINESS_STATUS_LIST.map(s => [s.value, s.color])
)

export const STATUS_DOT: Record<string, string> = Object.fromEntries(
  BUSINESS_STATUS_LIST.map(s => [s.value, s.dot])
)

// Main pipeline flow
export const PIPELINE_STEPS = [
  'pending_confirmation',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
] as const

// Off-pipeline statuses shown as side buttons
export const SIDE_STATUSES = [
  'to_edit',
  'canceled_confirmation',
  'returned',
  'out_of_stock',
  'follow_up',
  'blocked_customer',
] as const

export const VALID_BUSINESS_STATUSES = BUSINESS_STATUS_LIST.map(s => s.value)
