import { Sidebar } from '@/components/sidebar'

import { auth } from '@clerk/nextjs/server'
import { ChatHistory } from '@/components/chat-history'

export async function SidebarDesktop() {
  const session = await auth()

  if (!session?.userId) {
    return null
  }

  return (
    <Sidebar className="peer fixed inset-y-0 z-30 hidden -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
      {/* @ts-ignore */}
      <ChatHistory userId={session.userId} />
    </Sidebar>
  )
}
