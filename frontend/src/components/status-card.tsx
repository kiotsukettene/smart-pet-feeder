import type { ReactNode } from "react"

interface StatusCardProps {
  icon: ReactNode
  title: string
  value: string | ReactNode
  subtitle?: string
  className?: string
}

export function StatusCard({ icon, title, value, subtitle, className }: StatusCardProps) {
  return (
    <div className={`bg-white p-6 rounded-lg ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
          <div className="mt-1">
            {typeof value === "string" ? <p className="text-5xl mt-5 font-bold text-gray-800">{value}</p> : value}
          </div>
          {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

