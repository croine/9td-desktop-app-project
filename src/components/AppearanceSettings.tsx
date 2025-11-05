"use client"

import { AppSettings, AnimationType } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Moon, 
  Sun, 
  Monitor, 
  Grid, 
  List,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Flame,
  Zap,
  Calendar,
  BarChart3,
  TrendingUp,
  Sparkles,
  Type,
  Paintbrush,
  Move,
  Save,
  Wand2,
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useState, useEffect } from 'react'

interface AppearanceSettingsProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

const iconLabels = {
  totalTasks: { label: 'Total Tasks', icon: Target },
  completed: { label: 'Completed', icon: CheckCircle2 },
  inProgress: { label: 'In Progress', icon: Clock },
  overdue: { label: 'Overdue', icon: AlertCircle },
  streak: { label: 'Streak', icon: Flame },
  todayFocus: { label: "Today's Focus", icon: Zap },
  calendar: { label: 'Calendar', icon: Calendar },
  needsAttention: { label: 'Needs Attention', icon: AlertCircle },
  weeklyChart: { label: 'Weekly Chart', icon: BarChart3 },
  completionRate: { label: 'Completion Rate', icon: TrendingUp },
}

const animationOptions: { value: AnimationType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'float', label: 'Float' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'scale', label: 'Scale' },
  { value: 'glow', label: 'Glow' },
  { value: 'shake', label: 'Shake' },
]

