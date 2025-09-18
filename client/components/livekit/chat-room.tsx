'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { LiveKitRoom, useChat } from '@livekit/components-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService } from '@/lib/services/api'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { ArrowDown, Send } from 'lucide-react'
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

  const effectiveUsername = user?.id || username

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        setIsConnecting(true)
        
        // Join room and get AI greeting
        const joinResult = await apiService.joinRoom(roomName, effectiveUsername)
        if (!joinResult.success) {
          console.log('Failed to join room:', joinResult.error)
        } else if (joinResult.data?.greeting) {
          // Show AI greeting as a toast
          toast.success(joinResult.data.greeting)
        }

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
      <Card className="w-full max-w-2xl place-items-center h-full mx-auto py-16 md:py-[15%]">
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
      <Card className="w-full max-w-2xl mx-auto mt-16">
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
      <Card className="w-full max-w-2xl mx-auto mt-16">
        <CardContent className="flex items-center justify-center p-8">
          <p>No token available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full md:max-w-2xl mx-auto">
      <LiveKitRoom
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
        token={token}
        connect={true}
        video={false}
        audio={false}
      >
        <ChatRoomContent
          roomName={roomName}
          username={effectiveUsername}
          displayName={username}
          onLeave={onLeave}
        />
      </LiveKitRoom>
    </div>
  )
}

function ChatRoomContent({ roomName, username, displayName, onLeave }: {
  roomName: string,
  username: string,
  displayName: string,
  onLeave: () => void
}) {
  const { send, chatMessages, isSending } = useChat()
  const [message, setMessage] = useState('')
  const [isSendingApi, setIsSendingApi] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle message sending
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

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Auto-scroll and scroll button visibility
  const checkScrollPosition = useCallback(() => {
    if (!messagesContainerRef.current) return false
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10
    // setShowScrollButton(!isAtBottom)
    return isAtBottom
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollButton(false)
  }, [])

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const wasAtBottom = checkScrollPosition()
    if (wasAtBottom) {
      scrollToBottom()
    }
  }, [chatMessages, checkScrollPosition, scrollToBottom])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  // Handle manual scroll events
  const handleScroll = useCallback(() => {
    checkScrollPosition()
  }, [checkScrollPosition])

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border">
      {/* Room header */}
      <div className="p-4 border-b flex justify-between items-center bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-semibold">Room: {roomName}</h2>
          <p className="text-sm text-muted-foreground">Logged in as: {displayName}</p>
        </div>
        <Button onClick={onLeave} variant="outline" size="sm">
          Leave Room
        </Button>
      </div>

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory p-4 space-y-4 scrollbar-thin min-h-[calc(100vh-16rem)] md:min-h-[calc(100vh-14rem)]"
        onScroll={handleScroll}
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full overflow-auto">
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
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
                  className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[85%]`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isCurrentUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    }`}
                  >
                    {isCurrentUser ? displayName?.charAt(0).toUpperCase() : 'AI'}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 z-20 p-2 rounded-full bg-accent hover:bg-accent/80 transition-colors"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}

      {/* Input area - fixed at bottom */}
      <div className="border-t p-3 bg-background/95 backdrop-blur-sm">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={isSending || isSendingApi}
            className="flex-1 min-h-[48px] max-h-[150px] resize-none pr-12 w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-ring"
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending || isSendingApi}
            className="absolute right-2 bottom-2 h-8 w-8 p-0"
            size="icon"
            type="submit"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
