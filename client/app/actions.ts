'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

import { type Chat } from '@/lib/types'
import { dbOperations, type ChatRoom } from '@/lib/supabase'

export async function getChats(userId?: string): Promise<Chat[]> {
  if (!userId) {
    return []
  }

  try {
    // Get rooms where user has participated
    const rooms = await dbOperations.getRooms()
    
    // Convert rooms to Chat format for compatibility
    const chats: Chat[] = rooms.map((room: ChatRoom) => ({
      id: room.id,
      title: room.name,
      createdAt: new Date(room.created_at),
      userId: room.created_by,
      path: `/room/${room.name}`,
      messages: [], // Messages are loaded separately in LiveKit
      sharePath: `/share/${room.id}`
    }))
    
    return chats
  } catch (error) {
    console.error('Error fetching chats:', error)
    return []
  }
}

export async function getChat(id: string, userId: string): Promise<Chat | null> {
  const { userId: authUserId } = await auth()

  if (userId !== authUserId) {
    return null
  }

  try {
    // For now, return null since we don't have a database yet
    // This will be implemented when we add database integration
    return null
  } catch (error) {
    return null
  }
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const { userId } = await auth()

  if (!userId) {
    return {
      error: 'Unauthorized'
    }
  }

  try {
    // For now, just revalidate the path since we don't have a database yet
    // This will be implemented when we add database integration
    revalidatePath('/')
    return revalidatePath(path)
  } catch (error) {
    return {
      error: 'Failed to remove chat'
    }
  }
}

export async function clearChats() {
  const { userId } = await auth()

  if (!userId) {
    return {
      error: 'Unauthorized'
    }
  }

  try {
    // For now, just revalidate the path since we don't have a database yet
    // This will be implemented when we add database integration
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return {
      error: 'Failed to clear chats'
    }
  }
}

export async function getSharedChat(id: string): Promise<Chat | null> {
  try {
    // For now, return null since we don't have a database yet
    // This will be implemented when we add database integration
    return null
  } catch (error) {
    return null
  }
}

export async function shareChat(id: string) {
  const { userId } = await auth()

  if (!userId) {
    return {
      error: 'Unauthorized'
    }
  }

  try {
    // For now, return a mock shared chat since we don't have a database yet
    // This will be implemented when we add database integration
    return {
      id: id,
      title: 'Shared Chat',
      sharePath: `/share/${id}`
    }
  } catch (error) {
    return {
      error: 'Failed to share chat'
    }
  }
}

export async function saveChat(chat: Chat) {
  const { userId } = await auth()

  if (!userId) {
    return {
      error: 'Unauthorized'
    }
  }

  try {
    // For now, just return success since we don't have a database yet
    // This will be implemented when we add database integration
    return { success: true }
  } catch (error) {
    return {
      error: 'Failed to save chat'
    }
  }
}

export async function refreshHistory(path: string) {
  redirect(path)
}

export async function getMissingKeys() {
  const keysRequired = ['GROQ_API_KEY']
  return keysRequired
    .map(key => (process.env[key] ? '' : key))
    .filter(key => key !== '')
}
