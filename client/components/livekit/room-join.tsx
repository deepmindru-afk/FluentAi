'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/chat'
import { toast } from 'sonner'

interface RoomJoinProps {
  onJoin: (roomName: string, username: string) => void
}

export function RoomJoin({ onJoin }: RoomJoinProps) {
  const [roomName, setRoomName] = useState('')
  const [username, setUsername] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleJoin = async () => {
    if (!roomName.trim() || !username.trim()) {
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 m-auto">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Chat Room</CardTitle>
          <CardDescription>
            Enter a room name and your username to start chatting with the AI agent
          </CardDescription>
        </CardHeader>
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
