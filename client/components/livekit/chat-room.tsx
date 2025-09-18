'use client'

import { useState, useEffect, useRef } from 'react'
import { LiveKitRoom, useChat } from '@livekit/components-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/chat'
import { apiService } from '@/lib/services/api'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { ArrowDown } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

interface ChatRoomProps {
  roomName: string
  username: string
  onLeave: () => void
}

export function ChatRoom({ roomName, username, onLeave }: ChatRoomProps) {
  const { user } = useUser()
  const [token, setToken] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(true)
  const [error, setError] = useState<string>('')
  
  // Use Clerk user ID for backend integration
  const effectiveUsername = user?.id || username

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        setIsConnecting(true)
        
        // Create room if it doesn't exist
        const createResult = await apiService.createRoom(roomName)
        if (!createResult.success) {
          console.log('Room might already exist:', createResult.error)
        }

        // Get token for user (use Clerk user ID if available)
        const tokenResult = await apiService.getToken(roomName, effectiveUsername)
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
    <div className=" h-screen flex flex-col w-full md:max-w-2xl m-auto space-y-[20%]">
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
          <ChatInterface roomName={roomName} username={effectiveUsername} displayName={username} />
        </LiveKitRoom>
      </div>
    </div>
  )
}

function ChatInterface({ roomName, username, displayName }: { roomName: string, username: string, displayName?: string }) {
  const { send, chatMessages, isSending } = useChat()
  const [message, setMessage] = useState('')
  const [isSendingApi, setIsSendingApi] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return

    const userMessage = message.trim()
    setMessage('')

    await send(userMessage)

    setIsSendingApi(true)
    try {
      const chatMessagesForAPI = chatMessages.map(msg => ({
        role: msg.from?.identity === username ? 'user' : 'assistant',
        content: msg.message,
      }))
      const result = await apiService.sendMessage(roomName, username, userMessage, chatMessagesForAPI)
      if (result.success && result.data?.response) {
        await send(`[AI]: ${result.data.response}`)
      } else {
        toast.error(result.error || 'Failed to get AI response')
      }
    } catch {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages scrollable area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 space-y-[50%]"
      >
        {chatMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isAIMessage = msg.message.startsWith('[AI]:') || msg.from?.identity === 'system'
            const isCurrentUser = msg.from?.identity === username && !isAIMessage
            const displayMessage = isAIMessage ? msg.message.replace('[AI]:', '').trim() : msg.message

            return (
              <div
                key={index}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isCurrentUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    }`}
                  >
                    {isCurrentUser ? msg.from?.identity?.charAt(0).toUpperCase() : 'AI'}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-2xl shadow-sm ${
                      isCurrentUser
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-md border'
                    }`}
                  >
                    <div
                      className={`text-xs font-medium mb-1 ${
                        isCurrentUser ? 'text-blue-100 text-right' : 'text-muted-foreground'
                      }`}
                    >
                      {isCurrentUser ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {displayMessage}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-muted-foreground text-right'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} className="mb-[10px]" />
      </div>

      {/* Bottom input bar (fixed at bottom) */}
      <div className="border-t p-4 bg-background shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={isSending || isSendingApi}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending || isSendingApi}
            className="self-end"
          >
            {isSending || isSendingApi ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}

