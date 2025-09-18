import { auth } from '@clerk/nextjs/server'
import { Session } from '@/lib/types'
import { redirect } from 'next/navigation'
import ParticipantsList from '@/components/participants-list'

interface ParticipantsPageProps {
  params: {
    roomName: string
  }
}

export default async function ParticipantsPage({ params }: ParticipantsPageProps) {
  const session = (await auth()) as unknown as Session

  if (!session) {
    redirect('/login')
  }

  const roomName = decodeURIComponent(params.roomName)

  return (
    <div className="min-h-screen flex items-center justify-center py-2 px-2 sm:px-4 lg:px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Room Participants</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage participants in room: <span className="font-semibold">{roomName}</span>
          </p>
        </div>
        <ParticipantsList roomName={roomName} />
      </div>
    </div>
  )
}
