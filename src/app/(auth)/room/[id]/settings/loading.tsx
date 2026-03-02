import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="p-6">
      {/* Header */}
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-72" />

      <div className="mt-8 max-w-2xl space-y-8">
        {/* Sezione Labels */}
        <div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="mt-2 h-4 w-64" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Separatore */}
        <Skeleton className="h-px w-full" />

        {/* Sezione Members */}
        <div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-2 h-4 w-48" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* Separatore */}
        <Skeleton className="h-px w-full" />

        {/* Sezione Room Info */}
        <div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-2 h-4 w-56" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      </div>
    </div>
  )
}
