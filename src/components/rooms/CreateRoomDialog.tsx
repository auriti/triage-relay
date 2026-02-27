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
import { Badge } from '@/components/ui/badge'
import { createRoom } from '@/app/actions/rooms'
import { toast } from 'sonner'
import { DEFAULT_LABELS } from '@/lib/constants'

export function CreateRoomDialog() {
  const [open, setOpen] = useState(false)
  const [repo, setRepo] = useState('')
  const [selectedLabels, setSelectedLabels] = useState<string[]>(DEFAULT_LABELS)
  const [isPending, startTransition] = useTransition()

  function toggleLabel(label: string) {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  function handleSubmit() {
    if (!repo.includes('/')) {
      toast.error('Use the format owner/repo (e.g. facebook/react)')
      return
    }

    startTransition(async () => {
      try {
        await createRoom(repo, selectedLabels)
        toast.success('Room created!')
        setOpen(false)
        setRepo('')
        setSelectedLabels(DEFAULT_LABELS)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create room')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary-hover">
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Triage Room</DialogTitle>
          <DialogDescription>
            Connect a GitHub repository to start triaging its issues collaboratively.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Repository</label>
            <Input
              placeholder="owner/repo (e.g. facebook/react)"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Labels</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEFAULT_LABELS.map((label) => (
                <Badge
                  key={label}
                  variant={selectedLabels.includes(label) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleLabel(label)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !repo}
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            {isPending ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
