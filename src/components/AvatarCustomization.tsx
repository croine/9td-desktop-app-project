"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Palette, 
  Image as ImageIcon, 
  Frame as FrameIcon,
  Sparkles,
  Crown,
  Lock,
  CheckCircle2,
  Upload,
  Save,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AvatarWithRings } from '@/components/avatar/AvatarWithRings'
import { useSession } from '@/lib/auth-client'

interface AvatarPreset {
  id: number
  name: string
  description: string
  avatarUrl: string
  frameType: string | null
  colorScheme: string
  borderColor: string
  tier: 'free' | 'pro' | 'team'
  isLocked: boolean
}

interface AvatarFrame {
  id: number
  frameType: string
  name: string
  description: string
  cssClass: string
  tier: 'free' | 'pro' | 'team'
  isActive: boolean
  isUnlocked: boolean
  unlockRequirement: string
}

interface AvatarGalleryItem {
  id: number
  name: string
  imageUrl: string
  category: string
  tier: 'free' | 'pro' | 'team'
  isActive: boolean
  isUnlocked: boolean
  unlockRequirement: string
}

interface UserPreferences {
  avatarUrl: string | null
  avatarShape: 'circle' | 'square' | 'rounded'
  avatarColorScheme: 'solid' | 'gradient' | 'rainbow' | 'fade'
  avatarBorderColor: string
}

interface UserStats {
  level: number
  xp: number
  tasksCompletedToday: number
  tasksCompletedThisWeek: number
  currentStreak: number
  dailyGoal: number
  weeklyGoal: number
}

