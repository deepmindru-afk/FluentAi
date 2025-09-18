// Simple in-memory storage for now - replace with actual Supabase when ready
// To use Supabase: npm install @supabase/supabase-js
// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface ChatRoom {
  id: string
  name: string
  created_at: string
  created_by: string
  last_activity: string
}

export interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  username: string
  message: string
  message_type: 'user' | 'ai'
  created_at: string
}

export interface RoomParticipant {
  id: string
  room_id: string
  user_id: string
  username: string
  joined_at: string
  last_seen: string
}

// Mock database operations for now - replace with actual Supabase implementation
let mockRooms: ChatRoom[] = []
let mockMessages: ChatMessage[] = []
let mockParticipants: RoomParticipant[] = []

export const dbOperations = {
  // Room operations
  async createRoom(name: string, createdBy: string): Promise<ChatRoom> {
    const room: ChatRoom = {
      id: `room_${Date.now()}`,
      name,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    }
    mockRooms.push(room)
    return room
  },

  async getRooms(): Promise<ChatRoom[]> {
    return [...mockRooms].sort((a, b) => 
      new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
    )
  },

  async updateRoomActivity(roomId: string): Promise<void> {
    const room = mockRooms.find(r => r.id === roomId)
    if (room) {
      room.last_activity = new Date().toISOString()
    }
  },

  // Message operations
  async saveMessage(roomId: string, userId: string, username: string, message: string, messageType: 'user' | 'ai'): Promise<ChatMessage> {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      room_id: roomId,
      user_id: userId,
      username,
      message,
      message_type: messageType,
      created_at: new Date().toISOString()
    }
    mockMessages.push(msg)
    await this.updateRoomActivity(roomId)
    return msg
  },

  async getRoomMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
    return mockMessages
      .filter(m => m.room_id === roomId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-limit)
  },

  // Participant operations
  async addParticipant(roomId: string, userId: string, username: string): Promise<RoomParticipant> {
    const existing = mockParticipants.find(p => p.room_id === roomId && p.user_id === userId)
    if (existing) {
      existing.last_seen = new Date().toISOString()
      return existing
    }
    
    const participant: RoomParticipant = {
      id: `participant_${Date.now()}`,
      room_id: roomId,
      user_id: userId,
      username,
      joined_at: new Date().toISOString(),
      last_seen: new Date().toISOString()
    }
    mockParticipants.push(participant)
    return participant
  },

  async updateParticipantActivity(roomId: string, userId: string): Promise<void> {
    const participant = mockParticipants.find(p => p.room_id === roomId && p.user_id === userId)
    if (participant) {
      participant.last_seen = new Date().toISOString()
    }
  },

  async getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    return mockParticipants
      .filter(p => p.room_id === roomId)
      .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())
  }
}
