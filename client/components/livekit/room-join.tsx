'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/chat'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

interface RoomJoinProps {
  onJoin: (roomName: string, username: string) => void
  prefilledRoom?: string  // Make this optional
  checkUsername?: boolean  // Add flag to enable/disable username checking
  rooms?: any[]
  handleJoinExistingRoom?: (roomName: string) => void
}

export function RoomJoin({ onJoin, prefilledRoom, checkUsername = false, rooms = [], handleJoinExistingRoom = undefined }: RoomJoinProps) {
  const searchParams = useSearchParams()
  const { user } = useUser()
  const roomFromParams = searchParams.get('room') || ''
  const defaultRoom = prefilledRoom || roomFromParams

  const [roomName, setRoomName] = useState(defaultRoom)
  const [username, setUsername] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (user) {
      // Use Clerk user's first name, email, or fallback to a generated username
      const defaultUsername = user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || `user_${user.id.slice(-6)}`
      setUsername(defaultUsername)
    }
  }, [user])

  useEffect(() => {
    if (defaultRoom) {
      setRoomName(defaultRoom)
    }
  }, [defaultRoom])

  const handleJoin = async () => {
    if (!roomName?.trim() || !username.trim()) {
      toast.error('Please enter both room name and username')
      return
    }

    // Validate room name and username
    if (roomName.length < 3) {
      toast.error('Room name must be at least 3 characters long')
      return
    }
    if (username.length < 2) {
      toast.error('Username must be at least 2 characters long')
      return
    }

    // Check for valid characters
    const validPattern = /^[a-zA-Z0-9_-]+$/
    if (!validPattern.test(roomName)) {
      toast.error('Room name can only contain letters, numbers, hyphens, and underscores')
      return
    }
    if (!validPattern.test(username)) {
      toast.error('Username can only contain letters, numbers, hyphens, and underscores')
      return
    }

    setIsJoining(true)
    try {
      // Only check username if the feature is enabled
      if (checkUsername) {
        try {
          // Dynamically import apiService to avoid SSR issues
          const { apiService } = await import('@/lib/services/api')
          console.log('Checking username...', roomName, username)
          const usernameCheck = await apiService.checkUsername(roomName.trim(), username.trim())
          console.log('Username check result:', usernameCheck)

          if (!usernameCheck.success) {
            toast.error('Failed to validate username')
            setIsJoining(false)
            return
          }

          if (!usernameCheck.data?.available) {
            toast.error(usernameCheck.data?.message || 'Username is not available')
            setIsJoining(false)
            return
          }
        } catch (error) {
          console.error("Username check failed, continuing without it:", error)
          // Continue even if username check fails to maintain compatibility
        }
      }

      await onJoin(roomName.trim(), username.trim())
    } catch (error) {
      toast.error('Failed to join room')
      setIsJoining(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin()
    }
  }

  return (
    <div className="flex items-center justify-center p-8 m-auto">
      <Card className="w-full max-w-md p-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Chat Room</CardTitle>
          <CardDescription>
            Enter a room name and your username to start chatting with the AI agent
          </CardDescription>
        </CardHeader>
        {/* <Card className="w-full max-w-md mb-6">
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
                  onClick={() => handleJoinExistingRoom && handleJoinExistingRoom(room.name)}
                >
                  {room.name}
                </Button>
              ))}
            </CardContent>
          </Card> */}
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              type="text"
              placeholder="e.g., general-chat"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isJoining}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="e.g., john_doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isJoining}
            />
          </div>
          <Button
            onClick={handleJoin}
            className="w-full"
            disabled={isJoining || !roomName.trim() || !username.trim()}
          >
            {isJoining ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Joining...
              </>
            ) : (
              'Join Room'
            )}
          </Button>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Room names and usernames must be at least 2-3 characters</p>
            <p>• Only letters, numbers, hyphens, and underscores allowed</p>
            <p>• The AI agent will automatically join your room</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
