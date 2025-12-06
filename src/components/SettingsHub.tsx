"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Settings } from '@/components/Settings'
import { AccountSettings } from '@/components/AccountSettings'
import { AppearanceSettings } from '@/components/AppearanceSettings'
import { NotificationsSettings } from '@/components/NotificationsSettings'
import { DefaultsSettings } from '@/components/DefaultsSettings'
import { DateTimeSettings } from '@/components/DateTimeSettings'
import { PrivacySettings } from '@/components/PrivacySettings'
import { IntegrationsSettings } from '@/components/IntegrationsSettings'
import { AdvancedSettings } from '@/components/AdvancedSettings'
import { Archive } from '@/components/Archive'
import { Task, Tag, Category, TaskTemplate, AppSettings } from '@/types/task'
import { 
  Settings as SettingsIcon, 
  UserCircle,
  Archive as ArchiveIcon,
  Paintbrush,
  Bell,
  CheckSquare,
  CalendarClock,
  Shield,
  Plug,
  Code,
  FolderOpen,
  Type
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { WorkspaceManager } from '@/components/WorkspaceManager'
import { CustomFieldsManager } from '@/components/CustomFieldsManager'
import { 
  getWorkspaces, 
  getActiveWorkspaceId, 
  setActiveWorkspaceId,
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getAllWorkspaceStats,
  getCustomFields,
  addCustomField,
  updateCustomField,
  deleteCustomField
} from '@/lib/workspaceStorage'

interface SettingsHubProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
  onExportJSON: () => void
  onExportCSV: () => void
  onImport: (data: any) => boolean
  stats: {
    totalTasks: number
    totalTags: number
    totalCategories: number
    totalTemplates: number
  }
  tags: Tag[]
  categories: Category[]
  templates: TaskTemplate[]
  onAddTemplate: (template: TaskTemplate) => void
  onUpdateTemplate: (templateId: string, updates: Partial<TaskTemplate>) => void
  onDeleteTemplate: (templateId: string) => void
  onCreateFromTemplate: (template: TaskTemplate) => void
  onTaskRestore: (taskId: string) => void
  onTaskDelete: (taskId: string) => void
  onTaskArchive: (taskId: string) => void
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskEdit: (task: Task) => void
  onTaskStatusChange: (taskId: string, status: Task['status']) => void
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onCreateTask: () => void
  onRefresh: () => void
  focusTask: Task | null
  onExitFocus: () => void
  onSelectFocusTask: (task: Task) => void
  onSaveTask: (task: Task) => void
  initialTab?: string
}

