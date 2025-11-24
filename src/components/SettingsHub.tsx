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
import { Templates } from '@/components/Templates'
import { KanbanBoard } from '@/components/KanbanBoard'
import { GanttView } from '@/components/GanttView'
import { CalendarView } from '@/components/CalendarView'
import { Inbox } from '@/components/Inbox'
import { FocusMode } from '@/components/FocusMode'
import { Analytics } from '@/components/Analytics'
import { Projects } from '@/components/Projects'
import { TimeBudgetPage } from '@/components/TimeBudgetPage'
import { QuickLinksManager } from '@/components/QuickLinksManager'
import { Archive } from '@/components/Archive'
import { Task, Tag, Category, TaskTemplate, AppSettings } from '@/types/task'
import { 
  Settings as SettingsIcon, 
  UserCircle,
  FileText, 
  Clock,
  Columns3,
  GanttChart,
  Calendar as CalendarIcon,
  Inbox as InboxIcon,
  Focus,
  BarChart3,
  FolderKanban,
  Link as LinkIcon,
  LayoutGrid,
  Zap,
  FolderTree,
  Sliders,
  Archive as ArchiveIcon,
  Paintbrush,
  Bell,
  CheckSquare,
  CalendarClock,
  Shield,
  Plug,
  Code,
} from 'lucide-react'
import { motion } from 'framer-motion'

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
  initialTab = "general"
}: SettingsHubProps) {
  // Map individual tabs to their parent categories - UPDATED WITH NEW STRUCTURE
  const tabToCategory: { [key: string]: string } = {
    'quick-links': 'configuration',
    'projects': 'views',
    'kanban': 'views',
    'gantt': 'views',
    'calendar': 'views',
    'focus-mode': 'productivity',
    'time-tracker': 'productivity',
    'inbox': 'productivity',
    'templates': 'management',
    'analytics': 'management',
    'account': 'settings',
    'general': 'settings',
    'appearance': 'settings',
    'notifications': 'settings',
    'defaults': 'settings',
    'datetime': 'settings',
    'privacy': 'settings',
    'integrations': 'settings',
    'advanced': 'settings',
    'archive': 'archive',
  }

  const [activeCategory, setActiveCategory] = useState(tabToCategory[initialTab] || 'settings')
  const [activeSubTab, setActiveSubTab] = useState(initialTab)

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab)
      setActiveCategory(tabToCategory[initialTab] || 'settings')
    }
  }, [initialTab])

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    // Set default sub-tab for each category
    switch (category) {
      case 'configuration':
        setActiveSubTab('quick-links')
        break
      case 'views':
        setActiveSubTab('projects')
        break
      case 'productivity':
        setActiveSubTab('focus-mode')
        break
      case 'management':
        setActiveSubTab('templates')
        break
      case 'settings':
        setActiveSubTab('account')
        break
      case 'archive':
        setActiveSubTab('archive')
        break
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Settings Hub</h1>
        <p className="text-muted-foreground">
          Advanced features and configuration center
        </p>
      </div>

      <Card className="glass-card">
        <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="space-y-0">
          {/* Main Category Tab Bar - Icon Navigation Style with Logo - 6 CATEGORIES */}
          <div className="p-6 pb-0 flex justify-center">
            <TabsList className="h-auto p-1.5 bg-background/60 backdrop-blur-md rounded-full shadow-lg border border-border/50 inline-flex gap-0.5 items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="configuration"
                      className="relative px-4 py-2 rounded-full data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:bg-muted/50 transition-all group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <LinkIcon className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                      </motion.div>
                      <motion.div 
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-transparent group-data-[state=active]:bg-primary transition-all"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">Quick Links</p>
                    <p className="text-xs opacity-90">Manage custom shortcuts and links</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="views"
                      className="relative px-4 py-2 rounded-full data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:bg-muted/50 transition-all group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: -10 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <LayoutGrid className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                      </motion.div>
                      <motion.div 
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-transparent group-data-[state=active]:bg-primary transition-all"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">Views</p>
                    <p className="text-xs opacity-90">Projects, Kanban, Gantt, and Calendar views</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>

              {/* HOLOGRAPHIC 3D ANIMATED LOGO - Between Views and Productivity */}
              <motion.div 
                className="px-1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  className="relative"
                  animate={{
                    rotateY: [0, 360],
                    rotateX: [0, 15, 0, -15, 0],
                  }}
                  transition={{
                    rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
                    rotateX: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  }}
                  style={{ 
                    transformStyle: "preserve-3d",
                    perspective: 1000
                  }}
                  whileHover={{ 
                    scale: 1.2,
                    rotateZ: 360,
                    transition: { duration: 0.6 }
                  }}
                >
                  {/* Holographic glow rings */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      background: "radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, transparent 70%)",
                      filter: "blur(4px)"
                    }}
                  />
                  
                  {/* Secondary pulse ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      scale: [1, 1.7, 1],
                      opacity: [0.3, 0, 0.3],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                    style={{
                      background: "conic-gradient(from 0deg, rgba(139, 92, 246, 0.5), rgba(59, 130, 246, 0.5), rgba(139, 92, 246, 0.5))",
                      filter: "blur(5px)"
                    }}
                  />

                  {/* Main logo container with prism effect */}
                  <motion.div
                    className="relative rounded-full p-0.5 bg-gradient-to-br from-violet-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-sm border shadow-lg"
                    animate={{
                      borderColor: [
                        "rgba(139, 92, 246, 0.5)",
                        "rgba(59, 130, 246, 0.5)",
                        "rgba(168, 85, 247, 0.5)",
                        "rgba(139, 92, 246, 0.5)"
                      ],
                      boxShadow: [
                        "0 0 10px rgba(139, 92, 246, 0.4)",
                        "0 0 20px rgba(59, 130, 246, 0.4)",
                        "0 0 10px rgba(168, 85, 247, 0.4)",
                        "0 0 10px rgba(139, 92, 246, 0.4)"
                      ]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <motion.div
                      className="relative"
                      animate={{
                        filter: [
                          "hue-rotate(0deg) saturate(1)",
                          "hue-rotate(30deg) saturate(1.2)",
                          "hue-rotate(-30deg) saturate(1.2)",
                          "hue-rotate(0deg) saturate(1)"
                        ]
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <img 
                        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/cT1Jbvl-1761150151881.jpeg?width=8000&height=8000&resize=contain"
                        alt="9TD Logo"
                        className="h-5 w-5 object-contain rounded-full"
                        style={{
                          filter: "drop-shadow(0 0 4px rgba(139, 92, 246, 0.6))"
                        }}
                      />
                    </motion.div>

                    {/* Orbiting particles */}
                    {[0, 120, 240].map((angle, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-0.5 h-0.5 rounded-full bg-gradient-to-r from-violet-400 to-blue-400"
                        style={{
                          top: "50%",
                          left: "50%",
                          marginTop: "-1px",
                          marginLeft: "-1px"
                        }}
                        animate={{
                          rotate: [angle, angle + 360],
                          x: [0, Math.cos((angle * Math.PI) / 180) * 14],
                          y: [0, Math.sin((angle * Math.PI) / 180) * 14],
                          scale: [0, 1, 1, 0],
                          opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.4
                        }}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="productivity"
                      className="relative px-4 py-2 rounded-full data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:bg-muted/50 transition-all group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Zap className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                      </motion.div>
                      <motion.div 
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-transparent group-data-[state=active]:bg-primary transition-all"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">Productivity</p>
                    <p className="text-xs opacity-90">Focus mode, time tracker, and inbox</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="management"
                      className="relative px-4 py-2 rounded-full data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:bg-muted/50 transition-all group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: -10 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FolderTree className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                      </motion.div>
                      <motion.div 
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-transparent group-data-[state=active]:bg-primary transition-all"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">Management</p>
                    <p className="text-xs opacity-90">Templates and analytics</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>

              {/* NEW SETTINGS MAIN CATEGORY */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="settings"
                      className="relative px-4 py-2 rounded-full data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:bg-muted/50 transition-all group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Sliders className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                      </motion.div>
                      <motion.div 
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-transparent group-data-[state=active]:bg-primary transition-all"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">Settings</p>
                    <p className="text-xs opacity-90">App configuration and preferences</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="archive"
                      className="relative px-4 py-2 rounded-full data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:bg-muted/50 transition-all group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ArchiveIcon className="h-4 w-4 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                      </motion.div>
                      <motion.div 
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-transparent group-data-[state=active]:bg-primary transition-all"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">Archive</p>
                    <p className="text-xs opacity-90">View and restore archived tasks</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            </TabsList>
          </div>

          {/* Configuration Sub-tabs - NOW ONLY QUICK LINKS */}
          <TabsContent value="configuration" className="mt-0">
            <div className="p-6">
              <QuickLinksManager />
            </div>
          </TabsContent>

          {/* Views Sub-tabs */}
          <TabsContent value="views" className="mt-0">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-0">
              <div className="px-6 pt-6 pb-4 flex justify-center">
                <TabsList className="h-auto p-1.5 bg-muted/30 backdrop-blur-sm rounded-full inline-flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="projects" 
                        className="relative flex items-center gap-2 px-5 py-2 rounded-full data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <FolderKanban className="h-3.5 w-3.5 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Projects</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Organize tasks by projects and categories</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="kanban" 
                        className="relative flex items-center gap-2 px-5 py-2 rounded-full data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <Columns3 className="h-3.5 w-3.5 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Kanban</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Visual board with drag-and-drop columns</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="gantt" 
                        className="relative flex items-center gap-2 px-5 py-2 rounded-full data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <GanttChart className="h-3.5 w-3.5 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Gantt</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Timeline chart for project planning</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="calendar" 
                        className="relative flex items-center gap-2 px-5 py-2 rounded-full data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Calendar</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Calendar view with date-based tasks</p>
                    </TooltipContent>
                  </Tooltip>
                </TabsList>
              </div>

              <div className="p-6 pt-2">
                <TabsContent value="projects" className="mt-0">
                  <Projects
                    tasks={tasks}
                    tags={tags}
                    categories={categories}
                    onTaskEdit={onTaskEdit}
                    onTaskDelete={onTaskDelete}
                    onTaskStatusChange={onTaskStatusChange}
                    onCreateTask={onCreateTask}
                  />
                </TabsContent>

                <TabsContent value="kanban" className="mt-0">
                  <KanbanBoard
                    tasks={tasks}
                    tags={tags}
                    categories={categories}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                    onStatusChange={onTaskStatusChange}
                  />
                </TabsContent>

                <TabsContent value="gantt" className="mt-0">
                  <GanttView
                    tasks={tasks}
                    tags={tags}
                    categories={categories}
                    onTaskClick={onTaskClick}
                  />
                </TabsContent>

                <TabsContent value="calendar" className="mt-0">
                  <CalendarView
                    tasks={tasks}
                    onTaskClick={onTaskClick}
                    onDateClick={(date) => {
                      onCreateTask()
                    }}
                    onTaskUpdate={onSaveTask}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </TabsContent>

          {/* Productivity Sub-tabs */}
          <TabsContent value="productivity" className="mt-0">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-0">
              <div className="px-6 pt-6 pb-4 flex justify-center">
                <TabsList className="h-auto p-1.5 bg-muted/30 backdrop-blur-sm rounded-full inline-flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="focus-mode" 
                        className="relative flex items-center gap-2 px-5 py-2 rounded-full data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <Focus className="h-3.5 w-3.5 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Focus</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Deep work mode with Pomodoro timer</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="time-tracker" 
                        className="relative flex items-center gap-2 px-5 py-2 rounded-full data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <Clock className="h-3.5 w-3.5 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Time Tracker</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Track time spent on tasks and projects</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="inbox" 
                        className="relative flex items-center gap-2 px-5 py-2 rounded-full data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <InboxIcon className="h-3.5 w-3.5 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Inbox</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Quick capture for ideas and tasks</p>
                    </TooltipContent>
                  </Tooltip>
                </TabsList>
              </div>

              <div className="p-6 pt-2">
                <TabsContent value="focus-mode" className="mt-0">
                  <FocusMode
                    task={focusTask}
                    allTasks={tasks}
                    tags={tags}
                    categories={categories}
                    settings={{
                      pomodoroWorkDuration: settings.pomodoroWork || 25,
                      pomodoroBreakDuration: settings.pomodoroBreak || 5,
                      pomodoroLongBreakDuration: settings.pomodoroLongBreak || 15,
                      pomodoroSessionsUntilLongBreak: settings.pomodoroSessions || 4,
                      focusModeSound: settings.focusModeSound ?? true,
                      focusModeHideCompleted: settings.focusModeHideCompleted ?? true,
                    }}
                    onTaskUpdate={onTaskUpdate}
                    onStatusChange={onTaskStatusChange}
                    onExitFocus={onExitFocus}
                    onSelectTask={onSelectFocusTask}
                  />
                </TabsContent>

                <TabsContent value="time-tracker" className="mt-0">
                  <TimeBudgetPage
                    tasks={tasks}
                    tags={tags}
                    categories={categories}
                    onTaskClick={onTaskClick}
                  />
                </TabsContent>

                <TabsContent value="inbox" className="mt-0">
                  <Inbox
                    onRefresh={onRefresh}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </TabsContent>

          {/* Management Sub-tabs */}
          <TabsContent value="management" className="mt-0">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-0">
              <div className="px-6 pt-6 pb-4 flex justify-center">
                <TabsList className="h-auto p-1.5 bg-muted/30 backdrop-blur-sm rounded-full inline-flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="templates" 
                        className="relative flex items-center gap-2 px-5 py-2 rounded-full data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Templates</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Reusable task templates for workflows</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="analytics" 
                        className="relative flex items-center gap-2 px-5 py-2 rounded-full data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="font-medium text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Analytics</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Charts and insights about your tasks</p>
                    </TooltipContent>
                  </Tooltip>
                </TabsList>
              </div>

              <div className="p-6 pt-2">
                <TabsContent value="templates" className="mt-0">
                  <Templates
                    templates={templates}
                    onAddTemplate={onAddTemplate}
                    onUpdateTemplate={onUpdateTemplate}
                    onDeleteTemplate={onDeleteTemplate}
                    onCreateFromTemplate={onCreateFromTemplate}
                  />
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <Analytics
                    tasks={tasks}
                    tags={tags}
                    categories={categories}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </TabsContent>

          {/* NEW SETTINGS CATEGORY WITH 9 SUB-TABS (ADDED ACCOUNT) */}
          <TabsContent value="settings" className="mt-0">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-0">
              <div className="px-6 pt-6 pb-4 flex justify-center">
                <TabsList className="h-auto p-1 bg-muted/20 backdrop-blur-sm rounded-lg inline-flex gap-0.5 flex-wrap justify-center max-w-4xl">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="account" 
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <UserCircle className="h-3 w-3 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Account</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Profile, avatar, and account security</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="general" 
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <SettingsIcon className="h-3 w-3 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="text-muted-foreground group-data-[state=active]:text-foreground transition-colors">General</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Basic app settings and data management</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="appearance"
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <Paintbrush className="h-3 w-3 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Appearance</span>
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
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <Bell className="h-3 w-3 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Notifications</span>
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
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <CheckSquare className="h-3 w-3 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Defaults</span>
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
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <CalendarClock className="h-3 w-3 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Date & Time</span>
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
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <Shield className="h-3 w-3 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Privacy</span>
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
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <Plug className="h-3 w-3 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Integrations</span>
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
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background/80 data-[state=active]:shadow-sm bg-transparent hover:bg-background/60 transition-all text-xs group"
                      >
                        <Code className="h-3 w-3 text-muted-foreground group-data-[state=active]:text-primary transition-colors" />
                        <span className="text-muted-foreground group-data-[state=active]:text-foreground transition-colors">Advanced</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Developer options and performance</p>
                    </TooltipContent>
                  </Tooltip>
                </TabsList>
              </div>

              <div className="p-6 pt-2">
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
              </div>
            </Tabs>
          </TabsContent>

          {/* Archive Category - Single Tab */}
          <TabsContent value="archive" className="mt-0">
            <div className="p-6">
              <Archive
                onTaskRestore={onTaskRestore}
                onTaskDelete={onTaskDelete}
              />
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}