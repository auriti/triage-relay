'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { joinRoom } from '@/app/actions/rooms'
import { toast } from 'sonner'

interface JoinRoomDialogProps {
  initialRoomId?: string
}

export function JoinRoomDialog({ initialRoomId }: JoinRoomDialogProps) {
  const [open, setOpen] = useState(false)
  const [roomId, setRoomId] = useState(initialRoomId || '')
  const [isPending, startTransition] = useTransition()

  // Apri automaticamente se c'è un initialRoomId
  useEffect(() => {
    if (initialRoomId) {
      setRoomId(initialRoomId)
      setOpen(true)
    }
  }, [initialRoomId])

  function handleSubmit() {
    if (!roomId.trim()) return

    startTransition(async () => {
      try {
        await joinRoom(roomId.trim())
        toast.success('Joined room!')
        setOpen(false)
        setRoomId('')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to join room')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Join Room</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Triage Room</DialogTitle>
          <DialogDescription>
            Enter the room ID or use an invite link to join as a triage volunteer.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="join-room-id" className="text-sm font-medium">Room ID</label>
          <Input
            id="join-room-id"
            placeholder="Paste the room ID here"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="mt-1"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !roomId.trim()}
          >
            {isPending ? 'Joining...' : 'Join Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
