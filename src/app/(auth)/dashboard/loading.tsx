import { Skeleton } from '@/components/ui/skeleton'

// Schermata di caricamento mostrata da Next.js durante il fetch della dashboard
export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Intestazione con titolo e pulsanti azione */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      {/* Griglia di card skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
