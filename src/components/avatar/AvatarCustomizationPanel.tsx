"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Crop, 
  Sparkles, 
  Box, 
  Palette,
  RotateCw,
  ZoomIn,
  Move,
  Layers,
  Wand2,
  Image as ImageIcon,
  Copy,
  Undo,
  Redo
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

interface CropSettings {
  zoom: number
  x: number
  y: number
  rotation: number
}

interface Filters {
  brightness: number
  contrast: number
  saturate: number
  blur: number
  hueRotate: number
  grayscale: number
  sepia: number
  invert: number
}

interface BorderEffect {
  type: 'none' | 'pulse' | 'rotate' | 'gradient' | 'glow' | 'rainbow' | 'neon'
  colors: string[]
  width: number
  speed: number
}

interface Effect3D {
  shadow: boolean
  depth: number
  float: boolean
  perspective: number
  tiltX: number
  tiltY: number
}

interface LayerEffect {
  overlay: 'none' | 'vignette' | 'grain' | 'light-leak' | 'bokeh'
  overlayOpacity: number
}

interface AvatarCustomization {
  cropSettings: CropSettings
  filters: Filters
  borderEffect: BorderEffect
  effect3d: Effect3D
  layerEffect: LayerEffect
}

interface Preset {
  name: string
  customization: AvatarCustomization
}

interface AvatarCustomizationPanelProps {
  avatarUrl: string
  onSave?: (customization: AvatarCustomization) => void
  onCancel?: () => void
}

const DEFAULT_CUSTOMIZATION: AvatarCustomization = {
  cropSettings: { zoom: 1, x: 0, y: 0, rotation: 0 },
  filters: { brightness: 100, contrast: 100, saturate: 100, blur: 0, hueRotate: 0, grayscale: 0, sepia: 0, invert: 0 },
  borderEffect: { type: 'none', colors: ['#6366f1'], width: 4, speed: 3 },
  effect3d: { shadow: false, depth: 0, float: false, perspective: 1000, tiltX: 0, tiltY: 0 },
  layerEffect: { overlay: 'none', overlayOpacity: 50 }
}

const PRESETS: Preset[] = [
  {
    name: 'Professional',
    customization: {
      ...DEFAULT_CUSTOMIZATION,
      filters: { ...DEFAULT_CUSTOMIZATION.filters, contrast: 110, saturate: 90 },
      effect3d: { shadow: true, depth: 3, float: false, perspective: 1000, tiltX: 0, tiltY: 0 }
    }
  },
  {
    name: 'Vibrant',
    customization: {
      ...DEFAULT_CUSTOMIZATION,
      filters: { ...DEFAULT_CUSTOMIZATION.filters, saturate: 140, contrast: 115, brightness: 105 },
      borderEffect: { type: 'gradient', colors: ['#6366f1', '#ec4899'], width: 5, speed: 3 }
    }
  },
  {
    name: 'Monochrome',
    customization: {
      ...DEFAULT_CUSTOMIZATION,
      filters: { ...DEFAULT_CUSTOMIZATION.filters, grayscale: 100, contrast: 120 },
      borderEffect: { type: 'pulse', colors: ['#000000'], width: 3, speed: 2 }
    }
  },
  {
    name: 'Vintage',
    customization: {
      ...DEFAULT_CUSTOMIZATION,
      filters: { ...DEFAULT_CUSTOMIZATION.filters, sepia: 80, saturate: 70, brightness: 95 },
      layerEffect: { overlay: 'vignette', overlayOpacity: 60 }
    }
  },
  {
    name: 'Neon',
    customization: {
      ...DEFAULT_CUSTOMIZATION,
      filters: { ...DEFAULT_CUSTOMIZATION.filters, saturate: 150, contrast: 120 },
      borderEffect: { type: 'neon', colors: ['#00ff00', '#ff00ff'], width: 6, speed: 4 },
      effect3d: { shadow: true, depth: 5, float: true, perspective: 1000, tiltX: 0, tiltY: 0 }
    }
  }
]

