import Link from 'next/link'

interface Action {
  label: string
  href?: string
  onClick?: string
  variant?: 'primary' | 'secondary'
  icon?: React.ReactNode
}

interface Props {
  back?: string
  title: string
  count?: number
  countLabel?: string
  actions?: Action[]
  children?: React.ReactNode
}

export default function PageHeader({ back, title, count, countLabel, actions, children }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        {back && (
          <Link href={back} className="text-gray-400 hover:text-gray-600 transition">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {count !== undefined && (
          <span className="text-sm text-gray-400 font-normal">
            — {count.toLocaleString()} {countLabel || 'items'}
          </span>
        )}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-2">
          {children}
          {actions?.map((a, i) =>
            a.href ? (
              <Link
                key={i}
                href={a.href}
                className={
                  a.variant === 'primary'
                    ? 'px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-1.5'
                    : 'px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition'
                }
              >
                {a.icon}{a.label}
              </Link>
            ) : (
              <button
                key={i}
                className={
                  a.variant === 'primary'
                    ? 'px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-1.5'
                    : 'px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition'
                }
              >
                {a.icon}{a.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
