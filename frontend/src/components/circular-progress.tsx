"use client"

import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
  label?: string
  showLabel?: boolean
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  color = "#FFD700", // Gold color
  className,
  label,
  showLabel = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = value / 100
  const dashoffset = circumference * (1 - progress)

  const center = size / 2

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#E5E7EB" strokeWidth={strokeWidth} />

        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />

        {/* Percentage text */}
        {showLabel && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="1.5rem"
            fontWeight="bold"
            fill="currentColor"
          >
            {`${Math.round(value)}%`}
          </text>
        )}
      </svg>
      {label && <div className="mt-2 text-sm text-center">{label}</div>}
    </div>
  )
}

