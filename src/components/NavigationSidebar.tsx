"use client"

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Settings,
  History,
  Tag as TagIcon,
  MessageSquare,
  LogIn,
  LogOut,
  User,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ========================================================================
// NAVIGATION SIDEBAR v6.0 - WITH AUTHENTICATION
// Updated: DEC-20-2025 - Added Auth Integration
// ========================================================================

export type SidebarView = 
  | 'dashboard' 
  | 'your-tasks' 
  | 'activity-logs'
  | 'owner-panel'
  | 'settings'
  | 'message-system'
  | 'calendar'
  | 'kanban'
  | 'gantt'
  | 'analytics'

interface NavigationSidebarProps {
  currentView: SidebarView
  onViewChange: (view: SidebarView) => void
  taskCount?: number
  inboxCount?: number
  session: any
  sessionPending: boolean
}

export function NavigationSidebar({ 
  currentView, 
  onViewChange, 
  taskCount = 0,
  session,
  sessionPending
}: NavigationSidebarProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token")
    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
    
    if (error?.code) {
      toast.error('Failed to sign out')
    } else {
      localStorage.removeItem("bearer_token")
      toast.success('Signed out successfully')
      router.push('/')
    }
  }

  // ==========================================
  // 6 NAVIGATION TABS WITH TOOLTIPS
  // ==========================================
  const navigationTabs = [
    { 
      id: 'dashboard' as const, 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'Overview and statistics of all your tasks',
      requiresAuth: false
    },
    { 
      id: 'your-tasks' as const, 
      label: 'Your Tasks', 
      icon: CheckSquare, 
      badge: taskCount,
      description: 'View and manage all your active tasks',
      requiresAuth: true
    },
    { 
      id: 'activity-logs' as const, 
      label: 'Activity Logs', 
      icon: History,
      description: 'Track all changes and updates to tasks',
      requiresAuth: true
    },
    { 
      id: 'owner-panel' as const, 
      label: 'Owner Panel', 
      icon: TagIcon,
      description: 'Manage tags, categories, and workspace settings',
      requiresAuth: true
    },
    { 
      id: 'settings' as const, 
      label: 'Settings Hub', 
      icon: Settings,
      description: 'Advanced features and configuration (11 tabs)',
      requiresAuth: true
    },
    { 
      id: 'message-system' as const, 
      label: 'Message System', 
      icon: MessageSquare,
      description: 'Team communication and collaboration',
      requiresAuth: true
    },
  ]

  return (
    <div className="flex flex-col h-full border-r bg-sidebar/50 backdrop-blur-sm">
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-4 px-3">
          {/* User Section */}
          <div className="px-2 py-3 bg-gradient-to-br from-primary/5 to-accent/10 rounded-lg border border-primary/20">
            {sessionPending ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : session?.user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{session.user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3 w-3" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground text-center">
                  Sign in to access all features
                </p>
                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full h-7 text-xs gap-2"
                    onClick={() => router.push('/login')}
                  >
                    <LogIn className="h-3 w-3" />
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => router.push('/register')}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Section */}
          <div className="space-y-0.5">
            <h3 className="px-2 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Main Navigation
            </h3>
            {navigationTabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = currentView === tab.id
              const isLocked = tab.requiresAuth && !session?.user

              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 6, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-2 h-9 font-medium text-xs transition-all duration-300",
                          isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-sm border-l-2 border-primary",
                          isLocked && "opacity-60"
                        )}
                        onClick={() => onViewChange(tab.id)}
                      >
                        <motion.div
                          animate={isActive ? {
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1.1, 1]
                          } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                        </motion.div>
                        <span className="flex-1 text-left">{tab.label}</span>
                        {tab.badge !== undefined && tab.badge > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Badge 
                              variant={isActive ? "default" : "secondary"}
                              className="h-4 min-w-4 px-1 text-[10px] font-semibold"
                            >
                              {tab.badge}
                            </Badge>
                          </motion.div>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="font-semibold">{tab.label}</p>
                      <p className="text-xs opacity-90">{tab.description}</p>
                      {isLocked && (
                        <p className="text-xs text-yellow-500 mt-1">🔒 Sign in required</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )
            })}
          </div>

          {/* Help Card */}
          <motion.div 
            className="px-2 py-3 bg-gradient-to-br from-primary/5 to-accent/10 rounded-lg border border-primary/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-foreground">
                💡 Advanced Features
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Click <span className="font-bold text-primary">Settings Hub</span> above to access:
              </p>
              <ul className="text-[9px] text-muted-foreground space-y-0.5 pl-2">
                <li>• Projects & Kanban Boards</li>
                <li>• Calendar & Gantt Charts</li>
                <li>• Time Tracker & Analytics</li>
                <li>• Templates & Focus Mode</li>
                <li>• And 7 more features...</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground text-center space-y-0.5">
          <p className="font-semibold text-[10px]">9TD v6.0 Ultimate</p>
          <p className="text-[9px]">With Authentication</p>
        </div>
      </div>
    </div>
  )
}