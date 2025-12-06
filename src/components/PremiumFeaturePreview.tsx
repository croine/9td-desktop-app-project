"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Crown, 
  Lock, 
  Sparkles, 
  BarChart3, 
  Clock, 
  Calendar,
  Layers,
  MessageSquare,
  Zap,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PremiumFeature {
  id: string
  name: string
  description: string
  icon: React.ElementType
  gradient: string
  benefits: string[]
  plan: "Pro" | "Team"
}

const premiumFeatures: PremiumFeature[] = [
  {
    id: "advanced-views",
    name: "Advanced Views",
    description: "Unlock Kanban boards, Gantt charts, and time blocking calendars",
    icon: Layers,
    gradient: "from-blue-500 to-cyan-500",
    benefits: ["Kanban Board", "Gantt Timeline", "Time Blocking", "Calendar View"],
    plan: "Pro"
  },
  {
    id: "pomodoro",
    name: "Pomodoro Timer",
    description: "Focus with structured work/break intervals and task integration",
    icon: Clock,
    gradient: "from-purple-500 to-pink-500",
    benefits: ["Task Timer", "Break Reminders", "Focus Analytics", "Session History"],
    plan: "Pro"
  },
  {
    id: "analytics",
    name: "Advanced Analytics",
    description: "Deep insights into your productivity and time management",
    icon: BarChart3,
    gradient: "from-green-500 to-emerald-500",
    benefits: ["Time Tracking", "Productivity Insights", "Custom Reports", "Export Data"],
    plan: "Pro"
  },
  {
    id: "team-messaging",
    name: "Team Messaging",
    description: "Collaborate with your team through integrated messaging",
    icon: MessageSquare,
    gradient: "from-orange-500 to-red-500",
    benefits: ["Real-time Chat", "File Sharing", "Mentions & Notifications", "Channel Management"],
    plan: "Team"
  }
]

export const LimitedTimeOfferBanner = () => {
  const router = useRouter()

  return (
    <Card className="glass-card p-3 text-center space-y-2 border-2 border-primary/20 max-w-2xl mx-auto">
      <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-primary/10">
        <Zap className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-xs font-semibold text-primary">Limited Time Offer</span>
      </div>
      <h3 className="font-display text-lg font-bold">
        Get Full Access Now
      </h3>
      <p className="text-xs text-muted-foreground max-w-md mx-auto">
        Join thousands of users who have supercharged their productivity with 9TD Pro
      </p>
      <div className="flex gap-2 justify-center pt-1">
        <Button 
          size="sm"
          onClick={() => router.push('/register')}
          className="gap-1.5 shadow-lg shadow-primary/25 text-xs h-7 px-3"
        >
          <Sparkles className="h-3 w-3" />
          Start Free Trial
        </Button>
        <Button 
          size="sm"
          variant="outline"
          onClick={() => router.push('/pricing')}
          className="gap-1.5 text-xs h-7 px-3"
        >
          View Pricing
        </Button>
      </div>
    </Card>
  )
}

export const PremiumFeaturePreview = () => {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
          <Crown className="h-4 w-4 text-yellow-500 animate-pulse" />
          <span className="font-display font-semibold text-xs">Premium Features</span>
          <Sparkles className="h-3 w-3 text-yellow-500" />
        </div>
        <h2 className="font-display text-xl font-bold">
          Unlock Your Full Potential
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Sign up now to access advanced features that supercharge your productivity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {premiumFeatures.map((feature) => {
          const Icon = feature.icon
          const isHovered = hoveredFeature === feature.id

          return (
            <Card
              key={feature.id}
              className={cn(
                "glass-card p-4 relative overflow-hidden transition-all duration-300 cursor-pointer group",
                isHovered && "scale-[1.02] shadow-2xl"
              )}
              onMouseEnter={() => setHoveredFeature(feature.id)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              {/* Gradient Background */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                feature.gradient
              )} />

              {/* Lock Overlay for Preview Effect */}
              <div className={cn(
                "absolute top-3 right-3 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/50 transition-all duration-300",
                isHovered && "scale-110"
              )}>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>

              {/* Content */}
              <div className="relative space-y-3">
                {/* Icon & Title */}
                <div className="flex items-start gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br transition-transform duration-300 flex-shrink-0",
                    feature.gradient,
                    isHovered && "scale-110 rotate-3"
                  )}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-display font-semibold text-sm">{feature.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          feature.plan === "Pro" 
                            ? "border-blue-500/50 text-blue-600 dark:text-blue-400" 
                            : "border-purple-500/50 text-purple-600 dark:text-purple-400"
                        )}
                      >
                        {feature.plan}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="space-y-1">
                  {feature.benefits.map((benefit, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "flex items-center gap-1.5 text-xs transition-all duration-200",
                        isHovered ? "translate-x-1" : ""
                      )}
                      style={{ transitionDelay: `${idx * 50}ms` }}
                    >
                      <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Preview Animation */}
                {isHovered && (
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}