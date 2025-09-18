import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import RoomManagement from '@/components/room-management'

export default async function RoomListPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Room Management</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage all chat rooms, participants, and settings
          </p>
        </div>
        <RoomManagement />
      </div>
    </div>
  )
}