export function AvatarCustomizationPanel({
  avatarUrl,
  onSave,
  onCancel
}: AvatarCustomizationPanelProps) {
  const [customization, setCustomization] = useState<AvatarCustomization>(DEFAULT_CUSTOMIZATION)
  const [history, setHistory] = useState<AvatarCustomization[]>([DEFAULT_CUSTOMIZATION])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCustomization()
  }, [])

  const fetchCustomization = async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/avatar-customization', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const loaded = {
          cropSettings: data.cropSettings || DEFAULT_CUSTOMIZATION.cropSettings,
          filters: data.filters || DEFAULT_CUSTOMIZATION.filters,
          borderEffect: {
            type: data.borderEffect || 'none',
            colors: data.borderColors || ['#6366f1'],
            width: data.borderWidth || 4,
            speed: data.borderSpeed || 3
          },
          effect3d: data.effect3d || DEFAULT_CUSTOMIZATION.effect3d,
          layerEffect: data.layerEffect || DEFAULT_CUSTOMIZATION.layerEffect
        }
        setCustomization(loaded)
        setHistory([loaded])
      }
    } catch (error) {
      console.error('Failed to fetch customization:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToHistory = (newCustomization: AvatarCustomization) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newCustomization)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setCustomization(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setCustomization(history[historyIndex + 1])
    }
  }

  const handleSave = async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      toast.error('Please sign in to save customization')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/user/avatar-customization', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cropSettings: customization.cropSettings,
          filters: customization.filters,
          borderEffect: customization.borderEffect.type,
          borderColors: customization.borderEffect.colors,
          borderWidth: customization.borderEffect.width,
          borderSpeed: customization.borderEffect.speed,
          effect3d: customization.effect3d,
          layerEffect: customization.layerEffect
        })
      })

      if (response.ok) {
        toast.success('Customization saved!')
        onSave?.(customization)
      } else {
        toast.error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const applyPreset = (preset: Preset) => {
    setCustomization(preset.customization)
    addToHistory(preset.customization)
    toast.success(`Applied ${preset.name} preset`)
  }

  const updateCustomization = (updates: Partial<AvatarCustomization>) => {
    const newCustomization = { ...customization, ...updates }
    setCustomization(newCustomization)
    addToHistory(newCustomization)
  }

  const updateCropSettings = (updates: Partial<CropSettings>) => {
    updateCustomization({ cropSettings: { ...customization.cropSettings, ...updates } })
  }

  const updateFilters = (updates: Partial<Filters>) => {
    updateCustomization({ filters: { ...customization.filters, ...updates } })
  }

  const updateBorderEffect = (updates: Partial<BorderEffect>) => {
    updateCustomization({ borderEffect: { ...customization.borderEffect, ...updates } })
  }

  const updateEffect3D = (updates: Partial<Effect3D>) => {
    updateCustomization({ effect3d: { ...customization.effect3d, ...updates } })
  }

  const updateLayerEffect = (updates: Partial<LayerEffect>) => {
    updateCustomization({ layerEffect: { ...customization.layerEffect, ...updates } })
  }

  const resetToDefault = () => {
    setCustomization(DEFAULT_CUSTOMIZATION)
    addToHistory(DEFAULT_CUSTOMIZATION)
    toast.success('Reset to default')
  }

  const getAvatarStyle = () => {
    const { cropSettings, filters, effect3d } = customization
    
    return {
      transform: `
        scale(${cropSettings.zoom})
        translate(${cropSettings.x}px, ${cropSettings.y}px)
        rotate(${cropSettings.rotation}deg)
        perspective(${effect3d.perspective}px)
        rotateX(${effect3d.tiltX}deg)
        rotateY(${effect3d.tiltY}deg)
        ${effect3d.float ? 'translateY(-4px)' : ''}
      `,
      filter: `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturate}%)
        blur(${filters.blur}px)
        hue-rotate(${filters.hueRotate}deg)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
        invert(${filters.invert}%)
      `,
      boxShadow: effect3d.shadow 
        ? `0 ${effect3d.depth * 2}px ${effect3d.depth * 4}px rgba(0,0,0,0.3)` 
        : 'none'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Preview */}
      <div className="lg:col-span-1 space-y-3">
        <Card className="glass-card p-4">
          <div className="flex flex-col items-center space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</Label>
            <div className="relative">
              <div 
                className="w-28 h-28 rounded-full overflow-hidden border-4 border-border bg-muted transition-all duration-300"
                style={{
                  ...getAvatarStyle(),
                  borderWidth: customization.borderEffect.width
                }}
              >
                {avatarUrl && (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar preview" 
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Overlay effects */}
                {customization.layerEffect.overlay !== 'none' && (
                  <div 
                    className="absolute inset-0"
                    style={{
                      opacity: customization.layerEffect.overlayOpacity / 100,
                      background: customization.layerEffect.overlay === 'vignette' 
                        ? 'radial-gradient(circle, transparent 40%, black 100%)'
                        : customization.layerEffect.overlay === 'grain'
                        ? 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.3\'/%3E%3C/svg%3E")'
                        : 'transparent'
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex === 0}
                className="h-7 text-xs flex-1"
              >
                <Undo className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                className="h-7 text-xs flex-1"
              >
                <Redo className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefault}
                className="h-7 text-xs flex-1"
              >
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Presets */}
        <Card className="glass-card p-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Quick Presets</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="h-7 text-xs"
              >
                <Wand2 className="h-3 w-3 mr-1" />
                {preset.name}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Right: Controls */}
      <div className="lg:col-span-2">
        <Card className="glass-card p-4">
          <Tabs defaultValue="transform" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-8">
              <TabsTrigger value="transform" className="text-xs px-2">
                <Move className="h-3 w-3 mr-1" />
                Transform
              </TabsTrigger>
              <TabsTrigger value="filters" className="text-xs px-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="border" className="text-xs px-2">
                <Palette className="h-3 w-3 mr-1" />
                Border
              </TabsTrigger>
              <TabsTrigger value="3d" className="text-xs px-2">
                <Box className="h-3 w-3 mr-1" />
                3D
              </TabsTrigger>
              <TabsTrigger value="layers" className="text-xs px-2">
                <Layers className="h-3 w-3 mr-1" />
                Layers
              </TabsTrigger>
            </TabsList>

            {/* Transform Tab */}
            <TabsContent value="transform" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Zoom</Label>
                    <span className="text-xs text-muted-foreground">{customization.cropSettings.zoom.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[customization.cropSettings.zoom]}
                    onValueChange={([value]) => updateCropSettings({ zoom: value })}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Rotation</Label>
                    <span className="text-xs text-muted-foreground">{customization.cropSettings.rotation}°</span>
                  </div>
                  <Slider
                    value={[customization.cropSettings.rotation]}
                    onValueChange={([value]) => updateCropSettings({ rotation: value })}
                    min={0}
                    max={360}
                    step={1}
                    className="h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Position X</Label>
                    <span className="text-xs text-muted-foreground">{customization.cropSettings.x}</span>
                  </div>
                  <Slider
                    value={[customization.cropSettings.x]}
                    onValueChange={([value]) => updateCropSettings({ x: value })}
                    min={-50}
                    max={50}
                    step={1}
                    className="h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Position Y</Label>
                    <span className="text-xs text-muted-foreground">{customization.cropSettings.y}</span>
                  </div>
                  <Slider
                    value={[customization.cropSettings.y]}
                    onValueChange={([value]) => updateCropSettings({ y: value })}
                    min={-50}
                    max={50}
                    step={1}
                    className="h-1"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Filters Tab */}
            <TabsContent value="filters" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Brightness</Label>
                    <span className="text-xs text-muted-foreground">{customization.filters.brightness}%</span>
                  </div>
                  <Slider
                    value={[customization.filters.brightness]}
                    onValueChange={([value]) => updateFilters({ brightness: value })}
                    min={0}
                    max={200}
                    step={1}
                    className="h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Contrast</Label>
                    <span className="text-xs text-muted-foreground">{customization.filters.contrast}%</span>
                  </div>
                  <Slider
                    value={[customization.filters.contrast]}
                    onValueChange={([value]) => updateFilters({ contrast: value })}
                    min={0}
                    max={200}
                    step={1}
                    className="h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Saturation</Label>
                    <span className="text-xs text-muted-foreground">{customization.filters.saturate}%</span>
                  </div>
                  <Slider
                    value={[customization.filters.saturate]}
                    onValueChange={([value]) => updateFilters({ saturate: value })}
                    min={0}
                    max={200}
                    step={1}
                    className="h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Blur</Label>
                    <span className="text-xs text-muted-foreground">{customization.filters.blur}px</span>
                  </div>
                  <Slider
                    value={[customization.filters.blur]}
                    onValueChange={([value]) => updateFilters({ blur: value })}
                    min={0}
                    max={10}
                    step={0.5}
                    className="h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Hue Rotate</Label>
                    <span className="text-xs text-muted-foreground">{customization.filters.hueRotate}°</span>
                  </div>
                  <Slider
                    value={[customization.filters.hueRotate]}
                    onValueChange={([value]) => updateFilters({ hueRotate: value })}
                    min={0}
                    max={360}
                    step={1}
                    className="h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Grayscale</Label>
                    <span className="text-xs text-muted-foreground">{customization.filters.grayscale}%</span>
                  </div>
                  <Slider
                    value={[customization.filters.grayscale]}
                    onValueChange={([value]) => updateFilters({ grayscale: value })}
                    min={0}
                    max={100}
                    step={1}
                    className="h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Sepia</Label>
                    <span className="text-xs text-muted-foreground">{customization.filters.sepia}%</span>
                  </div>
                  <Slider
                    value={[customization.filters.sepia]}
                    onValueChange={([value]) => updateFilters({ sepia: value })}
                    min={0}
                    max={100}
                    step={1}
                    className="h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Invert</Label>
                    <span className="text-xs text-muted-foreground">{customization.filters.invert}%</span>
                  </div>
                  <Slider
                    value={[customization.filters.invert]}
                    onValueChange={([value]) => updateFilters({ invert: value })}
                    min={0}
                    max={100}
                    step={1}
                    className="h-1"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Border Tab */}
            <TabsContent value="border" className="space-y-3 mt-3">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Border Style</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['none', 'pulse', 'rotate', 'gradient', 'glow', 'rainbow', 'neon'] as const).map(type => (
                      <Button
                        key={type}
                        variant={customization.borderEffect.type === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateBorderEffect({ type })}
                        className="h-7 text-xs capitalize"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Border Width</Label>
                      <span className="text-xs text-muted-foreground">{customization.borderEffect.width}px</span>
                    </div>
                    <Slider
                      value={[customization.borderEffect.width]}
                      onValueChange={([value]) => updateBorderEffect({ width: value })}
                      min={1}
                      max={10}
                      step={1}
                      className="h-1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Animation Speed</Label>
                      <span className="text-xs text-muted-foreground">{customization.borderEffect.speed}s</span>
                    </div>
                    <Slider
                      value={[customization.borderEffect.speed]}
                      onValueChange={([value]) => updateBorderEffect({ speed: value })}
                      min={1}
                      max={10}
                      step={1}
                      className="h-1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Border Color</Label>
                  <Input
                    type="color"
                    value={customization.borderEffect.colors[0]}
                    onChange={(e) => updateBorderEffect({ colors: [e.target.value] })}
                    className="h-8 w-full"
                  />
                </div>
              </div>
            </TabsContent>

            {/* 3D Tab */}
            <TabsContent value="3d" className="space-y-3 mt-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Drop Shadow</Label>
                  <Switch
                    checked={customization.effect3d.shadow}
                    onCheckedChange={(checked) => updateEffect3D({ shadow: checked })}
                  />
                </div>

                {customization.effect3d.shadow && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Shadow Depth</Label>
                      <span className="text-xs text-muted-foreground">{customization.effect3d.depth}</span>
                    </div>
                    <Slider
                      value={[customization.effect3d.depth]}
                      onValueChange={([value]) => updateEffect3D({ depth: value })}
                      min={0}
                      max={10}
                      step={1}
                      className="h-1"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Float Animation</Label>
                  <Switch
                    checked={customization.effect3d.float}
                    onCheckedChange={(checked) => updateEffect3D({ float: checked })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Tilt X</Label>
                      <span className="text-xs text-muted-foreground">{customization.effect3d.tiltX}°</span>
                    </div>
                    <Slider
                      value={[customization.effect3d.tiltX]}
                      onValueChange={([value]) => updateEffect3D({ tiltX: value })}
                      min={-30}
                      max={30}
                      step={1}
                      className="h-1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Tilt Y</Label>
                      <span className="text-xs text-muted-foreground">{customization.effect3d.tiltY}°</span>
                    </div>
                    <Slider
                      value={[customization.effect3d.tiltY]}
                      onValueChange={([value]) => updateEffect3D({ tiltY: value })}
                      min={-30}
                      max={30}
                      step={1}
                      className="h-1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Perspective</Label>
                    <span className="text-xs text-muted-foreground">{customization.effect3d.perspective}px</span>
                  </div>
                  <Slider
                    value={[customization.effect3d.perspective]}
                    onValueChange={([value]) => updateEffect3D({ perspective: value })}
                    min={500}
                    max={2000}
                    step={100}
                    className="h-1"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Layers Tab */}
            <TabsContent value="layers" className="space-y-3 mt-3">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Overlay Effect</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['none', 'vignette', 'grain', 'light-leak', 'bokeh'] as const).map(type => (
                      <Button
                        key={type}
                        variant={customization.layerEffect.overlay === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateLayerEffect({ overlay: type })}
                        className="h-7 text-xs capitalize"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {customization.layerEffect.overlay !== 'none' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Overlay Opacity</Label>
                      <span className="text-xs text-muted-foreground">{customization.layerEffect.overlayOpacity}%</span>
                    </div>
                    <Slider
                      value={[customization.layerEffect.overlayOpacity]}
                      onValueChange={([value]) => updateLayerEffect({ overlayOpacity: value })}
                      min={0}
                      max={100}
                      step={1}
                      className="h-1"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-8 text-xs"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={saving}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}