export function AppearanceSettings({ 
  settings, 
  onSettingsChange,
}: AppearanceSettingsProps) {
  const { setTheme } = useTheme()
  
  // Local state for title settings to prevent lag
  const [titleSettings, setTitleSettings] = useState({
    dashboardTitle: settings.dashboardTitle,
    titlePosition: settings.titlePosition,
    titleSize: settings.titleSize,
    titleFont: settings.titleFont,
    titleColor: settings.titleColor,
    titleBold: settings.titleBold,
    titleItalic: settings.titleItalic,
    titleShadow: settings.titleShadow,
    titleOutline: settings.titleOutline,
    titleOutlineColor: settings.titleOutlineColor,
    titleUnderline: settings.titleUnderline || false,
    titleUppercase: settings.titleUppercase || false,
    titleLetterSpacing: settings.titleLetterSpacing || 0,
    titleBackgroundColor: settings.titleBackgroundColor || 'transparent',
    titlePadding: settings.titlePadding || 0,
    titleBorderRadius: settings.titleBorderRadius || 0,
    titleRotation: settings.titleRotation || 0,
  })
  
  const [hasUnsavedTitleChanges, setHasUnsavedTitleChanges] = useState(false)

  // Update local state when settings prop changes from outside
  useEffect(() => {
    setTitleSettings({
      dashboardTitle: settings.dashboardTitle,
      titlePosition: settings.titlePosition,
      titleSize: settings.titleSize,
      titleFont: settings.titleFont,
      titleColor: settings.titleColor,
      titleBold: settings.titleBold,
      titleItalic: settings.titleItalic,
      titleShadow: settings.titleShadow,
      titleOutline: settings.titleOutline,
      titleOutlineColor: settings.titleOutlineColor,
      titleUnderline: settings.titleUnderline || false,
      titleUppercase: settings.titleUppercase || false,
      titleLetterSpacing: settings.titleLetterSpacing || 0,
      titleBackgroundColor: settings.titleBackgroundColor || 'transparent',
      titlePadding: settings.titlePadding || 0,
      titleBorderRadius: settings.titleBorderRadius || 0,
      titleRotation: settings.titleRotation || 0,
    })
  }, [settings])

  const handleChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    onSettingsChange(newSettings)
    
    if (key === 'theme') {
      setTheme(value)
    }
    
    toast.success('Settings updated successfully')
  }

  // Handle title setting changes locally without saving
  const handleTitleSettingChange = (key: keyof typeof titleSettings, value: any) => {
    setTitleSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedTitleChanges(true)
  }

  // Save all title changes at once
  const handleSaveTitleSettings = () => {
    const newSettings = { ...settings, ...titleSettings }
    onSettingsChange(newSettings)
    setHasUnsavedTitleChanges(false)
    toast.success('Dashboard title settings saved!')
  }

  // Apply preset styles
  const applyPreset = (presetName: string) => {
    const presets = {
      default: {
        titleSize: 'sm' as const,
        titleFont: 'display' as const,
        titleColor: '#8b5cf6',
        titleBold: true,
        titleItalic: false,
        titleShadow: false,
        titleOutline: false,
        titleUnderline: false,
        titleUppercase: false,
        titleLetterSpacing: 0,
        titleBackgroundColor: 'transparent',
        titlePadding: 0,
        titleBorderRadius: 0,
        titleRotation: 0,
      },
      elegant: {
        titleSize: 'lg' as const,
        titleFont: 'serif' as const,
        titleColor: '#1e293b',
        titleBold: false,
        titleItalic: true,
        titleShadow: false,
        titleOutline: false,
        titleUnderline: false,
        titleUppercase: false,
        titleLetterSpacing: 2,
        titleBackgroundColor: 'transparent',
        titlePadding: 0,
        titleBorderRadius: 0,
        titleRotation: 0,
      },
      bold: {
        titleSize: 'xl' as const,
        titleFont: 'display' as const,
        titleColor: '#000000',
        titleBold: true,
        titleItalic: false,
        titleShadow: true,
        titleOutline: false,
        titleUnderline: false,
        titleUppercase: true,
        titleLetterSpacing: 3,
        titleBackgroundColor: 'transparent',
        titlePadding: 0,
        titleBorderRadius: 0,
        titleRotation: 0,
      },
      modern: {
        titleSize: 'base' as const,
        titleFont: 'sans' as const,
        titleColor: '#6366f1',
        titleBold: true,
        titleItalic: false,
        titleShadow: false,
        titleOutline: false,
        titleUnderline: true,
        titleUppercase: false,
        titleLetterSpacing: 1,
        titleBackgroundColor: 'rgba(99, 102, 241, 0.1)',
        titlePadding: 8,
        titleBorderRadius: 8,
        titleRotation: 0,
      },
      playful: {
        titleSize: 'lg' as const,
        titleFont: 'display' as const,
        titleColor: '#f59e0b',
        titleBold: true,
        titleItalic: false,
        titleShadow: true,
        titleOutline: true,
        titleOutlineColor: '#ffffff',
        titleUnderline: false,
        titleUppercase: false,
        titleLetterSpacing: 0,
        titleBackgroundColor: 'transparent',
        titlePadding: 0,
        titleBorderRadius: 0,
        titleRotation: -2,
      },
      minimal: {
        titleSize: 'sm' as const,
        titleFont: 'sans' as const,
        titleColor: '#64748b',
        titleBold: false,
        titleItalic: false,
        titleShadow: false,
        titleOutline: false,
        titleUnderline: false,
        titleUppercase: true,
        titleLetterSpacing: 4,
        titleBackgroundColor: 'transparent',
        titlePadding: 0,
        titleBorderRadius: 0,
        titleRotation: 0,
      }
    }

    const preset = presets[presetName as keyof typeof presets]
    if (preset) {
      setTitleSettings(prev => ({ ...prev, ...preset }))
      setHasUnsavedTitleChanges(true)
      toast.success(`Applied ${presetName} preset!`)
    }
  }

  // Reset all title settings to defaults
  const resetAllTitleSettings = () => {
    const defaultSettings = {
      dashboardTitle: 'Professional Task Dashboard',
      titlePosition: 50,
      titleSize: 'sm' as const,
      titleFont: 'display' as const,
      titleColor: '#8b5cf6',
      titleBold: true,
      titleItalic: false,
      titleShadow: false,
      titleOutline: false,
      titleOutlineColor: '#000000',
      titleUnderline: false,
      titleUppercase: false,
      titleLetterSpacing: 0,
      titleBackgroundColor: 'transparent',
      titlePadding: 0,
      titleBorderRadius: 0,
      titleRotation: 0,
    }
    
    setTitleSettings(defaultSettings)
    setHasUnsavedTitleChanges(true)
    toast.success('All title settings reset to default!')
  }

  const handleAnimationMasterToggle = (enabled: boolean) => {
    const newSettings = {
      ...settings,
      animationSettings: {
        ...settings.animationSettings,
        masterEnabled: enabled
      }
    }
    onSettingsChange(newSettings)
    toast.success(enabled ? 'Animations enabled' : 'Animations disabled')
  }

  const handleIconAnimationToggle = (iconKey: keyof typeof settings.animationSettings.icons, enabled: boolean) => {
    const newSettings = {
      ...settings,
      animationSettings: {
        ...settings.animationSettings,
        icons: {
          ...settings.animationSettings.icons,
          [iconKey]: {
            ...settings.animationSettings.icons[iconKey],
            enabled
          }
        }
      }
    }
    onSettingsChange(newSettings)
    toast.success(`${iconLabels[iconKey].label} animation ${enabled ? 'enabled' : 'disabled'}`)
  }

  const handleIconAnimationTypeChange = (iconKey: keyof typeof settings.animationSettings.icons, animation: AnimationType) => {
    const newSettings = {
      ...settings,
      animationSettings: {
        ...settings.animationSettings,
        icons: {
          ...settings.animationSettings.icons,
          [iconKey]: {
            ...settings.animationSettings.icons[iconKey],
            animation
          }
        }
      }
    }
    onSettingsChange(newSettings)
    toast.success(`${iconLabels[iconKey].label} animation updated`)
  }

  return (
    <div className="space-y-6">
      {/* Theme & Display */}
      <Card className="glass-card p-6">
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold mb-1">Theme & Display</h2>
            <p className="text-sm text-muted-foreground">
              Customize how the app looks and feels
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color theme
                </p>
              </div>
              <Select
                value={settings.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => handleChange('theme', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>System</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-logo" className="text-base font-medium">
                  Show Logo
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display animated logo in header
                </p>
              </div>
              <Switch
                id="show-logo"
                checked={settings.showLogo}
                onCheckedChange={(checked) => handleChange('showLogo', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Default View</Label>
                <p className="text-sm text-muted-foreground">
                  How tasks are displayed by default
                </p>
              </div>
              <Select
                value={settings.defaultView}
                onValueChange={(value: 'grid' | 'list') => handleChange('defaultView', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">
                    <div className="flex items-center gap-2">
                      <Grid className="h-4 w-4" />
                      <span>Grid View</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="list">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      <span>List View</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="compact-mode" className="text-base font-medium">
                  Compact Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show more tasks in less space
                </p>
              </div>
              <Switch
                id="compact-mode"
                checked={settings.compactMode}
                onCheckedChange={(checked) => handleChange('compactMode', checked)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Dashboard Title Customization */}
      <Card className="glass-card p-6">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold mb-1 flex items-center gap-2">
                <Type className="h-5 w-5" />
                Dashboard Title
                {hasUnsavedTitleChanges && (
                  <Badge variant="secondary" className="text-xs animate-pulse">
                    Unsaved Changes
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                Customize the dashboard title text and appearance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="show-title" className="text-sm font-medium">
                Show Title
              </Label>
              <Switch
                id="show-title"
                checked={settings.showTitle}
                onCheckedChange={(checked) => handleChange('showTitle', checked)}
              />
            </div>
          </div>

          {!settings.showTitle && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground text-center">
                ⚠️ Dashboard title is currently hidden. Enable the toggle to display it.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Style Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Quick Style Presets
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllTitleSettings}
                  className="text-xs gap-1 text-amber-600 hover:text-amber-700 dark:text-amber-500"
                >
                  🔄 Reset All
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('default')}
                  className="text-xs"
                >
                  🔄 Default
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('elegant')}
                  className="text-xs"
                >
                  ✨ Elegant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('bold')}
                  className="text-xs"
                >
                  💪 Bold
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('modern')}
                  className="text-xs"
                >
                  🎨 Modern
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('playful')}
                  className="text-xs"
                >
                  🎉 Playful
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('minimal')}
                  className="text-xs"
                >
                  ⚡ Minimal
                </Button>
              </div>
            </div>

            {/* Basic Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dashboard-title" className="text-base font-medium">
                  Title Text
                </Label>
                <Input
                  id="dashboard-title"
                  value={titleSettings.dashboardTitle}
                  onChange={(e) => handleTitleSettingChange('dashboardTitle', e.target.value)}
                  placeholder="Professional Task Dashboard"
                  className="max-w-md"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title-position" className="text-base font-medium flex items-center gap-2">
                    <Move className="h-4 w-4" />
                    Title Position
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    {titleSettings.titlePosition}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <input
                    id="title-position"
                    type="range"
                    min="0"
                    max="100"
                    value={titleSettings.titlePosition}
                    onChange={(e) => handleTitleSettingChange('titlePosition', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>← Left</span>
                    <span>Center</span>
                    <span>Right →</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Text Size</Label>
                  <Select
                    value={titleSettings.titleSize}
                    onValueChange={(value: AppSettings['titleSize']) => handleTitleSettingChange('titleSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xs">Extra Small (xs)</SelectItem>
                      <SelectItem value="sm">Small (sm)</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="lg">Large (lg)</SelectItem>
                      <SelectItem value="xl">Extra Large (xl)</SelectItem>
                      <SelectItem value="2xl">2X Large (2xl)</SelectItem>
                      <SelectItem value="3xl">3X Large (3xl)</SelectItem>
                      <SelectItem value="4xl">4X Large (4xl)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Font Family</Label>
                  <Select
                    value={titleSettings.titleFont}
                    onValueChange={(value: AppSettings['titleFont']) => handleTitleSettingChange('titleFont', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Sans Serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="mono">Monospace</SelectItem>
                      <SelectItem value="display">Display</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Color Settings */}
            <div className="space-y-4">
              <h3 className="text-base font-medium flex items-center gap-2">
                <Paintbrush className="h-4 w-4" />
                Colors
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title-color" className="text-sm font-medium">
                    Text Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="title-color"
                      type="color"
                      value={titleSettings.titleColor}
                      onChange={(e) => handleTitleSettingChange('titleColor', e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={titleSettings.titleColor}
                      onChange={(e) => handleTitleSettingChange('titleColor', e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bg-color" className="text-sm font-medium">
                    Background Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="bg-color"
                      type="color"
                      value={titleSettings.titleBackgroundColor === 'transparent' ? '#ffffff' : titleSettings.titleBackgroundColor}
                      onChange={(e) => handleTitleSettingChange('titleBackgroundColor', e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={titleSettings.titleBackgroundColor}
                      onChange={(e) => handleTitleSettingChange('titleBackgroundColor', e.target.value)}
                      placeholder="transparent"
                      className="flex-1"
                    />
                  </div>
                </div>

                {titleSettings.titleOutline && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="outline-color" className="text-sm font-medium">
                      Outline Color
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="outline-color"
                        type="color"
                        value={titleSettings.titleOutlineColor}
                        onChange={(e) => handleTitleSettingChange('titleOutlineColor', e.target.value)}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={titleSettings.titleOutlineColor}
                        onChange={(e) => handleTitleSettingChange('titleOutlineColor', e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Text Effects */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Text Effects</Label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="title-bold" className="text-sm font-medium">
                    Bold
                  </Label>
                  <Switch
                    id="title-bold"
                    checked={titleSettings.titleBold}
                    onCheckedChange={(checked) => handleTitleSettingChange('titleBold', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="title-italic" className="text-sm font-medium">
                    Italic
                  </Label>
                  <Switch
                    id="title-italic"
                    checked={titleSettings.titleItalic}
                    onCheckedChange={(checked) => handleTitleSettingChange('titleItalic', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="title-shadow" className="text-sm font-medium">
                    Shadow
                  </Label>
                  <Switch
                    id="title-shadow"
                    checked={titleSettings.titleShadow}
                    onCheckedChange={(checked) => handleTitleSettingChange('titleShadow', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="title-outline" className="text-sm font-medium">
                    Outline
                  </Label>
                  <Switch
                    id="title-outline"
                    checked={titleSettings.titleOutline}
                    onCheckedChange={(checked) => handleTitleSettingChange('titleOutline', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="title-underline" className="text-sm font-medium">
                    Underline
                  </Label>
                  <Switch
                    id="title-underline"
                    checked={titleSettings.titleUnderline}
                    onCheckedChange={(checked) => handleTitleSettingChange('titleUnderline', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="title-uppercase" className="text-sm font-medium">
                    Uppercase
                  </Label>
                  <Switch
                    id="title-uppercase"
                    checked={titleSettings.titleUppercase}
                    onCheckedChange={(checked) => handleTitleSettingChange('titleUppercase', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Advanced Settings</Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Letter Spacing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="letter-spacing" className="text-sm font-medium">
                      Letter Spacing
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {titleSettings.titleLetterSpacing}px
                    </Badge>
                  </div>
                  <input
                    id="letter-spacing"
                    type="range"
                    min="-2"
                    max="10"
                    value={titleSettings.titleLetterSpacing}
                    onChange={(e) => handleTitleSettingChange('titleLetterSpacing', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Padding */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="padding" className="text-sm font-medium">
                      Padding
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {titleSettings.titlePadding}px
                    </Badge>
                  </div>
                  <input
                    id="padding"
                    type="range"
                    min="0"
                    max="24"
                    value={titleSettings.titlePadding}
                    onChange={(e) => handleTitleSettingChange('titlePadding', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Border Radius */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="border-radius" className="text-sm font-medium">
                      Border Radius
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {titleSettings.titleBorderRadius}px
                    </Badge>
                  </div>
                  <input
                    id="border-radius"
                    type="range"
                    min="0"
                    max="24"
                    value={titleSettings.titleBorderRadius}
                    onChange={(e) => handleTitleSettingChange('titleBorderRadius', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rotation" className="text-sm font-medium">
                      Rotation
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {titleSettings.titleRotation}°
                    </Badge>
                  </div>
                  <input
                    id="rotation"
                    type="range"
                    min="-10"
                    max="10"
                    value={titleSettings.titleRotation}
                    onChange={(e) => handleTitleSettingChange('titleRotation', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-6 rounded-lg border bg-muted/30">
              <Label className="text-sm font-medium mb-3 block">Live Preview</Label>
              <div className="flex items-center justify-center min-h-[100px]">
                <div
                  className={`transition-all duration-300 ${
                    titleSettings.titleSize === 'xs' ? 'text-xs' :
                    titleSettings.titleSize === 'sm' ? 'text-sm' :
                    titleSettings.titleSize === 'base' ? 'text-base' :
                    titleSettings.titleSize === 'lg' ? 'text-lg' :
                    titleSettings.titleSize === 'xl' ? 'text-xl' :
                    titleSettings.titleSize === '2xl' ? 'text-2xl' :
                    titleSettings.titleSize === '3xl' ? 'text-3xl' :
                    'text-4xl'
                  } ${
                    titleSettings.titleFont === 'sans' ? 'font-sans' :
                    titleSettings.titleFont === 'serif' ? 'font-serif' :
                    titleSettings.titleFont === 'mono' ? 'font-mono' :
                    'font-display'
                  } ${
                    titleSettings.titleBold ? 'font-bold' : 'font-normal'
                  } ${
                    titleSettings.titleItalic ? 'italic' : ''
                  } ${
                    titleSettings.titleUnderline ? 'underline' : ''
                  } ${
                    titleSettings.titleUppercase ? 'uppercase' : ''
                  } ${
                    titleSettings.titleShadow ? 'drop-shadow-lg' : ''
                  }`}
                  style={{
                    color: titleSettings.titleColor,
                    backgroundColor: titleSettings.titleBackgroundColor,
                    padding: `${titleSettings.titlePadding}px`,
                    borderRadius: `${titleSettings.titleBorderRadius}px`,
                    letterSpacing: `${titleSettings.titleLetterSpacing}px`,
                    transform: `rotate(${titleSettings.titleRotation}deg)`,
                    ...(titleSettings.titleOutline && {
                      textShadow: `
                        -1px -1px 0 ${titleSettings.titleOutlineColor},
                        1px -1px 0 ${titleSettings.titleOutlineColor},
                        -1px 1px 0 ${titleSettings.titleOutlineColor},
                        1px 1px 0 ${titleSettings.titleOutlineColor}
                      `,
                    }),
                  }}
                >
                  {titleSettings.dashboardTitle || 'Professional Task Dashboard'}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center">
              <Button 
                onClick={handleSaveTitleSettings}
                disabled={!hasUnsavedTitleChanges}
                className="gap-2"
                variant={hasUnsavedTitleChanges ? "default" : "secondary"}
              >
                <Save className="h-4 w-4" />
                {hasUnsavedTitleChanges ? 'Save Changes' : 'All Changes Saved'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Icon Animations */}
      <Card className="glass-card p-6">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold mb-1 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Icon Animations
              </h2>
              <p className="text-sm text-muted-foreground">
                Control which dashboard icons animate and how
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="master-animation" className="text-sm font-medium">
                Master Toggle
              </Label>
              <Switch
                id="master-animation"
                checked={settings.animationSettings.masterEnabled}
                onCheckedChange={handleAnimationMasterToggle}
              />
            </div>
          </div>

          {!settings.animationSettings.masterEnabled && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground text-center">
                ⚠️ Animations are currently disabled. Enable the master toggle to see animations.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {(Object.keys(iconLabels) as Array<keyof typeof iconLabels>).map((iconKey) => {
              const { label, icon: Icon } = iconLabels[iconKey]
              const iconSettings = settings.animationSettings.icons[iconKey]
              const isDefaultIcon = ['totalTasks', 'completed', 'inProgress', 'overdue'].includes(iconKey)

              return (
                <div
                  key={iconKey}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border bg-card/50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">{label}</Label>
                        {isDefaultIcon && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {iconSettings.enabled ? `Animating: ${iconSettings.animation}` : 'No animation'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Select
                      value={iconSettings.animation}
                      onValueChange={(value: AnimationType) => handleIconAnimationTypeChange(iconKey, value)}
                      disabled={!iconSettings.enabled}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {animationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Switch
                      checked={iconSettings.enabled}
                      onCheckedChange={(checked) => handleIconAnimationToggle(iconKey, checked)}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
              💡 Animation Tips
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Total Tasks, Completed, In Progress, and Overdue animate by default</li>
              <li>• Toggle individual icons on/off using the switches</li>
              <li>• Choose from 8 different animation styles for each icon</li>
              <li>• Use the master toggle to quickly disable all animations</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
