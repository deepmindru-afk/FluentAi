'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RoomJoin } from '@/components/livekit/room-join'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService } from '@/lib/services/api'
import { toast } from 'sonner'
import { ChatRoom } from '@/components/livekit/chat-room'
import { useUser } from '@clerk/nextjs'

export default function IndexPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
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
    // Check if user is authenticated
    if (!isLoaded || !user) {
      toast.error('Please sign in to join a chat room')
      router.push('/login')
      return
    }
    
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
    // Check if user is authenticated
    if (!isLoaded || !user) {
      toast.error('Please sign in to join a chat room')
      router.push('/login')
      return
    }
    
    // Use authenticated user's info for username
    const defaultUsername = user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || `user_${user.id.slice(-6)}`
    router.push(`/?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(defaultUsername)}`)
    setCurrentRoom({ roomName, username: defaultUsername })
  }

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="w-full max-w-2xl mx-auto mt-16">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
