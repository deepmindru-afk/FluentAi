'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService, RoomInfo } from '@/lib/services/api'
import { toast } from 'sonner'
import Link from 'next/link'
import { Trash2, Users, MessageCircle, Plus, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Room {
  name: string
  sid: string
  num_participants: number
  creation_time: number
  max_participants: number
}

export default function RoomManagement() {
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingRoom, setDeletingRoom] = useState<string | null>(null)
  const [newRoomName, setNewRoomName] = useState('')
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const result = await apiService.listRooms()
      if (result.success && result.data?.rooms) {
        setRooms(result.data.rooms)
      } else {
        toast.error(result.error || 'Failed to fetch rooms')
      }
    } catch (error) {
      toast.error('An error occurred while fetching rooms')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error('Please enter a room name')
      return
    }

    // Validate room name
    const validPattern = /^[a-zA-Z0-9_-]+$/
    if (!validPattern.test(newRoomName)) {
      toast.error('Room name can only contain letters, numbers, hyphens, and underscores')
      return
    }

    if (newRoomName.length < 3) {
      toast.error('Room name must be at least 3 characters long')
      return
    }

    try {
      setCreatingRoom(true)
      const result = await apiService.createRoom(newRoomName.trim())
      if (result.success) {
        toast.success('Room created successfully')
        setNewRoomName('')
        setIsDialogOpen(false)
        fetchRooms() // Refresh the list
      } else {
        toast.error(result.error || 'Failed to create room')
      }
    } catch (error) {
      toast.error('An error occurred while creating the room')
    } finally {
      setCreatingRoom(false)
    }
  }

  const handleDeleteRoom = async (roomName: string) => {
    if (!confirm(`Are you sure you want to delete room "${roomName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingRoom(roomName)
      const result = await apiService.deleteRoom(roomName)
      if (result.success) {
        toast.success('Room deleted successfully')
        fetchRooms() // Refresh the list
      } else {
        toast.error(result.error || 'Failed to delete room')
      }
    } catch (error) {
      toast.error('An error occurred while deleting the room')
    } finally {
      setDeletingRoom(null)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Room Management</h2>
          <p className="text-muted-foreground">Total rooms: {rooms.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRooms} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
                <DialogDescription>
                  Enter a name for your new chat room. Room names must be unique.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    placeholder="e.g., general-chat"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                  />
                  <p className="text-sm text-muted-foreground">
                    Only letters, numbers, hyphens, and underscores allowed
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateRoom} 
                  disabled={creatingRoom || !newRoomName.trim()}
                >
                  {creatingRoom ? 'Creating...' : 'Create Room'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Rooms grid */}
      {rooms.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first chat room to get started.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.sid} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {room.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Participants: {room.num_participants}/{room.max_participants}</div>
                  <div>Created: {formatDate(room.creation_time || 0)}</div>
                  <div className="truncate">ID: {room.sid}</div>
                </div>
                
                <div className="flex gap-2">
                  <Link 
                    href={`/chat?room=${encodeURIComponent(room.name)}`} 
                    className="flex-1"
                  >
                    <Button className="w-full" size="sm">
                      Join Room
                    </Button>
                  </Link>
                  
                  <Link href={`/participants?room=${encodeURIComponent(room.name)}`}>
                    <Button variant="outline" size="sm" title="View Participants">
                      <Users className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRoom(room.name)}
                    disabled={deletingRoom === room.name}
                    className="text-red-600 hover:text-red-700"
                    title="Delete Room"
                  >
                    {deletingRoom === room.name ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
