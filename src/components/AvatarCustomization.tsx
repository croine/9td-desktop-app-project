"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { 
  Palette, 
  Image as ImageIcon, 
  Frame as FrameIcon,
  Sparkles,
  Crown,
  Lock,
  CheckCircle2,
  Save,
  RotateCw,
  ZoomIn,
  Move,
  Layers,
  Wand2,
  Undo2,
  Redo2,
  RotateCcw,
  Box,
  Sliders
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AvatarWithRings } from '@/components/avatar/AvatarWithRings'
import { StatusPicker } from '@/components/avatar/StatusPicker'
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

interface AdvancedEffects {
  // Transform
  zoom: number
  rotation: number
  positionX: number
  positionY: number
  
  // Filters
  blur: number
  brightness: number
  contrast: number
  saturation: number
  hue: number
  grayscale: number
  sepia: number
  invert: number
  
  // 3D Effects
  shadow: number
  floatEffect: boolean
  tiltX: number
  tiltY: number
  perspective: number
  
  // Border Effects
  borderWidth: number
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double' | 'gradient' | 'rainbow' | 'neon'
  borderAnimationSpeed: number
  
  // Layer Effects
  vignette: number
  grain: number
  lightLeak: number
  bokeh: number
}

const DEFAULT_EFFECTS: AdvancedEffects = {
  zoom: 1,
  rotation: 0,
  positionX: 0,
  positionY: 0,
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  shadow: 0,
  floatEffect: false,
  tiltX: 0,
  tiltY: 0,
  perspective: 1000,
  borderWidth: 4,
  borderStyle: 'solid',
  borderAnimationSpeed: 3,
  vignette: 0,
  grain: 0,
  lightLeak: 0,
  bokeh: 0
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
  const [effects, setEffects] = useState<AdvancedEffects>(DEFAULT_EFFECTS)
  const [history, setHistory] = useState<AdvancedEffects[]>([DEFAULT_EFFECTS])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [achievements, setAchievements] = useState<any[]>([])
  const [status, setStatus] = useState<{ status: 'active' | 'away' | 'busy' | 'offline', customMessage?: string } | null>(null)

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
        toast.success('Avatar saved')
      }
    } catch (error) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const updateEffects = (updates: Partial<AdvancedEffects>) => {
    const newEffects = { ...effects, ...updates }
    setEffects(newEffects)
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newEffects)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setEffects(history[historyIndex - 1])
      toast.info('Undone')
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setEffects(history[historyIndex + 1])
      toast.info('Redone')
    }
  }

  const resetEffects = () => {
    setEffects(DEFAULT_EFFECTS)
    setHistory([DEFAULT_EFFECTS])
    setHistoryIndex(0)
    toast.success('Effects reset')
  }

  const applyQuickPreset = (presetName: string) => {
    const presets: Record<string, Partial<AdvancedEffects>> = {
      professional: { zoom: 1, rotation: 0, brightness: 105, contrast: 105, saturation: 90, shadow: 20 },
      vibrant: { zoom: 1.1, brightness: 110, contrast: 115, saturation: 130, hue: 10, shadow: 30 },
      monochrome: { brightness: 100, contrast: 120, saturation: 0, grayscale: 100, shadow: 15 },
      vintage: { brightness: 95, contrast: 110, saturation: 80, sepia: 40, vignette: 30, grain: 20 },
      neon: { brightness: 120, contrast: 130, saturation: 150, hue: 180, borderStyle: 'neon', shadow: 50 }
    }
    
    if (presets[presetName]) {
      updateEffects({ ...DEFAULT_EFFECTS, ...presets[presetName] })
      toast.success(`${presetName} preset applied`)
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
        toast.success('Preset applied')
        await fetchData()
      }
    } catch (error) {
      toast.error('Failed to apply')
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
      toast.error('Failed to activate')
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
        toast.success('Avatar updated')
        await fetchData()
      }
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const handleStatusChange = async (newStatus: 'active' | 'away' | 'busy' | 'offline', message?: string) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const response = await fetch('/api/user-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          customMessage: message || null
        })
      })

      if (response.ok) {
        setStatus({ status: newStatus, customMessage: message || null })
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Free</Badge>
      case 'pro':
        return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-[10px] px-1.5 py-0"><Crown className="h-2.5 w-2.5 mr-0.5" />Pro</Badge>
      case 'team':
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px] px-1.5 py-0"><Crown className="h-2.5 w-2.5 mr-0.5" />Team</Badge>
      default:
        return null
    }
  }

  const getAvatarStyle = (): React.CSSProperties => {
    return {
      transform: `
        scale(${effects.zoom}) 
        rotate(${effects.rotation}deg) 
        translate(${effects.positionX}px, ${effects.positionY}px)
        rotateX(${effects.tiltX}deg)
        rotateY(${effects.tiltY}deg)
      `,
      filter: `
        blur(${effects.blur}px)
        brightness(${effects.brightness}%)
        contrast(${effects.contrast}%)
        saturate(${effects.saturation}%)
        hue-rotate(${effects.hue}deg)
        grayscale(${effects.grayscale}%)
        sepia(${effects.sepia}%)
        invert(${effects.invert}%)
        drop-shadow(0 ${effects.shadow}px ${effects.shadow * 2}px rgba(0,0,0,0.3))
      `,
      perspective: `${effects.perspective}px`,
      animation: effects.floatEffect ? 'float 3s ease-in-out infinite' : 'none'
    }
  }

  const getOverlayStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: effects.vignette > 0 
        ? `radial-gradient(circle, transparent 50%, rgba(0,0,0,${effects.vignette / 100}) 100%)`
        : 'transparent'
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
    <div className="space-y-4">
      {/* Advanced Preview Section */}
      <Card className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Preview - Left Side (1/3) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Live Preview</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undo}
                  disabled={historyIndex === 0}
                  className="h-7 w-7 p-0"
                  title="Undo"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={redo}
                  disabled={historyIndex === history.length - 1}
                  className="h-7 w-7 p-0"
                  title="Redo"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetEffects}
                  className="h-7 w-7 p-0"
                  title="Reset"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            <div className="relative bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-6 aspect-square flex items-center justify-center overflow-hidden">
              <div style={getOverlayStyle()} />
              <div style={getAvatarStyle()}>
                <AvatarWithRings
                  avatarUrl={preferences.avatarUrl}
                  initials={initials}
                  userName={userName}
                  stats={stats || undefined}
                  achievements={achievements}
                  status={status || undefined}
                  activeFrame={frames.find(f => f.isActive) || undefined}
                  avatarShape={preferences.avatarShape}
                  avatarColorScheme={preferences.avatarColorScheme}
                  avatarBorderColor={preferences.avatarBorderColor}
                  size="lg"
                  showRings={false}
                  showAchievements={false}
                  showStatus={true}
                  showFrame={false}
                />
              </div>
            </div>

            {/* Status Control - NEW */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Avatar Status</Label>
              <StatusPicker
                currentStatus={status?.status || 'active'}
                customMessage={status?.customMessage}
                onStatusChange={handleStatusChange}
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quick Apply</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {['professional', 'vibrant', 'monochrome', 'vintage', 'neon'].map(preset => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickPreset(preset)}
                    className="h-7 text-xs capitalize"
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={() => savePreferences(preferences)}
              disabled={saving}
              className="w-full h-8 text-xs gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Avatar'}
            </Button>
          </div>

          {/* Controls - Right Side (2/3) */}
          <div className="md:col-span-2">
            <Tabs defaultValue="transform" className="space-y-3">
              <TabsList className="w-full justify-start h-8">
                <TabsTrigger value="transform" className="text-xs gap-1 h-7 px-2">
                  <Move className="h-3 w-3" />
                  Transform
                </TabsTrigger>
                <TabsTrigger value="filters" className="text-xs gap-1 h-7 px-2">
                  <Sliders className="h-3 w-3" />
                  Filters
                </TabsTrigger>
                <TabsTrigger value="border" className="text-xs gap-1 h-7 px-2">
                  <Box className="h-3 w-3" />
                  Border
                </TabsTrigger>
                <TabsTrigger value="3d" className="text-xs gap-1 h-7 px-2">
                  <Wand2 className="h-3 w-3" />
                  3D
                </TabsTrigger>
                <TabsTrigger value="layers" className="text-xs gap-1 h-7 px-2">
                  <Layers className="h-3 w-3" />
                  Layers
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[280px]">
                <div className="pr-3">
                  {/* Transform Controls */}
                  <TabsContent value="transform" className="space-y-3 mt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Zoom: {effects.zoom.toFixed(2)}x</Label>
                        <Slider
                          value={[effects.zoom]}
                          onValueChange={([v]) => updateEffects({ zoom: v })}
                          min={0.5}
                          max={2}
                          step={0.05}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Rotation: {effects.rotation}°</Label>
                        <Slider
                          value={[effects.rotation]}
                          onValueChange={([v]) => updateEffects({ rotation: v })}
                          min={-180}
                          max={180}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Position X: {effects.positionX}px</Label>
                        <Slider
                          value={[effects.positionX]}
                          onValueChange={([v]) => updateEffects({ positionX: v })}
                          min={-50}
                          max={50}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Position Y: {effects.positionY}px</Label>
                        <Slider
                          value={[effects.positionY]}
                          onValueChange={([v]) => updateEffects({ positionY: v })}
                          min={-50}
                          max={50}
                          step={1}
                          className="h-1"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Filter Controls */}
                  <TabsContent value="filters" className="space-y-3 mt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Blur: {effects.blur}px</Label>
                        <Slider
                          value={[effects.blur]}
                          onValueChange={([v]) => updateEffects({ blur: v })}
                          min={0}
                          max={10}
                          step={0.5}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Brightness: {effects.brightness}%</Label>
                        <Slider
                          value={[effects.brightness]}
                          onValueChange={([v]) => updateEffects({ brightness: v })}
                          min={50}
                          max={150}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Contrast: {effects.contrast}%</Label>
                        <Slider
                          value={[effects.contrast]}
                          onValueChange={([v]) => updateEffects({ contrast: v })}
                          min={50}
                          max={150}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Saturation: {effects.saturation}%</Label>
                        <Slider
                          value={[effects.saturation]}
                          onValueChange={([v]) => updateEffects({ saturation: v })}
                          min={0}
                          max={200}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Hue: {effects.hue}°</Label>
                        <Slider
                          value={[effects.hue]}
                          onValueChange={([v]) => updateEffects({ hue: v })}
                          min={0}
                          max={360}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Grayscale: {effects.grayscale}%</Label>
                        <Slider
                          value={[effects.grayscale]}
                          onValueChange={([v]) => updateEffects({ grayscale: v })}
                          min={0}
                          max={100}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Sepia: {effects.sepia}%</Label>
                        <Slider
                          value={[effects.sepia]}
                          onValueChange={([v]) => updateEffects({ sepia: v })}
                          min={0}
                          max={100}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Invert: {effects.invert}%</Label>
                        <Slider
                          value={[effects.invert]}
                          onValueChange={([v]) => updateEffects({ invert: v })}
                          min={0}
                          max={100}
                          step={1}
                          className="h-1"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Border Controls */}
                  <TabsContent value="border" className="space-y-3 mt-0">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Border Style</Label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['solid', 'dashed', 'dotted', 'double', 'gradient', 'rainbow', 'neon'] as const).map(style => (
                            <Button
                              key={style}
                              variant={effects.borderStyle === style ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateEffects({ borderStyle: style })}
                              className="h-7 text-[10px] capitalize px-2"
                            >
                              {style}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Border Width: {effects.borderWidth}px</Label>
                          <Slider
                            value={[effects.borderWidth]}
                            onValueChange={([v]) => updateEffects({ borderWidth: v })}
                            min={1}
                            max={10}
                            step={1}
                            className="h-1"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Animation Speed: {effects.borderAnimationSpeed}s</Label>
                          <Slider
                            value={[effects.borderAnimationSpeed]}
                            onValueChange={([v]) => updateEffects({ borderAnimationSpeed: v })}
                            min={1}
                            max={10}
                            step={0.5}
                            className="h-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs">Border Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={preferences.avatarBorderColor}
                            onChange={(e) => setPreferences(prev => ({ ...prev, avatarBorderColor: e.target.value }))}
                            className="h-8 w-20"
                          />
                          <Input
                            type="text"
                            value={preferences.avatarBorderColor}
                            onChange={(e) => setPreferences(prev => ({ ...prev, avatarBorderColor: e.target.value }))}
                            className="h-8 flex-1 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* 3D Effects Controls */}
                  <TabsContent value="3d" className="space-y-3 mt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Shadow: {effects.shadow}px</Label>
                        <Slider
                          value={[effects.shadow]}
                          onValueChange={([v]) => updateEffects({ shadow: v })}
                          min={0}
                          max={50}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Perspective: {effects.perspective}px</Label>
                        <Slider
                          value={[effects.perspective]}
                          onValueChange={([v]) => updateEffects({ perspective: v })}
                          min={500}
                          max={2000}
                          step={50}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tilt X: {effects.tiltX}°</Label>
                        <Slider
                          value={[effects.tiltX]}
                          onValueChange={([v]) => updateEffects({ tiltX: v })}
                          min={-45}
                          max={45}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tilt Y: {effects.tiltY}°</Label>
                        <Slider
                          value={[effects.tiltY]}
                          onValueChange={([v]) => updateEffects({ tiltY: v })}
                          min={-45}
                          max={45}
                          step={1}
                          className="h-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Float Animation</Label>
                      <Button
                        variant={effects.floatEffect ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateEffects({ floatEffect: !effects.floatEffect })}
                        className="h-7 text-xs w-full"
                      >
                        {effects.floatEffect ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Layer Effects Controls */}
                  <TabsContent value="layers" className="space-y-3 mt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Vignette: {effects.vignette}%</Label>
                        <Slider
                          value={[effects.vignette]}
                          onValueChange={([v]) => updateEffects({ vignette: v })}
                          min={0}
                          max={100}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Grain: {effects.grain}%</Label>
                        <Slider
                          value={[effects.grain]}
                          onValueChange={([v]) => updateEffects({ grain: v })}
                          min={0}
                          max={100}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Light Leak: {effects.lightLeak}%</Label>
                        <Slider
                          value={[effects.lightLeak]}
                          onValueChange={([v]) => updateEffects({ lightLeak: v })}
                          min={0}
                          max={100}
                          step={1}
                          className="h-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Bokeh: {effects.bokeh}%</Label>
                        <Slider
                          value={[effects.bokeh]}
                          onValueChange={([v]) => updateEffects({ bokeh: v })}
                          min={0}
                          max={100}
                          step={1}
                          className="h-1"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </Card>

      {/* Existing Tabs - More Compact */}
      <Card className="glass-card p-4">
        <Tabs defaultValue="presets" className="space-y-4">
          <TabsList className="w-full justify-start h-8">
            <TabsTrigger value="presets" className="gap-1.5 text-xs h-7 px-2.5">
              <Sparkles className="h-3 w-3" />
              Presets
            </TabsTrigger>
            <TabsTrigger value="frames" className="gap-1.5 text-xs h-7 px-2.5">
              <FrameIcon className="h-3 w-3" />
              Frames
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-1.5 text-xs h-7 px-2.5">
              <ImageIcon className="h-3 w-3" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="shapes" className="gap-1.5 text-xs h-7 px-2.5">
              <Palette className="h-3 w-3" />
              Shapes
            </TabsTrigger>
          </TabsList>

          {/* Presets */}
          <TabsContent value="presets" className="space-y-3">
            <div>
              <h3 className="font-display text-sm font-semibold mb-1">Avatar Presets</h3>
              <p className="text-xs text-muted-foreground">
                Quick-apply complete avatar styles
              </p>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pr-3">
                {presets.map((preset, index) => (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card 
                      className={cn(
                        "p-2.5 relative overflow-hidden transition-all cursor-pointer",
                        preset.isLocked 
                          ? "opacity-60 bg-muted/50" 
                          : "glass-card hover:shadow-lg"
                      )}
                      onClick={() => !preset.isLocked && activatePreset(preset.id)}
                    >
                      {preset.isLocked && (
                        <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex items-center justify-center z-10">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {preset.name.slice(0, 2)}
                          </div>
                          {getTierBadge(preset.tier)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs mb-0.5 line-clamp-1">{preset.name}</h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Frames */}
          <TabsContent value="frames" className="space-y-3">
            <div>
              <h3 className="font-display text-sm font-semibold mb-1">Avatar Frames</h3>
              <p className="text-xs text-muted-foreground">
                Decorative frames around your avatar
              </p>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pr-3">
                {frames.map((frame, index) => (
                  <motion.div
                    key={frame.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card 
                      className={cn(
                        "p-2.5 relative overflow-hidden transition-all cursor-pointer",
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
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <FrameIcon className="h-6 w-6 text-primary" />
                          {getTierBadge(frame.tier)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs mb-0.5 line-clamp-1">{frame.name}</h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">
                            {frame.description}
                          </p>
                        </div>
                        {frame.isActive && (
                          <Badge variant="default" className="w-full justify-center text-[10px] h-5">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Gallery */}
          <TabsContent value="gallery" className="space-y-3">
            <div>
              <h3 className="font-display text-sm font-semibold mb-1">Avatar Gallery</h3>
              <p className="text-xs text-muted-foreground">
                Choose from pre-made avatar images
              </p>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 pr-3">
                {gallery.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card 
                      className={cn(
                        "p-1 relative overflow-hidden transition-all cursor-pointer aspect-square",
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
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded"
                      />
                      {item.isActive && (
                        <div className="absolute top-0.5 right-0.5">
                          <CheckCircle2 className="h-3 w-3 text-green-500 bg-white rounded-full" />
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Shapes & Colors */}
          <TabsContent value="shapes" className="space-y-3">
            <div>
              <h3 className="font-display text-sm font-semibold mb-1">Avatar Shape</h3>
              <p className="text-xs text-muted-foreground">
                Choose your avatar shape
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['circle', 'rounded', 'square'] as const).map(shape => (
                <Button
                  key={shape}
                  variant={preferences.avatarShape === shape ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => savePreferences({ avatarShape: shape })}
                  disabled={saving}
                  className="h-8 text-xs capitalize"
                >
                  {shape}
                </Button>
              ))}
            </div>

            <div className="pt-2">
              <h3 className="font-display text-sm font-semibold mb-1">Color Scheme</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Select your avatar's color scheme
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['solid', 'gradient', 'rainbow', 'fade'] as const).map(scheme => (
                  <Card 
                    key={scheme}
                    className={cn(
                      "p-2.5 cursor-pointer transition-all",
                      preferences.avatarColorScheme === scheme
                        ? "ring-2 ring-primary glass-card"
                        : "hover:shadow-lg"
                    )}
                    onClick={() => savePreferences({ avatarColorScheme: scheme })}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold capitalize text-xs">{scheme}</h4>
                        {preferences.avatarColorScheme === scheme && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div className={cn(
                        "h-10 rounded",
                        scheme === 'solid' && "bg-primary",
                        scheme === 'gradient' && "bg-gradient-to-r from-primary to-purple-500",
                        scheme === 'rainbow' && "bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500",
                        scheme === 'fade' && "bg-gradient-to-r from-primary to-transparent"
                      )} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}