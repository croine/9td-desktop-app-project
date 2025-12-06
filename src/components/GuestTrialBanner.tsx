"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, AlertCircle, Zap, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGuestTrial } from "@/hooks/useGuestTrial"

interface GuestTrialBannerProps {
  className?: string
  compact?: boolean
}

export const GuestTrialBanner = ({ className, compact = false }: GuestTrialBannerProps) => {
  const router = useRouter()
  const { 
    timeRemaining, 
    isExpired, 
    getTasksRemaining, 
    formatTimeRemaining,
    getPercentageRemaining,
    trialData
  } = useGuestTrial()

  if (!trialData) return null

  const tasksRemaining = getTasksRemaining()
  const percentageRemaining = getPercentageRemaining()
  const isUrgent = percentageRemaining < 25 || tasksRemaining <= 1
  const isWarning = percentageRemaining < 50 || tasksRemaining <= 2

  if (isExpired) {
    return (
      <Card className={cn("glass-card p-4 border-destructive/50 bg-destructive/5", className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Trial Expired</h3>
            <p className="text-xs text-muted-foreground">Sign in to continue using 9TD</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" onClick={() => router.push('/login')} className="h-7 text-xs">
              Sign In
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push('/register')} className="h-7 text-xs">
              Register
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20", className)}>
        <div className="flex items-center gap-2">
          <Clock className={cn(
            "h-4 w-4",
            isUrgent ? "text-destructive animate-pulse" : 
            isWarning ? "text-yellow-500" : "text-primary"
          )} />
          <span className={cn(
            "font-mono text-xs font-semibold",
            isUrgent ? "text-destructive" : 
            isWarning ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"
          )}>
            {formatTimeRemaining()}
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Sparkles className={cn(
            "h-4 w-4",
            tasksRemaining === 0 ? "text-destructive" : 
            tasksRemaining <= 2 ? "text-yellow-500" : "text-primary"
          )} />
          <span className={cn(
            "font-mono text-xs font-semibold",
            tasksRemaining === 0 ? "text-destructive" : 
            tasksRemaining <= 2 ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"
          )}>
            {tasksRemaining}/{trialData.maxTasks}
          </span>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      "glass-card p-3 max-w-2xl mx-auto",
      isUrgent && "border-destructive/50 bg-destructive/5",
      isWarning && !isUrgent && "border-yellow-500/50 bg-yellow-500/5",
      className
    )}>
      <div className="flex items-center gap-4">
        {/* Icon and Title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isUrgent ? "bg-destructive/10" : 
            isWarning ? "bg-yellow-500/10" : "bg-primary/10"
          )}>
            <Zap className={cn(
              "h-4 w-4",
              isUrgent ? "text-destructive" : 
              isWarning ? "text-yellow-500" : "text-primary"
            )} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">Guest Trial</h3>
            <p className="text-xs text-muted-foreground">Limited access</p>
          </div>
        </div>

        {/* Stats - Horizontal Layout */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Time Remaining */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1">
                <Clock className={cn(
                  "h-3 w-3",
                  isUrgent ? "text-destructive" : 
                  isWarning ? "text-yellow-500" : "text-primary"
                )} />
                <span className="text-muted-foreground">Time</span>
              </div>
              <span className={cn(
                "font-mono font-semibold text-xs",
                isUrgent ? "text-destructive animate-pulse" : 
                isWarning ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"
              )}>
                {formatTimeRemaining()}
              </span>
            </div>
            <Progress 
              value={percentageRemaining} 
              className={cn(
                "h-1.5",
                isUrgent ? "[&>div]:bg-destructive" : 
                isWarning ? "[&>div]:bg-yellow-500" : ""
              )}
            />
          </div>

          {/* Tasks Remaining */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1">
                <Sparkles className={cn(
                  "h-3 w-3",
                  tasksRemaining === 0 ? "text-destructive" : 
                  tasksRemaining <= 2 ? "text-yellow-500" : "text-primary"
                )} />
                <span className="text-muted-foreground">Tasks</span>
              </div>
              <span className={cn(
                "font-mono font-semibold text-xs",
                tasksRemaining === 0 ? "text-destructive" : 
                tasksRemaining <= 2 ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"
              )}>
                {tasksRemaining}/{trialData.maxTasks}
              </span>
            </div>
            <Progress 
              value={(tasksRemaining / trialData.maxTasks) * 100} 
              className={cn(
                "h-1.5",
                tasksRemaining === 0 ? "[&>div]:bg-destructive" : 
                tasksRemaining <= 2 ? "[&>div]:bg-yellow-500" : ""
              )}
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Button 
            onClick={() => router.push('/register')}
            size="sm"
            className="h-7 text-xs px-3"
          >
            Sign Up
          </Button>
          <Button 
            onClick={() => router.push('/login')}
            variant="outline"
            size="sm"
            className="h-7 text-xs px-3"
          >
            Sign In
          </Button>
        </div>
      </div>

      {/* Warning Message - Only if urgent */}
      {isUrgent && (
        <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive font-medium">
            {tasksRemaining === 0 
              ? "Task limit reached! Sign up to create unlimited tasks."
              : "Trial ending soon! Sign up now to save your progress."}
          </p>
        </div>
      )}
    </Card>
  )
}

export const CompactGuestTrialBanner = ({ className }: { className?: string }) => {
  return <GuestTrialBanner compact className={className} />
}