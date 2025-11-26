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
  Move
} from 'lucide-react'

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
}

interface BorderEffect {
  type: 'none' | 'pulse' | 'rotate' | 'gradient' | 'glow'
  colors: string[]
}

interface Effect3D {
  shadow: boolean
  depth: number
  float: boolean
}

interface AvatarCustomization {
  cropSettings: CropSettings
  filters: Filters
  borderEffect: BorderEffect
  effect3d: Effect3D
}

interface AvatarCustomizationPanelProps {
  avatarUrl: string
  onSave?: (customization: AvatarCustomization) => void
  onCancel?: () => void
}

const DEFAULT_CUSTOMIZATION: AvatarCustomization = {
  cropSettings: { zoom: 1, x: 0, y: 0, rotation: 0 },
  filters: { brightness: 100, contrast: 100, saturate: 100, blur: 0 },
  borderEffect: { type: 'none', colors: ['#6366f1'] },
  effect3d: { shadow: false, depth: 0, float: false }
}

export function AvatarCustomizationPanel({
  avatarUrl,
  onSave,
  onCancel
}: AvatarCustomizationPanelProps) {
  const [customization, setCustomization] = useState<AvatarCustomization>(DEFAULT_CUSTOMIZATION)
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
        setCustomization({
          cropSettings: data.cropSettings || DEFAULT_CUSTOMIZATION.cropSettings,
          filters: data.filters || DEFAULT_CUSTOMIZATION.filters,
          borderEffect: {
            type: data.borderEffect || 'none',
            colors: data.borderColors || ['#6366f1']
          },
          effect3d: data.effect3d || DEFAULT_CUSTOMIZATION.effect3d
        })
      }
    } catch (error) {
      console.error('Failed to fetch customization:', error)
    } finally {
      setLoading(false)
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
          effect3d: customization.effect3d
        })
      })

      if (response.ok) {
        toast.success('Customization saved successfully!')
        onSave?.(customization)
      } else {
        toast.error('Failed to save customization')
      }
    } catch (error) {
      console.error('Failed to save customization:', error)
      toast.error('Failed to save customization')
    } finally {
      setSaving(false)
    }
  }

  const updateCropSettings = (updates: Partial<CropSettings>) => {
    setCustomization(prev => ({
      ...prev,
      cropSettings: { ...prev.cropSettings, ...updates }
    }))
  }

  const updateFilters = (updates: Partial<Filters>) => {
    setCustomization(prev => ({
      ...prev,
      filters: { ...prev.filters, ...updates }
    }))
  }

  const updateBorderEffect = (type: BorderEffect['type']) => {
    setCustomization(prev => ({
      ...prev,
      borderEffect: { ...prev.borderEffect, type }
    }))
  }

  const updateEffect3D = (updates: Partial<Effect3D>) => {
    setCustomization(prev => ({
      ...prev,
      effect3d: { ...prev.effect3d, ...updates }
    }))
  }

  const getAvatarStyle = () => {
    const { cropSettings, filters, effect3d } = customization
    
    return {
      transform: `
        scale(${cropSettings.zoom})
        translate(${cropSettings.x}px, ${cropSettings.y}px)
        rotate(${cropSettings.rotation}deg)
        ${effect3d.float ? 'translateY(-4px)' : ''}
      `,
      filter: `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturate}%)
        blur(${filters.blur}px)
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
    <div className="space-y-6">
      {/* Preview */}
      <div className="flex justify-center">
        <div className="relative">
          <div 
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-border bg-muted"
            style={getAvatarStyle()}
          >
            {avatarUrl && (
              <img 
                src={avatarUrl} 
                alt="Avatar preview" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>

      {/* Customization Tabs */}
      <Tabs defaultValue="crop" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="crop" className="gap-2">
            <Crop className="h-4 w-4" />
            Crop
          </TabsTrigger>
          <TabsTrigger value="filters" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="border" className="gap-2">
            <Palette className="h-4 w-4" />
            Border
          </TabsTrigger>
          <TabsTrigger value="3d" className="gap-2">
            <Box className="h-4 w-4" />
            3D
          </TabsTrigger>
        </TabsList>

        {/* Crop Tab */}
        <TabsContent value="crop" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </Label>
                <span className="text-sm text-muted-foreground">
                  {customization.cropSettings.zoom.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[customization.cropSettings.zoom]}
                onValueChange={([value]) => updateCropSettings({ zoom: value })}
                min={0.5}
                max={3}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  Position X
                </Label>
                <span className="text-sm text-muted-foreground">
                  {customization.cropSettings.x}px
                </span>
              </div>
              <Slider
                value={[customization.cropSettings.x]}
                onValueChange={([value]) => updateCropSettings({ x: value })}
                min={-50}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  Position Y
                </Label>
                <span className="text-sm text-muted-foreground">
                  {customization.cropSettings.y}px
                </span>
              </div>
              <Slider
                value={[customization.cropSettings.y]}
                onValueChange={([value]) => updateCropSettings({ y: value })}
                min={-50}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Rotation
                </Label>
                <span className="text-sm text-muted-foreground">
                  {customization.cropSettings.rotation}°
                </span>
              </div>
              <Slider
                value={[customization.cropSettings.rotation]}
                onValueChange={([value]) => updateCropSettings({ rotation: value })}
                min={0}
                max={360}
                step={1}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Filters Tab */}
        <TabsContent value="filters" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Brightness</Label>
                <span className="text-sm text-muted-foreground">
                  {customization.filters.brightness}%
                </span>
              </div>
              <Slider
                value={[customization.filters.brightness]}
                onValueChange={([value]) => updateFilters({ brightness: value })}
                min={0}
                max={200}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contrast</Label>
                <span className="text-sm text-muted-foreground">
                  {customization.filters.contrast}%
                </span>
              </div>
              <Slider
                value={[customization.filters.contrast]}
                onValueChange={([value]) => updateFilters({ contrast: value })}
                min={0}
                max={200}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Saturation</Label>
                <span className="text-sm text-muted-foreground">
                  {customization.filters.saturate}%
                </span>
              </div>
              <Slider
                value={[customization.filters.saturate]}
                onValueChange={([value]) => updateFilters({ saturate: value })}
                min={0}
                max={200}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Blur</Label>
                <span className="text-sm text-muted-foreground">
                  {customization.filters.blur}px
                </span>
              </div>
              <Slider
                value={[customization.filters.blur]}
                onValueChange={([value]) => updateFilters({ blur: value })}
                min={0}
                max={10}
                step={0.5}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Border Tab */}
        <TabsContent value="border" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Border Effect</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['none', 'pulse', 'rotate', 'gradient', 'glow'] as const).map(type => (
                  <Button
                    key={type}
                    variant={customization.borderEffect.type === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateBorderEffect(type)}
                    className="capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 3D Tab */}
        <TabsContent value="3d" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Drop Shadow</Label>
              <Button
                variant={customization.effect3d.shadow ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEffect3D({ shadow: !customization.effect3d.shadow })}
              >
                {customization.effect3d.shadow ? 'On' : 'Off'}
              </Button>
            </div>

            {customization.effect3d.shadow && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Shadow Depth</Label>
                  <span className="text-sm text-muted-foreground">
                    {customization.effect3d.depth}
                  </span>
                </div>
                <Slider
                  value={[customization.effect3d.depth]}
                  onValueChange={([value]) => updateEffect3D({ depth: value })}
                  min={0}
                  max={10}
                  step={1}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Float Effect</Label>
              <Button
                variant={customization.effect3d.float ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEffect3D({ float: !customization.effect3d.float })}
              >
                {customization.effect3d.float ? 'On' : 'Off'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Save Customization'}
        </Button>
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
