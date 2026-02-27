'use client'

import { useState, useTransition } from 'react'
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

export function JoinRoomDialog() {
  const [open, setOpen] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [isPending, startTransition] = useTransition()

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
            Enter the room ID to join as a triage volunteer.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="text-sm font-medium">Room ID</label>
          <Input
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
