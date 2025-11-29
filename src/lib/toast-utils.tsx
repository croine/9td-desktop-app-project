import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Trash2,
  Edit,
  Plus,
  Archive,
  Copy,
  Download,
  Upload,
  Settings,
  Zap,
  Star,
  Sparkles,
  Flame,
  Trophy,
  Target,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Bell,
  Shield,
  Rocket,
  Heart,
  TrendingUp,
} from 'lucide-react'
import { ExternalToast } from 'sonner'

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'custom'

interface ToastOptions extends ExternalToast {
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
  icon?: React.ReactNode
  duration?: number
}

// Enhanced toast notifications with icons and animations
export const showToast = {
  // Task Operations
  taskCreated: (taskTitle: string, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 animate-scale" />
        <span className="font-medium">Task Created</span>
      </div>,
      {
        description: `"${taskTitle}" has been added to your tasks`,
        duration: 3000,
        className: 'group-[.toaster]:bg-green-50 group-[.toaster]:dark:bg-green-950/30 group-[.toaster]:border-green-200 group-[.toaster]:dark:border-green-800',
        ...options,
      }
    )
  },

  taskUpdated: (taskTitle: string, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Edit className="h-4 w-4 animate-pulse" />
        <span className="font-medium">Task Updated</span>
      </div>,
      {
        description: `Changes saved for "${taskTitle}"`,
        duration: 2500,
        className: 'group-[.toaster]:bg-blue-50 group-[.toaster]:dark:bg-blue-950/30 group-[.toaster]:border-blue-200 group-[.toaster]:dark:border-blue-800',
        ...options,
      }
    )
  },

  taskDeleted: (taskTitle: string, options?: ToastOptions) => {
    toast.error(
      <div className="flex items-center gap-2">
        <Trash2 className="h-4 w-4 animate-shake" />
        <span className="font-medium">Task Deleted</span>
      </div>,
      {
        description: `"${taskTitle}" has been removed`,
        duration: 3000,
        className: 'group-[.toaster]:bg-red-50 group-[.toaster]:dark:bg-red-950/30 group-[.toaster]:border-red-200 group-[.toaster]:dark:border-red-800',
        ...options,
      }
    )
  },

  taskCompleted: (taskTitle: string, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 animate-bounce" />
        <span className="font-medium">Task Completed! 🎉</span>
      </div>,
      {
        description: `Great job on completing "${taskTitle}"`,
        duration: 4000,
        className: 'group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-green-50 group-[.toaster]:to-emerald-50 group-[.toaster]:dark:from-green-950/30 group-[.toaster]:dark:to-emerald-950/30 group-[.toaster]:border-green-300 group-[.toaster]:dark:border-green-700',
        ...options,
      }
    )
  },

  taskArchived: (count: number = 1, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Archive className="h-4 w-4 animate-float" />
        <span className="font-medium">Task{count > 1 ? 's' : ''} Archived</span>
      </div>,
      {
        description: `${count} task${count > 1 ? 's' : ''} moved to archive`,
        duration: 3000,
        ...options,
      }
    )
  },

  taskRestored: (taskTitle: string, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 animate-glow" />
        <span className="font-medium">Task Restored</span>
      </div>,
      {
        description: `"${taskTitle}" is back in your tasks`,
        duration: 3000,
        ...options,
      }
    )
  },

  // Bulk Operations
  bulkOperation: (action: string, count: number, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 animate-pulse" />
        <span className="font-medium">Bulk Action Complete</span>
      </div>,
      {
        description: `${count} tasks ${action}`,
        duration: 3000,
        ...options,
      }
    )
  },

  // Status Changes
  statusChanged: (taskTitle: string, newStatus: string, options?: ToastOptions) => {
    const statusIcons = {
      'todo': <Target className="h-4 w-4 animate-scale" />,
      'in-progress': <Clock className="h-4 w-4 animate-rotate" />,
      'completed': <CheckCircle2 className="h-4 w-4 animate-bounce" />,
      'blocked': <AlertCircle className="h-4 w-4 animate-shake" />,
    }

    const icon = statusIcons[newStatus as keyof typeof statusIcons] || <Info className="h-4 w-4" />

    toast.success(
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">Status Updated</span>
      </div>,
      {
        description: `"${taskTitle}" → ${newStatus.replace('-', ' ')}`,
        duration: 2500,
        ...options,
      }
    )
  },

  // Import/Export
  exportSuccess: (type: string, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 animate-bounce" />
        <span className="font-medium">Export Complete</span>
      </div>,
      {
        description: `Your data has been exported as ${type}`,
        duration: 4000,
        ...options,
      }
    )
  },

  importSuccess: (count: number, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Upload className="h-4 w-4 animate-scale" />
        <span className="font-medium">Import Successful</span>
      </div>,
      {
        description: `${count} items imported successfully`,
        duration: 4000,
        ...options,
      }
    )
  },

  importError: (reason: string, options?: ToastOptions) => {
    toast.error(
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 animate-shake" />
        <span className="font-medium">Import Failed</span>
      </div>,
      {
        description: reason,
        duration: 5000,
        ...options,
      }
    )
  },

  // Settings
  settingsSaved: (options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 animate-rotate" />
        <span className="font-medium">Settings Saved</span>
      </div>,
      {
        description: 'Your preferences have been updated',
        duration: 2500,
        ...options,
      }
    )
  },

  // Achievements & Gamification
  achievementUnlocked: (achievementName: string, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500 animate-bounce" />
        <span className="font-bold text-lg">Achievement Unlocked!</span>
      </div>,
      {
        description: achievementName,
        duration: 5000,
        className: 'group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-yellow-50 group-[.toaster]:to-amber-50 group-[.toaster]:dark:from-yellow-950/30 group-[.toaster]:dark:to-amber-950/30 group-[.toaster]:border-yellow-400 group-[.toaster]:dark:border-yellow-600 group-[.toaster]:shadow-xl',
        ...options,
      }
    )
  },

  streakMilestone: (days: number, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
        <span className="font-bold text-lg">{days} Day Streak! 🔥</span>
      </div>,
      {
        description: `You're on fire! Keep it going!`,
        duration: 5000,
        className: 'group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-orange-50 group-[.toaster]:to-red-50 group-[.toaster]:dark:from-orange-950/30 group-[.toaster]:dark:to-red-950/30 group-[.toaster]:border-orange-400 group-[.toaster]:dark:border-orange-600',
        ...options,
      }
    )
  },

  levelUp: (newLevel: number, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-purple-500 animate-glow" />
        <span className="font-bold text-lg">Level Up!</span>
      </div>,
      {
        description: `You've reached level ${newLevel}!`,
        duration: 5000,
        className: 'group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-purple-50 group-[.toaster]:to-pink-50 group-[.toaster]:dark:from-purple-950/30 group-[.toaster]:dark:to-pink-950/30 group-[.toaster]:border-purple-400 group-[.toaster]:dark:border-purple-600',
        ...options,
      }
    )
  },

  // Productivity Insights
  productivityInsight: (message: string, options?: ToastOptions) => {
    toast.info(
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 animate-float" />
        <span className="font-medium">Productivity Insight</span>
      </div>,
      {
        description: message,
        duration: 6000,
        className: 'group-[.toaster]:bg-blue-50 group-[.toaster]:dark:bg-blue-950/30 group-[.toaster]:border-blue-300 group-[.toaster]:dark:border-blue-700',
        ...options,
      }
    )
  },

  // Notifications & Reminders
  reminder: (title: string, message: string, options?: ToastOptions) => {
    toast.info(
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 animate-shake" />
        <span className="font-medium">{title}</span>
      </div>,
      {
        description: message,
        duration: 5000,
        className: 'group-[.toaster]:bg-amber-50 group-[.toaster]:dark:bg-amber-950/30 group-[.toaster]:border-amber-300 group-[.toaster]:dark:border-amber-700',
        ...options,
      }
    )
  },

  dueSoon: (taskTitle: string, timeLeft: string, options?: ToastOptions) => {
    toast.warning(
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 animate-pulse" />
        <span className="font-medium">Task Due Soon</span>
      </div>,
      {
        description: `"${taskTitle}" is due ${timeLeft}`,
        duration: 6000,
        className: 'group-[.toaster]:bg-orange-50 group-[.toaster]:dark:bg-orange-950/30 group-[.toaster]:border-orange-300 group-[.toaster]:dark:border-orange-700',
        ...options,
      }
    )
  },

  overdue: (taskTitle: string, options?: ToastOptions) => {
    toast.error(
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 animate-shake" />
        <span className="font-medium">Overdue Task</span>
      </div>,
      {
        description: `"${taskTitle}" is overdue. Please complete it soon.`,
        duration: 6000,
        className: 'group-[.toaster]:bg-red-50 group-[.toaster]:dark:bg-red-950/30 group-[.toaster]:border-red-300 group-[.toaster]:dark:border-red-700',
        ...options,
      }
    )
  },

  // Collaboration
  newMessage: (from: string, preview: string, options?: ToastOptions) => {
    toast.info(
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 animate-bounce" />
        <span className="font-medium">New Message from {from}</span>
      </div>,
      {
        description: preview,
        duration: 5000,
        ...options,
      }
    )
  },

  mentioned: (where: string, options?: ToastOptions) => {
    toast.info(
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 animate-scale" />
        <span className="font-medium">You were mentioned</span>
      </div>,
      {
        description: `Someone mentioned you in ${where}`,
        duration: 5000,
        ...options,
      }
    )
  },

  // Templates
  templateCreated: (name: string, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Copy className="h-4 w-4 animate-scale" />
        <span className="font-medium">Template Created</span>
      </div>,
      {
        description: `"${name}" template is ready to use`,
        duration: 3000,
        ...options,
      }
    )
  },

  templateApplied: (name: string, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 animate-glow" />
        <span className="font-medium">Template Applied</span>
      </div>,
      {
        description: `Task created from "${name}" template`,
        duration: 3000,
        ...options,
      }
    )
  },

  // Automation
  automationTriggered: (ruleName: string, options?: ToastOptions) => {
    toast.info(
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 animate-pulse" />
        <span className="font-medium">Automation Triggered</span>
      </div>,
      {
        description: `Rule "${ruleName}" has been executed`,
        duration: 4000,
        className: 'group-[.toaster]:bg-purple-50 group-[.toaster]:dark:bg-purple-950/30 group-[.toaster]:border-purple-300 group-[.toaster]:dark:border-purple-700',
        ...options,
      }
    )
  },

  // Focus Mode
  focusModeStarted: (taskTitle: string, duration: number, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 animate-pulse" />
        <span className="font-medium">Focus Mode Started</span>
      </div>,
      {
        description: `${duration} minutes on "${taskTitle}"`,
        duration: 3000,
        className: 'group-[.toaster]:bg-indigo-50 group-[.toaster]:dark:bg-indigo-950/30 group-[.toaster]:border-indigo-300 group-[.toaster]:dark:border-indigo-700',
        ...options,
      }
    )
  },

  pomodoroComplete: (options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 animate-bounce" />
        <span className="font-medium">Pomodoro Complete!</span>
      </div>,
      {
        description: 'Great work! Take a well-deserved break.',
        duration: 4000,
        className: 'group-[.toaster]:bg-green-50 group-[.toaster]:dark:bg-green-950/30 group-[.toaster]:border-green-300 group-[.toaster]:dark:border-green-700',
        ...options,
      }
    )
  },

  // Authentication
  signInSuccess: (username: string, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Rocket className="h-4 w-4 animate-scale" />
        <span className="font-medium">Welcome back, {username}!</span>
      </div>,
      {
        description: 'Successfully signed in to your account',
        duration: 3000,
        ...options,
      }
    )
  },

  signOutSuccess: (options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <span className="font-medium">Signed Out</span>
      </div>,
      {
        description: 'You have been securely signed out',
        duration: 2500,
        ...options,
      }
    )
  },

  // Generic
  success: (message: string, description?: string, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4" />
        <span className="font-medium">{message}</span>
      </div>,
      {
        description,
        duration: 3000,
        ...options,
      }
    )
  },

  error: (message: string, description?: string, options?: ToastOptions) => {
    toast.error(
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 animate-shake" />
        <span className="font-medium">{message}</span>
      </div>,
      {
        description,
        duration: 4000,
        ...options,
      }
    )
  },

  warning: (message: string, description?: string, options?: ToastOptions) => {
    toast.warning(
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span className="font-medium">{message}</span>
      </div>,
      {
        description,
        duration: 4000,
        ...options,
      }
    )
  },

  info: (message: string, description?: string, options?: ToastOptions) => {
    toast.info(
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4" />
        <span className="font-medium">{message}</span>
      </div>,
      {
        description,
        duration: 3000,
        ...options,
      }
    )
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-medium">{message}</span>
      </div>,
      {
        duration: Infinity,
        ...options,
      }
    )
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, {
      loading: (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">{messages.loading}</span>
        </div>
      ),
      success: (data) => {
        const message = typeof messages.success === 'function' ? messages.success(data) : messages.success
        return (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 animate-bounce" />
            <span className="font-medium">{message}</span>
          </div>
        )
      },
      error: (error) => {
        const message = typeof messages.error === 'function' ? messages.error(error) : messages.error
        return (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 animate-shake" />
            <span className="font-medium">{message}</span>
          </div>
        )
      },
      ...options,
    })
  },
}

// Keyboard shortcut toast
export const keyboardShortcutToast = (shortcut: string, action: string) => {
  toast.info(
    <div className="flex items-center gap-3">
      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">{shortcut}</kbd>
      <span className="text-sm">{action}</span>
    </div>,
    {
      duration: 2000,
      className: 'group-[.toaster]:bg-background group-[.toaster]:border',
    }
  )
}
