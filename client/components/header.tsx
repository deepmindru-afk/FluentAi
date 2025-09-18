import * as React from 'react'
import Link from 'next/link'
import { 
  SignInButton, 
  SignUpButton, 
  UserButton, 
  SignedIn, 
  SignedOut,
  useUser 
} from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import {
  IconSeparator,
} from '@/components/ui/icons'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'
import { ChatHistory } from './chat-history'
import Image from 'next/image'

function UserOrLogin() {
  return (
    <>
      <SignedIn>
        <SidebarMobile>
          <ChatHistory userId="" />
        </SidebarMobile>
        <SidebarToggle />
      </SignedIn>
      <SignedOut>
        <Link href="/new" rel="nofollow">
          <Image src="/favicon.png" width={24} height={24} alt="Fluent Logo" className="size-8 mr-2" />
        </Link>
      </SignedOut>
      <div className="flex items-center gap-4">
        <SignedIn>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/new">New Chat</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/rooms">Rooms</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/room-list">Room List</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/participants">Participants</Link>
            </Button>
          </nav>
        </SignedIn>
        <IconSeparator className="size-6 text-muted-foreground/50" />
        <SignedIn>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "bg-card border shadow-md",
                userButtonPopoverActionButton: "text-foreground hover:bg-muted"
              }
            }}
          />
        </SignedIn>
        <SignedOut>
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="default" size="sm">Sign Up</Button>
            </SignUpButton>
          </div>
        </SignedOut>
      </div>
    </>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
      </div>
    </header>
  )
}
