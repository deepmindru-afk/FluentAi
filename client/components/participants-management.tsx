'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService } from '@/lib/services/api'
import { toast } from 'sonner'
import { UserX, Users, RefreshCw, ArrowRight, Crown } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSearchParams } from 'next/navigation'

interface Participant {
  identity: string
  name: string
  sid: string
  metadata: string
  joined_at: number
  permission: {
    can_publish: boolean
    can_subscribe: boolean
    can_publish_data: boolean
  }
}

interface Room {
  name: string
  sid: string
}

export default function ParticipantsManagement() {
  const searchParams = useSearchParams()
  const initialRoom = searchParams.get('room') || ''
  
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState(initialRoom)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [removingParticipant, setRemovingParticipant] = useState<string | null>(null)
  const [movingParticipant, setMovingParticipant] = useState<string | null>(null)
  const [moveToRoom, setMoveToRoom] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    if (selectedRoom) {
      fetchParticipants(selectedRoom)
    }
  }, [selectedRoom])

  const fetchRooms = async () => {
    try {
      const result = await apiService.listRooms()
      if (result.success && result.data?.rooms) {
        setRooms(result.data.rooms)
      } else {
        toast.error(result.error || 'Failed to fetch rooms')
      }
    } catch (error) {
      toast.error('An error occurred while fetching rooms')
    }
  }

  const fetchParticipants = async (roomName: string) => {
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

  const handleRemoveParticipant = async (participantIdentity: string) => {
    if (!selectedRoom) return
    
    if (!confirm(`Are you sure you want to remove participant "${participantIdentity}" from the room?`)) {
      return
    }

    try {
      setRemovingParticipant(participantIdentity)
      const result = await apiService.removeParticipant(selectedRoom, participantIdentity)
      if (result.success) {
        toast.success('Participant removed successfully')
        fetchParticipants(selectedRoom)
      } else {
        toast.error(result.error || 'Failed to remove participant')
      }
    } catch (error) {
      toast.error('An error occurred while removing the participant')
    } finally {
      setRemovingParticipant(null)
    }
  }

  const handleMoveParticipant = async (participantIdentity: string) => {
    if (!selectedRoom || !moveToRoom) return

    try {
      setMovingParticipant(participantIdentity)
      const result = await apiService.moveParticipant(selectedRoom, participantIdentity, moveToRoom)
      if (result.success) {
        toast.success(`Participant moved to ${moveToRoom} successfully`)
        setIsDialogOpen(false)
        setMoveToRoom('')
        fetchParticipants(selectedRoom)
      } else {
        toast.error(result.error || 'Failed to move participant')
      }
    } catch (error) {
      toast.error('An error occurred while moving the participant')
    } finally {
      setMovingParticipant(null)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getPermissionBadge = (permission: Participant['permission']) => {
    const permissions = []
    if (permission.can_publish) permissions.push('Publish')
    if (permission.can_subscribe) permissions.push('Subscribe')
    if (permission.can_publish_data) permissions.push('Data')
    return permissions.join(', ') || 'None'
  }

  return (
    <div className="space-y-6">
      {/* Room Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Room
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="room-select">Choose a room to view participants</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger id="room-select">
                  <SelectValue placeholder="Select a room..." />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.sid} value={room.name}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={() => selectedRoom && fetchParticipants(selectedRoom)}
              disabled={!selectedRoom || loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Participants List */}
      {selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Participants in &quot;{selectedRoom}&quot;</span>
              <span className="text-sm font-normal text-muted-foreground">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center p-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No participants</h3>
                <p className="text-muted-foreground">
                  This room currently has no active participants.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div
                    key={participant.sid}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                          {participant.identity.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold">{participant.identity}</h4>
                          <p className="text-sm text-muted-foreground">
                            Joined: {formatDate(participant.joined_at)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Permissions: </span>
                        <span className="font-medium">{getPermissionBadge(participant.permission)}</span>
                      </div>
                      {participant.metadata && (
                        <div className="mt-1 text-sm">
                          <span className="text-muted-foreground">Metadata: </span>
                          <span className="font-mono text-xs">{participant.metadata}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog open={isDialogOpen && movingParticipant === participant.identity} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) {
                          setMovingParticipant(null)
                          setMoveToRoom('')
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMovingParticipant(participant.identity)
                              setIsDialogOpen(true)
                            }}
                            title="Move to another room"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Move Participant</DialogTitle>
                            <DialogDescription>
                              Move &quot;{participant.identity}&quot; to another room.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="destination-room">Destination Room</Label>
                              <Select value={moveToRoom} onValueChange={setMoveToRoom}>
                                <SelectTrigger id="destination-room">
                                  <SelectValue placeholder="Select destination room..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {rooms
                                    .filter(room => room.name !== selectedRoom)
                                    .map((room) => (
                                      <SelectItem key={room.sid} value={room.name}>
                                        {room.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsDialogOpen(false)
                                setMovingParticipant(null)
                                setMoveToRoom('')
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleMoveParticipant(participant.identity)}
                              disabled={!moveToRoom || movingParticipant === participant.identity}
                            >
                              {movingParticipant === participant.identity ? 'Moving...' : 'Move Participant'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant.identity)}
                        disabled={removingParticipant === participant.identity}
                        className="text-red-600 hover:text-red-700"
                        title="Remove from room"
                      >
                        {removingParticipant === participant.identity ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <UserX className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
