'use client'

import { useState, useEffect } from 'react'
import { LiveKitRoom, useChat } from '@livekit/components-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/chat'
import { apiService } from '@/lib/services/api'
import { toast } from 'sonner'

interface ChatRoomProps {
  roomName: string
  username: string
  onLeave: () => void
}

export function ChatRoom({ roomName, username, onLeave }: ChatRoomProps) {
  const [token, setToken] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        setIsConnecting(true)
        
        // Create room if it doesn't exist
        const createResult = await apiService.createRoom(roomName)
        if (!createResult.success) {
          console.log('Room might already exist:', createResult.error)
        }

        // Get token for user
        const tokenResult = await apiService.getToken(roomName, username)
        if (!tokenResult.success) {
          throw new Error(tokenResult.error || 'Failed to get token')
        }

        setToken(tokenResult.data!.token)
        setError('')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize room'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsConnecting(false)
      }
    }

    initializeRoom()
  }, [roomName, username])

  if (isConnecting) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Connecting to room...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Connection Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onLeave} variant="outline">
            Back to Join
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!token) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <p>No token available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className=" h-screen flex flex-col w-full max-w-2xl m-auto">
      <div className="bg-background border-b p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Room: {roomName}</h2>
          <p className="text-sm text-muted-foreground">Logged in as: {username}</p>
        </div>
        <Button onClick={onLeave} variant="outline">
          Leave Room
        </Button>
      </div>
      
      <div className="flex-1">
        <LiveKitRoom
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
          token={token}
          connect={true}
          video={false}
          audio={false}
        >
          <ChatInterface roomName={roomName} username={username} />
        </LiveKitRoom>
      </div>
    </div>
  )
}

function ChatInterface({ roomName, username }: { roomName: string, username: string }) {
  const { send, chatMessages, isSending } = useChat()
  const [message, setMessage] = useState('')
  const [isSendingApi, setIsSendingApi] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return
    
    const userMessage = message.trim()
    setMessage('')

    // Send user message to LiveKit
    await send(userMessage)

    // Send message to backend and get AI response
    setIsSendingApi(true)
    try {
      const result = await apiService.sendMessage(roomName, username, userMessage)

      if (result.success && result.data?.response) {
        // Send AI response to LiveKit room
        await send(result.data.response);

      } else {
        toast.error(result.error || 'Failed to get AI response')
      }
    } catch (error) {
      toast.error('An error occurred while sending the message')
    } finally {
      setIsSendingApi(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 h-full space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-center max-w-2xl m-auto min-h-[54vh] text-muted-foreground py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.from?.identity === 'ai-agent' ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.from?.identity === 'ai-agent'
                    ? 'bg-muted text-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                <div className="text-xs opacity-70 mb-1">
                  {msg.from?.identity === 'ai-agent' ? 'AI Agent' : msg.from?.identity}
                </div>
                <div>{msg.message}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isSending || isSendingApi}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim() || isSending || isSendingApi}
          >
            {isSending || isSendingApi ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