export function AvatarCustomization() {
  const { data: session } = useSession()
  const [presets, setPresets] = useState<AvatarPreset[]>([])
  const [frames, setFrames] = useState<AvatarFrame[]>([])
  const [gallery, setGallery] = useState<AvatarGalleryItem[]>([])
  const [preferences, setPreferences] = useState<UserPreferences>({
    avatarUrl: null,
    avatarShape: 'circle',
    avatarColorScheme: 'gradient',
    avatarBorderColor: '#6366f1'
  })
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const [presetsRes, framesRes, galleryRes, prefsRes, statsRes] = await Promise.all([
        fetch('/api/avatar-presets', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/avatar-frames', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/avatar-gallery', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/user-preferences', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/user-stats', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (presetsRes.ok) {
        const data = await presetsRes.json()
        setPresets(data)
      }

      if (framesRes.ok) {
        const data = await framesRes.json()
        setFrames(data)
      }

      if (galleryRes.ok) {
        const data = await galleryRes.json()
        setGallery(data)
      }

      if (prefsRes.ok) {
        const data = await prefsRes.json()
        setPreferences({
          avatarUrl: data.avatarUrl || null,
          avatarShape: data.avatarShape || 'circle',
          avatarColorScheme: data.avatarColorScheme || 'gradient',
          avatarBorderColor: data.avatarBorderColor || '#6366f1'
        })
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch avatar data:', error)
      toast.error('Failed to load avatar customization')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async (updates: Partial<UserPreferences>) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    setSaving(true)
    try {
      const response = await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        setPreferences(prev => ({ ...prev, ...updates }))
        toast.success('Avatar updated successfully')
      }
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const activatePreset = async (presetId: number) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const response = await fetch(`/api/avatar-presets/${presetId}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences({
          avatarUrl: data.avatarUrl,
          avatarShape: data.avatarShape,
          avatarColorScheme: data.avatarColorScheme,
          avatarBorderColor: data.avatarBorderColor
        })
        toast.success('Preset applied successfully')
        await fetchData()
      }
    } catch (error) {
      toast.error('Failed to apply preset')
    }
  }

  const activateFrame = async (frameId: number) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const response = await fetch(`/api/avatar-frames/${frameId}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Frame activated')
        await fetchData()
      }
    } catch (error) {
      toast.error('Failed to activate frame')
    }
  }

  const activateGalleryItem = async (itemId: number) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const response = await fetch(`/api/avatar-gallery/${itemId}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(prev => ({ ...prev, avatarUrl: data.avatarUrl }))
        toast.success('Avatar image updated')
        await fetchData()
      }
    } catch (error) {
      toast.error('Failed to update avatar')
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Badge variant="secondary" className="text-xs">Free</Badge>
      case 'pro':
        return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-xs"><Crown className="h-3 w-3 mr-1" />Pro</Badge>
      case 'team':
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs"><Crown className="h-3 w-3 mr-1" />Team</Badge>
      default:
        return null
    }
  }

  const userName = session?.user?.name || 'User'
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Preview Section */}
      <Card className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <div className="relative">
              <AvatarWithRings
                avatarUrl={preferences.avatarUrl}
                initials={initials}
                userName={userName}
                stats={stats || undefined}
                activeFrame={frames.find(f => f.isActive) || undefined}
                avatarShape={preferences.avatarShape}
                avatarColorScheme={preferences.avatarColorScheme}
                avatarBorderColor={preferences.avatarBorderColor}
                size="xl"
                showRings={true}
                showAchievements={false}
                showStatus={false}
                showFrame={true}
              />
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">Avatar Preview</h2>
              <p className="text-sm text-muted-foreground">
                Customize your avatar with frames, colors, and effects. Premium features unlock more customization options.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-2 block">Shape</Label>
                <div className="flex gap-2">
                  {(['circle', 'rounded', 'square'] as const).map(shape => (
                    <Button
                      key={shape}
                      variant={preferences.avatarShape === shape ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => savePreferences({ avatarShape: shape })}
                      disabled={saving}
                    >
                      {shape}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs mb-2 block">Border Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={preferences.avatarBorderColor}
                    onChange={(e) => setPreferences(prev => ({ ...prev, avatarBorderColor: e.target.value }))}
                    className="h-9 w-20"
                  />
                  <Button
                    size="sm"
                    onClick={() => savePreferences({ avatarBorderColor: preferences.avatarBorderColor })}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Customization Tabs */}
      <Card className="glass-card p-6">
        <Tabs defaultValue="presets" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="presets" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Presets
            </TabsTrigger>
            <TabsTrigger value="frames" className="gap-2">
              <FrameIcon className="h-4 w-4" />
              Frames
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
          </TabsList>

          {/* Presets */}
          <TabsContent value="presets" className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold mb-2">Avatar Presets</h3>
              <p className="text-sm text-muted-foreground">
                Quick-apply complete avatar styles with one click
              </p>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                {presets.map((preset, index) => (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={cn(
                        "p-4 relative overflow-hidden transition-all cursor-pointer",
                        preset.isLocked 
                          ? "opacity-60 bg-muted/50" 
                          : "glass-card hover:shadow-lg"
                      )}
                      onClick={() => !preset.isLocked && activatePreset(preset.id)}
                    >
                      {preset.isLocked && (
                        <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex items-center justify-center z-10">
                          <Lock className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold">
                            {preset.name.slice(0, 2)}
                          </div>
                          {getTierBadge(preset.tier)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">{preset.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {preset.description}
                          </p>
                        </div>
                        {!preset.isLocked && (
                          <Button size="sm" variant="outline" className="w-full">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Apply Preset
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Frames */}
          <TabsContent value="frames" className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold mb-2">Avatar Frames</h3>
              <p className="text-sm text-muted-foreground">
                Add decorative frames around your avatar
              </p>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                {frames.map((frame, index) => (
                  <motion.div
                    key={frame.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={cn(
                        "p-4 relative overflow-hidden transition-all cursor-pointer",
                        !frame.isUnlocked 
                          ? "opacity-60 bg-muted/50" 
                          : frame.isActive
                          ? "glass-card ring-2 ring-primary"
                          : "glass-card hover:shadow-lg"
                      )}
                      onClick={() => frame.isUnlocked && activateFrame(frame.id)}
                    >
                      {!frame.isUnlocked && (
                        <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex items-center justify-center z-10">
                          <Lock className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <FrameIcon className="h-8 w-8 text-primary" />
                          {getTierBadge(frame.tier)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">{frame.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {frame.description}
                          </p>
                        </div>
                        {frame.isActive && (
                          <Badge variant="default" className="w-full justify-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {!frame.isUnlocked && (
                          <p className="text-xs text-muted-foreground">
                            🔒 {frame.unlockRequirement}
                          </p>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Gallery */}
          <TabsContent value="gallery" className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold mb-2">Avatar Gallery</h3>
              <p className="text-sm text-muted-foreground">
                Choose from pre-made avatar images or upload your own
              </p>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pr-4">
                {gallery.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card 
                      className={cn(
                        "p-2 relative overflow-hidden transition-all cursor-pointer aspect-square",
                        !item.isUnlocked 
                          ? "opacity-60 bg-muted/50" 
                          : item.isActive
                          ? "ring-2 ring-primary"
                          : "hover:ring-2 hover:ring-primary/50"
                      )}
                      onClick={() => item.isUnlocked && activateGalleryItem(item.id)}
                    >
                      {!item.isUnlocked && (
                        <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex items-center justify-center z-10">
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded"
                      />
                      {item.isActive && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500 bg-white rounded-full" />
                        </div>
                      )}
                      {getTierBadge(item.tier) && (
                        <div className="absolute bottom-1 left-1">
                          {getTierBadge(item.tier)}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Colors */}
          <TabsContent value="colors" className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold mb-2">Color Schemes</h3>
              <p className="text-sm text-muted-foreground">
                Customize your avatar's color scheme and effects
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['solid', 'gradient', 'rainbow', 'fade'] as const).map(scheme => (
                <Card 
                  key={scheme}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    preferences.avatarColorScheme === scheme
                      ? "ring-2 ring-primary glass-card"
                      : "hover:shadow-lg"
                  )}
                  onClick={() => savePreferences({ avatarColorScheme: scheme })}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold capitalize">{scheme}</h4>
                      {preferences.avatarColorScheme === scheme && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className={cn(
                      "h-16 rounded-lg",
                      scheme === 'solid' && "bg-primary",
                      scheme === 'gradient' && "bg-gradient-to-r from-primary to-purple-500",
                      scheme === 'rainbow' && "bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500",
                      scheme === 'fade' && "bg-gradient-to-r from-primary to-transparent"
                    )} />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
