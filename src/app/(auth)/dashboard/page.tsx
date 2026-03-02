// Dashboard — lista rooms dell'utente
import { getUserRooms } from '@/app/actions/rooms'
import { RoomCard } from '@/components/rooms/RoomCard'
import { CreateRoomDialog } from '@/components/rooms/CreateRoomDialog'
import { JoinRoomDialog } from '@/components/rooms/JoinRoomDialog'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string }>
}) {
  const { join: joinRoomId } = await searchParams
  const rooms = await getUserRooms()

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Triage rooms connected to GitHub repositories
          </p>
        </div>
        <div className="flex gap-2">
          <JoinRoomDialog initialRoomId={joinRoomId} />
          <CreateRoomDialog />
        </div>
      </div>

      {/* Rooms */}
      {rooms.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <svg className="mb-4 h-10 w-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          <p className="text-base font-medium text-muted-foreground">No rooms yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground/70">
            Create a room from your GitHub repository or join an existing one to start triaging.
          </p>
          <div className="mt-6 flex gap-2">
            <JoinRoomDialog />
            <CreateRoomDialog />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  )
}
