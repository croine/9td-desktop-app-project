"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Crown,
  Lock,
  CheckCircle2,
  TrendingUp,
  Award,
  Flame
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UserStats {
  level: number
  xp: number
  xpToNextLevel: number
  tasksCompletedToday: number
  tasksCompletedThisWeek: number
  tasksCompletedTotal: number
  currentStreak: number
  longestStreak: number
  dailyGoal: number
  weeklyGoal: number
}

interface Achievement {
  id: number
  achievementType: string
  title: string
  description: string
  icon: string
  xpReward: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  category: string
  unlockedAt: string | null
  isDisplayed: boolean
  progress?: number
  maxProgress?: number
}

interface GamificationDashboardProps {
  onFeatureGateRedirect?: () => void
}

export function GamificationDashboard({ onFeatureGateRedirect }: GamificationDashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const [statsRes, achievementsRes] = await Promise.all([
        fetch('/api/user-stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/achievements', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      if (achievementsRes.ok) {
        const data = await achievementsRes.json()
        setAchievements(data)
      }
    } catch (error) {
      console.error('Failed to fetch gamification data:', error)
      toast.error('Failed to load gamification data')
    } finally {
      setLoading(false)
    }
  }

  const toggleAchievementDisplay = async (achievementId: number, currentDisplay: boolean) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const response = await fetch(`/api/achievements/${achievementId}/display`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isDisplayed: !currentDisplay })
      })

      if (response.ok) {
        setAchievements(prev => 
          prev.map(a => a.id === achievementId ? { ...a, isDisplayed: !currentDisplay } : a)
        )
        toast.success(!currentDisplay ? 'Achievement displayed on profile' : 'Achievement hidden from profile')
      }
    } catch (error) {
      toast.error('Failed to update achievement display')
    }
  }

  const categories = ['all', 'tasks', 'streaks', 'productivity', 'social', 'premium']
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory)

  const unlockedCount = achievements.filter(a => a.unlockedAt).length
  const totalCount = achievements.length
  const completionRate = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-orange-600 to-orange-400'
      case 'silver': return 'from-slate-400 to-slate-200'
      case 'gold': return 'from-yellow-500 to-yellow-300'
      case 'platinum': return 'from-purple-500 to-pink-400'
      default: return 'from-gray-400 to-gray-200'
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-500/20 text-orange-600 border-orange-500/30'
      case 'silver': return 'bg-slate-500/20 text-slate-600 border-slate-500/30'
      case 'gold': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'platinum': return 'bg-purple-500/20 text-purple-600 border-purple-500/30'
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Level Card */}
        <Card className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl"></div>
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <Crown className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-xs">
                Level {stats?.level || 0}
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats?.xp || 0} XP</p>
              <p className="text-xs text-muted-foreground">
                {stats?.xpToNextLevel || 0} XP to next level
              </p>
            </div>
            <Progress 
              value={stats ? (stats.xp / (stats.xp + stats.xpToNextLevel)) * 100 : 0} 
              className="h-2"
            />
          </div>
        </Card>

        {/* Achievements Card */}
        <Card className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-2xl"></div>
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <Badge variant="secondary" className="text-xs">
                {unlockedCount}/{totalCount}
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{unlockedCount}</p>
              <p className="text-xs text-muted-foreground">Achievements unlocked</p>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </Card>

        {/* Streak Card */}
        <Card className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-2xl"></div>
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <Flame className="h-5 w-5 text-orange-500" />
              <Badge variant="secondary" className="text-xs">
                Longest: {stats?.longestStreak || 0}
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats?.currentStreak || 0} days</p>
              <p className="text-xs text-muted-foreground">Current streak</p>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    i < (stats?.currentStreak || 0) % 7
                      ? "bg-orange-500"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Tasks Card */}
        <Card className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-2xl"></div>
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <Target className="h-5 w-5 text-green-500" />
              <Badge variant="secondary" className="text-xs">
                Goal: {stats?.dailyGoal || 0}
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats?.tasksCompletedToday || 0}</p>
              <p className="text-xs text-muted-foreground">Tasks completed today</p>
            </div>
            <Progress 
              value={stats ? (stats.tasksCompletedToday / stats.dailyGoal) * 100 : 0} 
              className="h-2"
            />
          </div>
        </Card>
      </div>

      {/* Achievements Section */}
      <Card className="glass-card p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">Achievements</h2>
              <p className="text-sm text-muted-foreground">
                Unlock achievements by completing tasks and maintaining streaks
              </p>
            </div>
            <Button variant="outline" onClick={() => fetchData()}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Category Filter */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="capitalize">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredAchievements.map((achievement, index) => {
                    const isUnlocked = !!achievement.unlockedAt
                    const isPremium = achievement.tier === 'platinum' || achievement.tier === 'gold'

                    return (
                      <motion.div
                        key={achievement.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className={cn(
                            "p-4 relative overflow-hidden transition-all duration-300",
                            isUnlocked 
                              ? "glass-card hover:shadow-lg cursor-pointer" 
                              : "opacity-60 bg-muted/50"
                          )}
                          onClick={() => isUnlocked && toggleAchievementDisplay(achievement.id, achievement.isDisplayed)}
                        >
                          {/* Tier Gradient Background */}
                          <div className={cn(
                            "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30",
                            `bg-gradient-to-br ${getTierColor(achievement.tier)}`
                          )}></div>

                          {/* Lock Overlay for Locked Achievements */}
                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex items-center justify-center">
                              <Lock className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}

                          <div className="relative space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-3xl">{achievement.icon}</div>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs capitalize", getTierBadgeColor(achievement.tier))}
                              >
                                {achievement.tier}
                              </Badge>
                            </div>

                            {/* Content */}
                            <div>
                              <h3 className="font-display font-semibold text-sm mb-1">
                                {achievement.title}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {achievement.description}
                              </p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center gap-1 text-xs text-primary">
                                <Zap className="h-3 w-3" />
                                <span className="font-semibold">+{achievement.xpReward} XP</span>
                              </div>
                              {isUnlocked && (
                                <div className="flex items-center gap-1">
                                  {achievement.isDisplayed && (
                                    <Badge variant="secondary" className="text-xs h-5">
                                      <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                                      Displayed
                                    </Badge>
                                  )}
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                </div>
                              )}
                            </div>

                            {/* Progress Bar for Partially Complete */}
                            {!isUnlocked && achievement.progress !== undefined && achievement.maxProgress && (
                              <div className="space-y-1">
                                <Progress 
                                  value={(achievement.progress / achievement.maxProgress) * 100} 
                                  className="h-1"
                                />
                                <p className="text-xs text-muted-foreground text-center">
                                  {achievement.progress} / {achievement.maxProgress}
                                </p>
                              </div>
                            )}

                            {/* Premium Lock */}
                            {!isUnlocked && isPremium && (
                              <div className="absolute top-2 left-2">
                                <Badge variant="outline" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Premium
                                </Badge>
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {filteredAchievements.length === 0 && (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No achievements in this category yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}
