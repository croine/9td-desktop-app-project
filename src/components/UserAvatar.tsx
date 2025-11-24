"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Settings, 
  LogOut, 
  Shield,
  UserCircle,
  Bell
} from 'lucide-react'
import { toast } from 'sonner'

interface UserAvatarProps {
  session: any
  onOpenSettings?: () => void
}

export function UserAvatar({ session, onOpenSettings }: UserAvatarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  if (!session?.user) {
    return null
  }

  const user = session.user
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || 'U'

  const handleSignOut = async () => {
    const { error } = await authClient.signOut()
    if (error?.code) {
      toast.error('Failed to sign out')
    } else {
      localStorage.removeItem('bearer_token')
      toast.success('Signed out successfully')
      router.push('/')
    }
  }

  const handleAccountSettings = () => {
    setIsOpen(false)
    if (onOpenSettings) {
      onOpenSettings()
    } else {
      router.push('/settings')
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 glass-card" align="end" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2 p-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="font-display font-semibold text-base leading-none">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  Account Secured
                </p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleAccountSettings}
            className="cursor-pointer py-2.5"
          >
            <UserCircle className="mr-3 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false)
              if (onOpenSettings) {
                onOpenSettings()
              }
            }}
            className="cursor-pointer py-2.5"
          >
            <Settings className="mr-3 h-4 w-4" />
            <span>Preferences</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false)
              toast.info('Notification settings coming soon')
            }}
            className="cursor-pointer py-2.5"
          >
            <Bell className="mr-3 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive py-2.5"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