export function SettingsHub({
  settings,
  onSettingsChange,
  onExportJSON,
  onExportCSV,
  onImport,
  stats,
  tags,
  categories,
  templates,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onCreateFromTemplate,
  onTaskRestore,
  onTaskDelete,
  onTaskArchive,
  tasks,
  onTaskClick,
  onTaskEdit,
  onTaskStatusChange,
  onTaskUpdate,
  onCreateTask,
  onRefresh,
  focusTask,
  onExitFocus,
  onSelectFocusTask,
  onSaveTask,
  initialTab = "account"
}: SettingsHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab)

  const [workspaces, setWorkspaces] = useState(getWorkspaces())
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(getActiveWorkspaceId())
  const [workspaceStats, setWorkspaceStats] = useState(getAllWorkspaceStats(tasks))
  const [customFields, setCustomFields] = useState(getCustomFields())

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    setWorkspaces(getWorkspaces())
    setWorkspaceStats(getAllWorkspaceStats(tasks))
    setCustomFields(getCustomFields())
  }, [tasks])

  const handleWorkspaceSelect = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId)
    setCurrentWorkspaceId(workspaceId)
    onRefresh()
    toast.success('Workspace switched')
  }

  const handleWorkspaceCreate = (workspace: any) => {
    const newWorkspace = addWorkspace(workspace)
    setWorkspaces(getWorkspaces())
    toast.success(`Workspace "${newWorkspace.name}" created`)
  }

  const handleWorkspaceUpdate = (workspaceId: string, updates: any) => {
    updateWorkspace(workspaceId, updates)
    setWorkspaces(getWorkspaces())
  }

  const handleWorkspaceDelete = (workspaceId: string) => {
    deleteWorkspace(workspaceId)
    setWorkspaces(getWorkspaces())
    onRefresh()
  }

  const handleCustomFieldCreate = (field: any) => {
    const newField = addCustomField(field)
    setCustomFields(getCustomFields())
    toast.success(`Custom field "${newField.name}" created`)
  }

  const handleCustomFieldUpdate = (fieldId: string, updates: any) => {
    updateCustomField(fieldId, updates)
    setCustomFields(getCustomFields())
  }

  const handleCustomFieldDelete = (fieldId: string) => {
    deleteCustomField(fieldId)
    setCustomFields(getCustomFields())
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Settings Hub</h1>
        <p className="text-muted-foreground">
          Account settings and app configuration
        </p>
      </div>

      <Card className="glass-card">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          {/* Settings Tab Bar */}
          <div className="p-6 pb-4 border-b">
            <TabsList className="h-auto p-1 bg-muted/20 backdrop-blur-sm rounded-lg inline-flex gap-0.5 flex-wrap justify-start w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="account" 
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <UserCircle className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Account</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Profile, avatar, email, and password settings</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="general" 
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <SettingsIcon className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">General</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Basic app settings and data management</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="workspaces"
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <FolderOpen className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Workspaces</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Organize tasks by workspaces</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="custom-fields"
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <Type className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Custom Fields</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Create custom fields for tasks</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="appearance"
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <Paintbrush className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Appearance</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Theme, colors, and visual customization</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="notifications"
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <Bell className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Notifications</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Alert preferences and sound settings</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="defaults"
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <CheckSquare className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Defaults</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Default task settings and auto-assign</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="datetime"
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <CalendarClock className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Date & Time</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Format, timezone, and calendar preferences</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="privacy"
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <Shield className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Privacy</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Security and data protection settings</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="integrations"
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <Plug className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Integrations</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Connect third-party services</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="advanced"
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <Code className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Advanced</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Developer options and performance</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="archive"
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-sm group"
                  >
                    <ArchiveIcon className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                    <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Archive</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">View and restore archived tasks</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <TabsContent value="account" className="mt-0">
              <AccountSettings />
            </TabsContent>

            <TabsContent value="general" className="mt-0">
              <Settings
                settings={settings}
                onSettingsChange={onSettingsChange}
                onExportJSON={onExportJSON}
                onExportCSV={onExportCSV}
                onImport={onImport}
                stats={stats}
              />
            </TabsContent>

            <TabsContent value="workspaces" className="mt-0">
              <WorkspaceManager
                workspaces={workspaces}
                currentWorkspaceId={currentWorkspaceId}
                workspaceStats={workspaceStats}
                onWorkspaceSelect={handleWorkspaceSelect}
                onWorkspaceCreate={handleWorkspaceCreate}
                onWorkspaceUpdate={handleWorkspaceUpdate}
                onWorkspaceDelete={handleWorkspaceDelete}
              />
            </TabsContent>

            <TabsContent value="custom-fields" className="mt-0">
              <CustomFieldsManager
                customFields={customFields}
                onFieldCreate={handleCustomFieldCreate}
                onFieldUpdate={handleCustomFieldUpdate}
                onFieldDelete={handleCustomFieldDelete}
              />
            </TabsContent>

            <TabsContent value="appearance" className="mt-0">
              <AppearanceSettings
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationsSettings
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
            </TabsContent>

            <TabsContent value="defaults" className="mt-0">
              <DefaultsSettings
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
            </TabsContent>

            <TabsContent value="datetime" className="mt-0">
              <DateTimeSettings
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
            </TabsContent>

            <TabsContent value="privacy" className="mt-0">
              <PrivacySettings
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
            </TabsContent>

            <TabsContent value="integrations" className="mt-0">
              <IntegrationsSettings
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
            </TabsContent>

            <TabsContent value="advanced" className="mt-0">
              <AdvancedSettings
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
            </TabsContent>

            <TabsContent value="archive" className="mt-0">
              <Archive
                onTaskRestore={onTaskRestore}
                onTaskDelete={onTaskDelete}
              />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  )
}