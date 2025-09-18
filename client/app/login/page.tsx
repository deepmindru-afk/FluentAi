'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function LoginPage() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  
  useEffect(() => {
    if (isSignedIn) {
      router.replace('/')
    } else {
      // Redirect to new Clerk sign-in page
      router.replace('/sign-in')
    }
  }, [router, isSignedIn])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Redirecting to sign in...</p>
      </div>
    </div>
  )
}
