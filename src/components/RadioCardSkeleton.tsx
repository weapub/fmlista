import React from 'react'
import { cn } from '@/lib/utils'

interface RadioCardSkeletonProps {
  className?: string
}

export const RadioCardSkeleton: React.FC<RadioCardSkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900',
        className
      )}
    >
      <div className="h-32 w-full bg-slate-100 dark:bg-slate-800" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-4 w-1/4 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="mt-4 h-10 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  )
}
