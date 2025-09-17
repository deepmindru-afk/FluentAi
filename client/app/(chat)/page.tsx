'use client'

import { useState } from 'react'
import { RoomJoin } from '@/components/livekit/room-join'
import { ChatRoom } from '@/components/livekit/chat-room'

export default function IndexPage() {
  const [currentRoom, setCurrentRoom] = useState<{
    roomName: string
    username: string
  } | null>(null)

  const handleJoinRoom = (roomName: string, username: string) => {
    setCurrentRoom({ roomName, username })
  }

  const handleLeaveRoom = () => {
    setCurrentRoom(null)
  }

  if (currentRoom) {
    return (
        <ChatRoom
          roomName={currentRoom.roomName}
          username={currentRoom.username}
          onLeave={handleLeaveRoom}
        />
    )
  }

  return <RoomJoin onJoin={handleJoinRoom} />
}
