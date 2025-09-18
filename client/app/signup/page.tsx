import { auth } from '@clerk/nextjs/server'
import SignupForm from '@/components/signup-form'
import { Session } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function SignupPage() {
  const session = (await auth()) as unknown as Session | null

  if (session?.user) {
    redirect('/')
  }

  return (
    <main className="flex flex-col p-4 md:mt-[100px]">
      <SignupForm />
    </main>
  )
}
