import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import RoomsList from '@/components/rooms-list'

export default async function RoomsPage() {
  const { sessionId } = await auth()

  if (!sessionId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:px-4 lg:px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Active Rooms</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse and join available chat rooms
          </p>
        </div>
        <RoomsList />
      </div>
    </div>
  )
}
