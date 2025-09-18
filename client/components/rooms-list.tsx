'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService } from '@/lib/services/api'
import { toast } from 'sonner'
import Link from 'next/link'
import { Trash2, Users, MessageCircle } from 'lucide-react'

interface Room {
  name: string
  sid: string
}

export default function RoomsList() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingRoom, setDeletingRoom] = useState<string | null>(null)

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

  const handleDeleteRoom = async (roomName: string) => {
    if (!confirm(`Are you sure you want to delete room "${roomName}"?`)) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No active rooms</h3>
          <p className="text-muted-foreground mb-4">
            There are no active chat rooms at the moment.
          </p>
          <Link href="/new">
            <Button>Create New Room</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Active Rooms ({rooms.length})</h2>
        <Link href="/new">
          <Button>Create New Room</Button>
        </Link>
      </div>
      
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
              <div className="text-sm text-muted-foreground">
                Room ID: {room.sid}
              </div>
              
              <div className="flex gap-2">
                <Link href={`/new?room=${encodeURIComponent(room.name)}`} className="flex-1">
                  <Button className="w-full" size="sm">
                    Join Room
                  </Button>
                </Link>
                
                <Link href={`/rooms/${encodeURIComponent(room.name)}/participants`}>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4" />
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteRoom(room.name)}
                  disabled={deletingRoom === room.name}
                  className="text-red-600 hover:text-red-700"
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
    </div>
  )
}
