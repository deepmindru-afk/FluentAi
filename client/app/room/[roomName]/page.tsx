'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ChatRoom } from '@/components/livekit/chat-room'
import { RoomJoin } from '@/components/livekit/room-join'
import { useUser } from '@clerk/nextjs'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  
  const roomName = params.roomName as string
  const prefilledUsername = searchParams.get('username')
  
  const [currentRoom, setCurrentRoom] = useState<{
    roomName: string
    username: string
  } | null>(null)

  useEffect(() => {
    // If we have a room name and username, auto-join
    if (roomName && prefilledUsername) {
      setCurrentRoom({ roomName, username: prefilledUsername })
    } else if (roomName && user) {
      // Use Clerk user's info as default username
      const defaultUsername = user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || `user_${user.id.slice(-6)}`
      setCurrentRoom({ roomName, username: defaultUsername })
    }
  }, [roomName, prefilledUsername, user])

  const handleJoinRoom = (roomName: string, username: string) => {
    setCurrentRoom({ roomName, username })
    // Update URL to include username
    router.replace(`/room/${roomName}?username=${username}`)
  }

  const handleLeaveRoom = () => {
    setCurrentRoom(null)
    router.push('/')
  }

  // if (currentRoom) {
  //   return (
  //     <ChatRoom
  //       roomName={currentRoom.roomName}
  //       username={currentRoom.username}
  //       onLeave={handleLeaveRoom}
  //     />
  //   )
  // }

  // Show join form if no username is provided
  return (
    <RoomJoin 
      onJoin={handleJoinRoom}
      prefilledRoom={roomName}
      checkUsername
    />
  )
}
