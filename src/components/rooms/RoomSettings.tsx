'use client'

// Componente client per gestione settings della room
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { updateRoomLabels, removeMember } from '@/app/actions/rooms'
import { DEFAULT_LABELS } from '@/lib/constants'
import { toast } from 'sonner'
import type { Room } from '@/types/database'

interface RoomMember {
  user_id: string
  role: string
  github_username: string | null
  joined_at: string
}

interface RoomSettingsProps {
  room: Room
  members: RoomMember[]
  currentUserId: string
}

export function RoomSettings({ room, members, currentUserId }: RoomSettingsProps) {
  // Stato labels
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    (room.labels as string[]) || []
  )
  const [customLabel, setCustomLabel] = useState('')
  const [isSavingLabels, startSaveLabels] = useTransition()

  // Stato rimozione membro
  const [isRemoving, startRemove] = useTransition()
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  // Stato copia Room ID
  const [copied, setCopied] = useState(false)

  const isCreator = room.created_by === currentUserId

  // Toggle label attiva/disattiva
  function toggleLabel(label: string) {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  // Aggiungi label custom
  function addCustomLabel() {
    const label = customLabel.trim().toLowerCase()
    if (!label) return
    if (selectedLabels.includes(label)) {
      toast.error('Label already exists')
      return
    }
    setSelectedLabels((prev) => [...prev, label])
    setCustomLabel('')
  }

  // Salva labels su database
  function handleSaveLabels() {
    if (selectedLabels.length === 0) {
      toast.error('At least one label is required')
      return
    }

    startSaveLabels(async () => {
      try {
        await updateRoomLabels(room.id, selectedLabels)
        toast.success('Labels updated')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update labels')
      }
    })
  }

  // Rimuovi membro dalla room
  function handleRemoveMember(userId: string, username: string | null) {
    setRemovingUserId(userId)
    startRemove(async () => {
      try {
        await removeMember(room.id, userId)
        toast.success(`Removed ${username || 'member'} from room`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to remove member')
      } finally {
        setRemovingUserId(null)
      }
    })
  }

  // Copia Room ID negli appunti
  function handleCopyRoomId() {
    navigator.clipboard.writeText(room.id)
    setCopied(true)
    toast.success('Room ID copied')
    setTimeout(() => setCopied(false), 2000)
  }

  // Controlla se le label sono state modificate rispetto allo stato salvato
  const labelsChanged =
    JSON.stringify([...selectedLabels].sort()) !==
    JSON.stringify([...((room.labels as string[]) || [])].sort())

  return (
    <div className="max-w-2xl space-y-8">
      {/* === Sezione Labels === */}
      <section>
        <h2 className="text-base font-semibold">Labels</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Labels available for triagers when categorizing issues
        </p>

        {/* Labels default — toggle */}
        <div className="mb-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Default labels</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_LABELS.map((label) => (
              <Badge
                key={label}
                variant={selectedLabels.includes(label) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => toggleLabel(label)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Labels custom aggiunte dall'utente */}
        {selectedLabels.filter((l) => !DEFAULT_LABELS.includes(l)).length > 0 && (
          <div className="mb-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Custom labels</p>
            <div className="flex flex-wrap gap-2">
              {selectedLabels
                .filter((l) => !DEFAULT_LABELS.includes(l))
                .map((label) => (
                  <Badge
                    key={label}
                    variant="default"
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleLabel(label)}
                  >
                    {label}
                    <svg
                      aria-hidden="true"
                      className="ml-1 h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Input per aggiungere label custom */}
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Add custom label..."
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomLabel()
              }
            }}
            className="max-w-xs"
          />
          <Button variant="outline" size="sm" onClick={addCustomLabel} disabled={!customLabel.trim()}>
            Add
          </Button>
        </div>

        {/* Pulsante salva — visibile solo se ci sono modifiche */}
        {labelsChanged && (
          <Button
            onClick={handleSaveLabels}
            disabled={isSavingLabels}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary-hover"
            size="sm"
          >
            {isSavingLabels ? 'Saving...' : 'Save Labels'}
          </Button>
        )}
      </section>

      <Separator />

      {/* === Sezione Members === */}
      <section>
        <h2 className="text-base font-semibold">Members</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {members.length} member{members.length !== 1 ? 's' : ''} in this room
        </p>

        <div className="space-y-2">
          {members.map((m) => {
            const isSelf = m.user_id === currentUserId
            const isMemberCreator = m.user_id === room.created_by

            return (
              <div
                key={m.user_id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder con iniziale */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-foreground">
                    {(m.github_username || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {m.github_username || 'Unknown'}
                      {isSelf && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(m.joined_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Badge ruolo */}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      m.role === 'maintainer'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {m.role}
                  </span>

                  {/* Pulsante rimuovi — solo il creatore puo' rimuovere, non se stesso */}
                  {isCreator && !isSelf && !isMemberCreator && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          disabled={isRemoving && removingUserId === m.user_id}
                        >
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                            />
                          </svg>
                          <span className="sr-only">Remove {m.github_username || 'member'}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove member?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove <strong>{m.github_username || 'this member'}</strong> from
                            the room. They will lose access to all issues and proposals.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveMember(m.user_id, m.github_username)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <Separator />

      {/* === Sezione Room Info === */}
      <section>
        <h2 className="text-base font-semibold">Room Info</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          General information about this room
        </p>

        <div className="space-y-3">
          {/* Room ID copiabile */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Room ID</p>
            <div className="flex items-center gap-2">
              <code className="rounded-md bg-card border border-border px-3 py-1.5 text-xs text-muted-foreground break-all leading-relaxed">
                {room.id}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 shrink-0 p-0"
                onClick={handleCopyRoomId}
              >
                {copied ? (
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                    />
                  </svg>
                )}
                <span className="sr-only">Copy Room ID</span>
              </Button>
            </div>
          </div>

          {/* Repository */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Repository</p>
            <a
              href={`https://github.com/${room.repo_owner}/${room.repo_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              {room.repo_owner}/{room.repo_name}
              <svg
                aria-hidden="true"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          </div>

          {/* Data creazione */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Created</p>
            <p className="text-sm">
              {new Date(room.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
