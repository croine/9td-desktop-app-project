export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'cancelled';

export type AnimationType = 'none' | 'float' | 'pulse' | 'rotate' | 'bounce' | 'scale' | 'glow' | 'shake';

export type IconAnimationKey = 'totalTasks' | 'completed' | 'inProgress' | 'overdue' | 'streak' | 'todayFocus' | 'calendar' | 'needsAttention' | 'weeklyChart' | 'completionRate';

export interface IconAnimationSettings {
  enabled: boolean;
  animation: AnimationType;
}

export interface AnimationSettings {
  masterEnabled: boolean;
  icons: {
    totalTasks: IconAnimationSettings;
    completed: IconAnimationSettings;
    inProgress: IconAnimationSettings;
    overdue: IconAnimationSettings;
    streak: IconAnimationSettings;
    todayFocus: IconAnimationSettings;
    calendar: IconAnimationSettings;
    needsAttention: IconAnimationSettings;
    weeklyChart: IconAnimationSettings;
    completionRate: IconAnimationSettings;
  };
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  subtasks?: Subtask[]; // Nested subtasks support
}

// Time Tracking
export interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  note?: string;
}

export interface PomodoroSession {
  id: string;
  startTime: string;
  endTime?: string;
  type: 'work' | 'break';
  completed: boolean;
}

export interface TimeTracking {
  totalTime: number; // total seconds spent
  totalMinutes?: number; // total minutes for backward compatibility
  entries: TimeEntry[];
  pomodoroSessions: PomodoroSession[];
  estimatedTime?: number; // estimated time in minutes
  estimatedMinutes?: number; // alias for estimatedTime
}

// Recurring Tasks
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number; // e.g., every 2 days, every 3 weeks
  daysOfWeek?: DayOfWeek[]; // for weekly recurrence
  dayOfMonth?: number; // for monthly recurrence
  endDate?: string;
  endAfterOccurrences?: number;
}

export interface RecurringTask {
  enabled: boolean;
  pattern: RecurrencePattern;
  parentTaskId?: string; // if this is a recurring instance
  nextOccurrence?: string;
  lastGenerated?: string;
}

// Dependencies
export interface TaskDependency {
  taskId: string;
  type: 'blocks' | 'blocked-by' | 'relates-to';
}

// Attachments
export interface Attachment {
  id: string;
  name: string;
  type: string; // mime type
  size: number; // in bytes
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

// Comments for Activity Logs
export interface LogComment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}

// Reactions for Activity Logs
export interface LogReaction {
  emoji: string;
  userId: string;
  timestamp: string;
}

// Comments
export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string; // for threaded comments
  mentions?: string[]; // @mentioned users
}

// Reminders/Notifications
export interface Reminder {
  id: string;
  type: 'absolute' | 'relative';
  time?: string; // absolute time
  minutesBefore?: number; // relative to due date
  sent: boolean;
}

// Template
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  defaultValues: Partial<Task>;
}

// Quick Links
export interface QuickLink {
  id: string;
  title: string;
  url: string;
  customIcon?: string;
  createdAt: string;
}

// Smart Suggestions
export interface SmartSuggestion {
  type: 'priority' | 'due-date' | 'tags' | 'category' | 'time-estimate';
  value: any;
  confidence: number; // 0-1
  reason: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Task {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in-progress' | 'completed' | 'on-hold'
  tags: string[]
  categories: string[]
  createdAt: string
  updatedAt: string
  dueDate?: string
  assignees?: string[]
  subtasks?: SubTask[]
  attachments?: Attachment[]
  estimatedTime?: number
  actualTime?: number
  timeTracking?: TimeTrackingSession[]
  dependencies?: string[]
  blockedBy?: string[]
  recurrence?: RecurrencePattern
  workspaceId?: string // NEW: Workspace association
  customFields?: CustomFieldValue[] // NEW: Custom field values
}

export interface ActivityLog {
  id: string;
  taskId: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned' | 'commented' | 'time_tracked' | 'attachment_added';
  description: string;
  timestamp: string;
  userId?: string;
  metadata?: any;
  pinned?: boolean;
  tags?: string[]; // Inherited from task
  changes?: ChangeDetail[]; // Track what changed
  
  // New advanced features
  comments?: LogComment[]; // Comments on this log
  reactions?: LogReaction[]; // Emoji reactions
  bookmarked?: boolean; // Separate from pinning
  customNotes?: string; // User's custom notes/annotations
  relatedLogIds?: string[]; // Link to related logs
  archived?: boolean; // Auto-archived old logs
  archivedAt?: string;
  editedAt?: string; // Track if description was edited
  originalDescription?: string; // Keep original for reference
}

export interface ChangeDetail {
  field: string;
  oldValue: any;
  newValue: any;
  label: string; // Human-readable field name
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  defaultView: 'grid' | 'list'
  compactMode: boolean
  showLogo: boolean
  showTitle: boolean
  dashboardTitle: string
  titlePosition: number
  titleSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  titleFont: 'sans' | 'serif' | 'mono' | 'display'
  titleColor: string
  titleBold: boolean
  titleItalic: boolean
  titleShadow: boolean
  titleOutline: boolean
  titleOutlineColor: string
  titleUnderline?: boolean
  titleUppercase?: boolean
  titleLetterSpacing?: number
  titleBackgroundColor?: string
  titlePadding?: number
  titleBorderRadius?: number
  titleRotation?: number
  animationSettings: {
    masterEnabled: boolean
    icons: {
      [key in IconAnimationKey]: {
        enabled: boolean
        animation: AnimationType
      }
    }
  }
  
  // New settings
  pomodoroWorkDuration: number; // minutes
  pomodoroBreakDuration: number; // minutes
  pomodoroLongBreakDuration: number; // minutes
  pomodoroSessionsUntilLongBreak: number;
  
  enableAutoBackup: boolean;
  autoBackupInterval: number; // hours
  
  enableSmartSuggestions: boolean;
  enableNotifications: boolean;
  notificationTimings: number[]; // minutes before due date [15, 60, 1440]
  
  defaultEstimatedTime: number; // minutes
  
  focusModeSound: boolean;
  focusModeHideCompleted: boolean;
}

// Export/Import types
export interface ExportData {
  version: string;
  exportedAt: string;
  tasks: Task[];
  tags: Tag[];
  categories: Category[];
  templates: TaskTemplate[];
  settings: AppSettings;
}

// Inbox item (quick capture)
export interface InboxItem {
  id: string;
  title: string;
  note?: string;
  createdAt: string;
  processed: boolean;
}

import { CustomFieldValue } from './workspace'