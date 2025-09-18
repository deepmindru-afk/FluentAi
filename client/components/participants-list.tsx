'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService } from '@/lib/services/api'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, UserMinus, User } from 'lucide-react'

interface Participant {
  identity: string
  sid: string
  name?: string
  metadata?: string
}

interface ParticipantsListProps {
  roomName: string
}

export default function ParticipantsList({ roomName }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [removingParticipant, setRemovingParticipant] = useState<string | null>(null)

  useEffect(() => {
    fetchParticipants()
  }, [roomName])

  const fetchParticipants = async () => {
    try {
      setLoading(true)
      const result = await apiService.listParticipants(roomName)
      if (result.success && result.data?.participants) {
        setParticipants(result.data.participants)
      } else {
        toast.error(result.error || 'Failed to fetch participants')
      }
    } catch (error) {
      toast.error('An error occurred while fetching participants')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveParticipant = async (identity: string) => {
    if (!confirm(`Are you sure you want to remove participant "${identity}"?`)) {
      return
    }

    try {
      setRemovingParticipant(identity)
      const result = await apiService.removeParticipant(roomName, identity)
      if (result.success) {
        toast.success('Participant removed successfully')
        fetchParticipants() // Refresh the list
      } else {
        toast.error(result.error || 'Failed to remove participant')
      }
    } catch (error) {
      toast.error('An error occurred while removing the participant')
    } finally {
      setRemovingParticipant(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/rooms">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rooms
          </Button>
        </Link>
        <Link href={`/chat?room=${encodeURIComponent(roomName)}`}>
          <Button size="sm">
            Join Room
          </Button>
        </Link>
      </div>

      {participants.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No participants</h3>
            <p className="text-muted-foreground">
              This room currently has no active participants.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Participants ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.sid}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                      {participant.identity.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{participant.identity}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {participant.sid}
                      </div>
                      {participant.metadata && (
                        <div className="text-xs text-muted-foreground">
                          {participant.metadata}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveParticipant(participant.identity)}
                    disabled={removingParticipant === participant.identity}
                    className="text-red-600 hover:text-red-700"
                  >
                    {removingParticipant === participant.identity ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <>
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
