'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RoomJoin } from '@/components/livekit/room-join'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService } from '@/lib/services/api'
import { toast } from 'sonner'
import { ChatRoom } from '@/components/livekit/chat-room'

export default function IndexPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rooms, setRooms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentRoom, setCurrentRoom] = useState<{
    roomName: string
    username: string
  } | null>(null)

  // Check for room and username in URL params
  useEffect(() => {
    const roomName = searchParams.get('room')
    const username = searchParams.get('username')

    if (roomName && username) {
      setCurrentRoom({ roomName, username })
    }
  }, [searchParams])

  // Load available rooms
  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      const result = await apiService.listRooms()
      if (result.success && result.data) {
        setRooms(result.data.rooms || [])
      }
    } catch (error) {
      toast.error('Failed to load rooms: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = (roomName: string, username: string) => {
    // Update URL with room and username params
    router.push(`/?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(username)}`)
    setCurrentRoom({ roomName, username })
  }

  const handleLeaveRoom = () => {
    // Remove room and username from URL
    router.push('/')
    setCurrentRoom(null)
  }

  const handleJoinExistingRoom = (roomName: string) => {
    // For existing rooms, we might want to use a default username
    const defaultUsername = 'guest_' + Math.floor(Math.random() * 1000)
    router.push(`/?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(defaultUsername)}`)
    setCurrentRoom({ roomName, username: defaultUsername })
  }

  // If we have a current room, show the chat room
  if (currentRoom) {
    return (
      <ChatRoom
        roomName={currentRoom.roomName}
        username={currentRoom.username}
        onLeave={handleLeaveRoom}
      />
    )
  }

  // If we have rooms and want to auto-join the first one (like in your new code)
  // if (rooms.length > 0 && !currentRoom) {
  //   handleJoinExistingRoom(rooms[0].name)
  // }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {rooms.length > 0 && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Rooms</CardTitle>
              <CardDescription>Join an existing room or create a new one</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Button
                  key={room.name}
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleJoinExistingRoom(room.name)}
                >
                  {room.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <RoomJoin onJoin={handleJoinRoom} checkUsername={true} />
    </div>
  )
}
