import { Task, Tag, Category, ActivityLog, AppSettings, AnimationSettings, TaskTemplate, InboxItem, ExportData, ChangeDetail } from '@/types/task';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { getActiveWorkspaceId } from './workspaceStorage';

const STORAGE_KEYS = {
  TASKS: 'ntd_tasks',
  TAGS: 'ntd_tags',
  CATEGORIES: 'ntd_categories',
  LOGS: 'ntd_logs',
  SETTINGS: 'ntd_settings',
  TEMPLATES: 'ntd_templates',
  INBOX: 'ntd_inbox',
  FOCUS_TASK: 'ntd_focus_task',
  LAST_BACKUP: 'ntd_last_backup',
  LOG_FILTER_PRESETS: 'ntd_log_filter_presets',
  LOG_HISTORY: 'ntd_log_history', // For undo functionality
};

// Tasks
export const getTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  return data ? JSON.parse(data) : [];
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  autoBackup();
};

// NEW: Clone task with all metadata
export const cloneTask = (taskId: string): Task | null => {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  const clonedTask: Task = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: `${task.title} (Copy)`,
    status: 'todo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: undefined,
    // Clone subtasks with new IDs
    subtasks: task.subtasks?.map(st => ({
      ...st,
      id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
      createdAt: new Date().toISOString(),
    })),
    // Clone time tracking but reset times
    timeTracking: task.timeTracking ? {
      ...task.timeTracking,
      totalTime: 0,
      entries: [],
      pomodoroSessions: [],
    } : undefined,
    // Clone attachments (keep references)
    attachments: task.attachments ? [...task.attachments] : undefined,
    // Clone dependencies
    dependencies: task.dependencies ? [...task.dependencies] : undefined,
    // Clone custom fields
    customFields: task.customFields ? { ...task.customFields } : undefined,
    // Clone tags and categories
    tags: task.tags ? [...task.tags] : undefined,
    categories: task.categories ? [...task.categories] : undefined,
    // Reset recurring settings
    recurring: task.recurring ? {
      ...task.recurring,
      parentTaskId: undefined,
      nextOccurrence: undefined,
      lastGenerated: undefined,
    } : undefined,
  };

  addTask(clonedTask);

  addLog({
    id: `log_${Date.now()}`,
    taskId: clonedTask.id,
    action: 'created',
    description: `Task "${clonedTask.title}" was cloned from "${task.title}"`,
    timestamp: new Date().toISOString(),
    tags: clonedTask.tags || [],
  });

  return clonedTask;
};

// NEW: Bulk clone tasks
export const bulkCloneTasks = (taskIds: string[]): Task[] => {
  const clonedTasks: Task[] = [];
  taskIds.forEach(id => {
    const cloned = cloneTask(id);
    if (cloned) clonedTasks.push(cloned);
  });
  return clonedTasks;
};

export function addTask(task: Task): void {
  // Auto-assign to active workspace if not set
  if (!task.workspaceId) {
    task.workspaceId = getActiveWorkspaceId() || 'default'
  }
  
  const tasks = getTasks()
  tasks.push(task)
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  
  addLog({
    id: `log_${Date.now()}`,
    taskId: task.id,
    action: 'created',
    description: `Task "${task.title}" was created`,
    timestamp: new Date().toISOString(),
    tags: task.tags || [],
  });
}

export function updateTask(taskId: string, updates: Partial<Task>): void {
  const tasks = getTasks()
  const index = tasks.findIndex(t => t.id === taskId)
  
  if (index !== -1) {
    const oldTask = tasks[index]
    tasks[index] = { ...oldTask, ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
    
    // Track detailed changes
    const changes: ChangeDetail[] = [];
    
    if (updates.status && oldTask.status !== updates.status) {
      changes.push({
        field: 'status',
        oldValue: oldTask.status,
        newValue: updates.status,
        label: 'Status'
      });
    }
    
    if (updates.priority && oldTask.priority !== updates.priority) {
      changes.push({
        field: 'priority',
        oldValue: oldTask.priority,
        newValue: updates.priority,
        label: 'Priority'
      });
    }
    
    if (updates.title && oldTask.title !== updates.title) {
      changes.push({
        field: 'title',
        oldValue: oldTask.title,
        newValue: updates.title,
        label: 'Title'
      });
    }
    
    if (updates.dueDate !== undefined && oldTask.dueDate !== updates.dueDate) {
      changes.push({
        field: 'dueDate',
        oldValue: oldTask.dueDate || 'None',
        newValue: updates.dueDate || 'None',
        label: 'Due Date'
      });
    }
    
    let description = `Task "${tasks[index].title}" was updated`;
    let action: ActivityLog['action'] = 'updated';
    
    if (updates.status && oldTask.status !== updates.status) {
      description = `Task status changed from "${oldTask.status}" to "${updates.status}"`;
      action = 'status_changed';
    } else if (changes.length > 0) {
      description = `Task "${tasks[index].title}" updated: ${changes.map(c => c.label).join(', ')}`;
    }
    
    addLog({
      id: `log_${Date.now()}`,
      taskId,
      action,
      description,
      timestamp: new Date().toISOString(),
      tags: tasks[index].tags || [],
      changes: changes.length > 0 ? changes : undefined,
    });
  }
}

export const deleteTask = (taskId: string) => {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  const filtered = tasks.filter(t => t.id !== taskId);
  saveTasks(filtered);
  
  if (task) {
    addLog({
      id: `log_${Date.now()}`,
      taskId,
      action: 'deleted',
      description: `Task "${task.title}" was deleted`,
      timestamp: new Date().toISOString(),
      tags: task.tags || [],
    });
  }
};

export const archiveTask = (taskId: string) => {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    updateTask(taskId, { 
      archived: true, 
      archivedAt: new Date().toISOString() 
    });
    addLog({
      id: `log_${Date.now()}`,
      taskId,
      action: 'updated',
      description: `Task "${task.title}" was archived`,
      timestamp: new Date().toISOString(),
    });
  }
};

export const unarchiveTask = (taskId: string) => {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    updateTask(taskId, { 
      archived: false, 
      archivedAt: undefined 
    });
    addLog({
      id: `log_${Date.now()}`,
      taskId,
      action: 'updated',
      description: `Task "${task.title}" was unarchived`,
      timestamp: new Date().toISOString(),
    });
  }
};

export const getArchivedTasks = (): Task[] => {
  return getTasks().filter(t => t.archived);
};

export const getActiveTasks = (): Task[] => {
  return getTasks().filter(t => !t.archived);
};

// Get tasks for active workspace only
export function getActiveWorkspaceTasks(): Task[] {
  const allTasks = getTasks()
  const activeWorkspaceId = getActiveWorkspaceId()
  return allTasks.filter(task => task.workspaceId === activeWorkspaceId)
}

// Tags
export const getTags = (): Tag[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.TAGS);
  return data ? JSON.parse(data) : getDefaultTags();
};

export const saveTags = (tags: Tag[]) => {
  localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
};

export const addTag = (tag: Tag) => {
  const tags = getTags();
  tags.push(tag);
  saveTags(tags);
};

export const updateTag = (tagId: string, updates: Partial<Tag>) => {
  const tags = getTags();
  const index = tags.findIndex(t => t.id === tagId);
  if (index !== -1) {
    tags[index] = { ...tags[index], ...updates };
    saveTags(tags);
  }
};

export const deleteTag = (tagId: string) => {
  const tags = getTags();
  saveTags(tags.filter(t => t.id !== tagId));
};

// Categories
export const getCategories = (): Category[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  return data ? JSON.parse(data) : getDefaultCategories();
};

export const saveCategories = (categories: Category[]) => {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
};

export const addCategory = (category: Category) => {
  const categories = getCategories();
  categories.push(category);
  saveCategories(categories);
};

export const updateCategory = (categoryId: string, updates: Partial<Category>) => {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === categoryId);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...updates };
    saveCategories(categories);
  }
};

export const deleteCategory = (categoryId: string) => {
  const categories = getCategories();
  saveCategories(categories.filter(c => c.id !== categoryId));
};

// Activity Logs - Enhanced
export const getLogs = (): ActivityLog[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.LOGS);
  return data ? JSON.parse(data) : [];
};

export const saveLogs = (logs: ActivityLog[]) => {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
};

export const addLog = (log: ActivityLog) => {
  const logs = getLogs();
  logs.unshift(log); // Add to beginning
  // Keep only last 500 logs
  if (logs.length > 500) {
    logs.splice(500);
  }
  saveLogs(logs);
};

export const pinLog = (logId: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index].pinned = true;
    saveLogs(logs);
  }
};

export const unpinLog = (logId: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index].pinned = false;
    saveLogs(logs);
  }
};

export const deleteLog = (logId: string) => {
  const logs = getLogs();
  saveLogs(logs.filter(l => l.id !== logId));
};

export const bulkDeleteLogs = (logIds: string[]) => {
  const logs = getLogs();
  saveLogs(logs.filter(l => !logIds.includes(l.id)));
};

export const bulkPinLogs = (logIds: string[]) => {
  const logs = getLogs();
  logIds.forEach(id => {
    const index = logs.findIndex(l => l.id === id);
    if (index !== -1) {
      logs[index].pinned = true;
    }
  });
  saveLogs(logs);
};

// NEW: Edit log description
export const updateLogDescription = (logId: string, newDescription: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    if (!logs[index].originalDescription) {
      logs[index].originalDescription = logs[index].description;
    }
    logs[index].description = newDescription;
    logs[index].editedAt = new Date().toISOString();
    saveLogs(logs);
  }
};

// NEW: Comments on logs
export const addLogComment = (logId: string, content: string, author: string = 'You') => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      author,
      createdAt: new Date().toISOString(),
    };
    logs[index].comments = [...(logs[index].comments || []), comment];
    saveLogs(logs);
  }
};

export const updateLogComment = (logId: string, commentId: string, content: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1 && logs[index].comments) {
    logs[index].comments = logs[index].comments!.map(c =>
      c.id === commentId ? { ...c, content, updatedAt: new Date().toISOString() } : c
    );
    saveLogs(logs);
  }
};

export const deleteLogComment = (logId: string, commentId: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1 && logs[index].comments) {
    logs[index].comments = logs[index].comments!.filter(c => c.id !== commentId);
    saveLogs(logs);
  }
};

// NEW: Reactions
export const addLogReaction = (logId: string, emoji: string, userId: string = 'user') => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    const reaction = { emoji, userId, timestamp: new Date().toISOString() };
    logs[index].reactions = [...(logs[index].reactions || []), reaction];
    saveLogs(logs);
  }
};

export const removeLogReaction = (logId: string, emoji: string, userId: string = 'user') => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1 && logs[index].reactions) {
    logs[index].reactions = logs[index].reactions!.filter(r => !(r.emoji === emoji && r.userId === userId));
    saveLogs(logs);
  }
};

// NEW: Bookmarks
export const bookmarkLog = (logId: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index].bookmarked = true;
    saveLogs(logs);
  }
};

export const unbookmarkLog = (logId: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index].bookmarked = false;
    saveLogs(logs);
  }
};

// NEW: Archive logs
export const archiveLog = (logId: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index].archived = true;
    logs[index].archivedAt = new Date().toISOString();
    saveLogs(logs);
  }
};

export const unarchiveLog = (logId: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index].archived = false;
    logs[index].archivedAt = undefined;
    saveLogs(logs);
  }
};

// NEW: Auto-archive old logs (older than X days)
export const autoArchiveOldLogs = (daysOld: number = 90) => {
  const logs = getLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  let archived = 0;
  logs.forEach(log => {
    if (!log.pinned && !log.bookmarked && new Date(log.timestamp) < cutoffDate) {
      log.archived = true;
      log.archivedAt = new Date().toISOString();
      archived++;
    }
  });
  
  saveLogs(logs);
  return archived;
};

// NEW: Link related logs
export const linkLogs = (logId: string, relatedLogId: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index].relatedLogIds = [...(logs[index].relatedLogIds || []), relatedLogId];
    saveLogs(logs);
  }
};

export const unlinkLogs = (logId: string, relatedLogId: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1 && logs[index].relatedLogIds) {
    logs[index].relatedLogIds = logs[index].relatedLogIds!.filter(id => id !== relatedLogId);
    saveLogs(logs);
  }
};

// NEW: Custom notes
export const updateLogNotes = (logId: string, notes: string) => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index].customNotes = notes;
    saveLogs(logs);
  }
};

// NEW: Undo functionality - save task state before changes
export const saveTaskHistory = (taskId: string, taskSnapshot: Task) => {
  const history = getTaskHistory();
  history[taskId] = history[taskId] || [];
  history[taskId].unshift({
    snapshot: taskSnapshot,
    timestamp: new Date().toISOString(),
  });
  // Keep only last 10 snapshots per task
  if (history[taskId].length > 10) {
    history[taskId] = history[taskId].slice(0, 10);
  }
  localStorage.setItem(STORAGE_KEYS.LOG_HISTORY, JSON.stringify(history));
};

export const getTaskHistory = (): Record<string, { snapshot: Task; timestamp: string }[]> => {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(STORAGE_KEYS.LOG_HISTORY);
  return data ? JSON.parse(data) : {};
};

export const undoTaskChange = (taskId: string): boolean => {
  const history = getTaskHistory();
  const taskHistory = history[taskId];
  if (!taskHistory || taskHistory.length === 0) return false;
  
  const previousState = taskHistory[0].snapshot;
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    tasks[index] = previousState;
    saveTasks(tasks);
    
    // Remove this history entry
    history[taskId] = taskHistory.slice(1);
    localStorage.setItem(STORAGE_KEYS.LOG_HISTORY, JSON.stringify(history));
    
    addLog({
      id: `log_${Date.now()}`,
      taskId,
      action: 'updated',
      description: `Undone: Reverted "${previousState.title}" to previous state`,
      timestamp: new Date().toISOString(),
    });
    
    return true;
  }
  return false;
};

// NEW: Saved filter presets
export interface LogFilterPreset {
  id: string;
  name: string;
  filters: {
    searchQuery?: string;
    selectedActions?: string[];
    selectedTags?: string[];
    dateFilter?: string;
    showPinned?: boolean;
    showBookmarked?: boolean;
    showArchived?: boolean;
  };
  createdAt: string;
}

export const getLogFilterPresets = (): LogFilterPreset[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.LOG_FILTER_PRESETS);
  return data ? JSON.parse(data) : [];
};

export const saveLogFilterPreset = (preset: LogFilterPreset) => {
  const presets = getLogFilterPresets();
  presets.push(preset);
  localStorage.setItem(STORAGE_KEYS.LOG_FILTER_PRESETS, JSON.stringify(presets));
};

export const deleteLogFilterPreset = (presetId: string) => {
  const presets = getLogFilterPresets();
  localStorage.setItem(
    STORAGE_KEYS.LOG_FILTER_PRESETS,
    JSON.stringify(presets.filter(p => p.id !== presetId))
  );
};

export const applyLogFilterPreset = (presetId: string): LogFilterPreset | null => {
  const presets = getLogFilterPresets();
  return presets.find(p => p.id === presetId) || null;
};

// Settings
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return {
      theme: 'system',
      notifications: true,
      defaultView: 'list',
      compactMode: false,
      animationSettings: {
        masterEnabled: true,
        icons: {
          totalTasks: { enabled: true, animation: 'pulse' },
          completed: { enabled: true, animation: 'bounce' },
          inProgress: { enabled: true, animation: 'rotate' },
          overdue: { enabled: true, animation: 'shake' },
          streak: { enabled: false, animation: 'glow' },
          todayFocus: { enabled: false, animation: 'float' },
          calendar: { enabled: false, animation: 'pulse' },
          needsAttention: { enabled: false, animation: 'shake' },
          weeklyChart: { enabled: false, animation: 'scale' },
          completionRate: { enabled: false, animation: 'glow' },
        }
      },
      showLogo: true,
      dashboardTitle: 'Professional Task Dashboard',
      titleSize: 'sm',
      titleColor: '#6366f1',
      titleFont: 'display',
      titleBold: true,
      titleItalic: false,
      titleShadow: false,
      titleOutline: false,
      titleOutlineColor: '#000000',
      showTitle: true,
      titlePosition: 50,
      titleUnderline: false,
      titleUppercase: false,
      titleLetterSpacing: 0,
      titleBackgroundColor: 'transparent',
      titlePadding: 0,
      titleBorderRadius: 0,
      titleRotation: 0,
      pomodoroWorkDuration: 25,
      pomodoroBreakDuration: 5,
      pomodoroLongBreakDuration: 15,
      pomodoroSessionsUntilLongBreak: 4,
      enableAutoBackup: false,
      autoBackupInterval: 24,
      enableSmartSuggestions: true,
      enableNotifications: true,
      notificationTimings: [15, 60, 1440],
      defaultEstimatedTime: 30,
      focusModeSound: false,
      focusModeHideCompleted: true,
    }
  }

  const saved = localStorage.getItem('app-settings')
  if (!saved) {
    return {
      theme: 'system',
      notifications: true,
      defaultView: 'list',
      compactMode: false,
      animationSettings: {
        masterEnabled: true,
        icons: {
          totalTasks: { enabled: true, animation: 'pulse' },
          completed: { enabled: true, animation: 'bounce' },
          inProgress: { enabled: true, animation: 'rotate' },
          overdue: { enabled: true, animation: 'shake' },
          streak: { enabled: false, animation: 'glow' },
          todayFocus: { enabled: false, animation: 'float' },
          calendar: { enabled: false, animation: 'pulse' },
          needsAttention: { enabled: false, animation: 'shake' },
          weeklyChart: { enabled: false, animation: 'scale' },
          completionRate: { enabled: false, animation: 'glow' },
        }
      },
      showLogo: true,
      dashboardTitle: 'Professional Task Dashboard',
      titleSize: 'sm',
      titleColor: '#6366f1',
      titleFont: 'display',
      titleBold: true,
      titleItalic: false,
      titleShadow: false,
      titleOutline: false,
      titleOutlineColor: '#000000',
      showTitle: true,
      titlePosition: 50,
      titleUnderline: false,
      titleUppercase: false,
      titleLetterSpacing: 0,
      titleBackgroundColor: 'transparent',
      titlePadding: 0,
      titleBorderRadius: 0,
      titleRotation: 0,
      pomodoroWorkDuration: 25,
      pomodoroBreakDuration: 5,
      pomodoroLongBreakDuration: 15,
      pomodoroSessionsUntilLongBreak: 4,
      enableAutoBackup: false,
      autoBackupInterval: 24,
      enableSmartSuggestions: true,
      enableNotifications: true,
      notificationTimings: [15, 60, 1440],
      defaultEstimatedTime: 30,
      focusModeSound: false,
      focusModeHideCompleted: true,
    }
  }

  const parsed = JSON.parse(saved)
  
  // Ensure all new title properties exist for backward compatibility
  if (parsed.titlePosition === undefined) {
    parsed.titlePosition = 50
  }
  if (parsed.titleUnderline === undefined) {
    parsed.titleUnderline = false
  }
  if (parsed.titleUppercase === undefined) {
    parsed.titleUppercase = false
  }
  if (parsed.titleLetterSpacing === undefined) {
    parsed.titleLetterSpacing = 0
  }
  if (parsed.titleBackgroundColor === undefined) {
    parsed.titleBackgroundColor = 'transparent'
  }
  if (parsed.titlePadding === undefined) {
    parsed.titlePadding = 0
  }
  if (parsed.titleBorderRadius === undefined) {
    parsed.titleBorderRadius = 0
  }
  if (parsed.titleRotation === undefined) {
    parsed.titleRotation = 0
  }

  return parsed
}

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem('app-settings', JSON.stringify(settings));
};

// Templates
export const getTemplates = (): TaskTemplate[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  return data ? JSON.parse(data) : getDefaultTemplates();
};

export const saveTemplates = (templates: TaskTemplate[]) => {
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
};

export const addTemplate = (template: TaskTemplate) => {
  const templates = getTemplates();
  templates.push(template);
  saveTemplates(templates);
};

export const updateTemplate = (templateId: string, updates: Partial<TaskTemplate>) => {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === templateId);
  if (index !== -1) {
    templates[index] = { ...templates[index], ...updates };
    saveTemplates(templates);
  }
};

export const deleteTemplate = (templateId: string) => {
  const templates = getTemplates();
  saveTemplates(templates.filter(t => t.id !== templateId));
};

const getDefaultTemplates = (): TaskTemplate[] => [
  {
    id: 'template_meeting',
    name: 'Team Meeting',
    description: 'Standard team meeting preparation',
    icon: '👥',
    category: 'Meetings',
    defaultValues: {
      priority: 'medium',
      status: 'todo',
      subtasks: [
        { id: 'st1', title: 'Prepare agenda', completed: false, createdAt: new Date().toISOString() },
        { id: 'st2', title: 'Send calendar invite', completed: false, createdAt: new Date().toISOString() },
        { id: 'st3', title: 'Gather discussion points', completed: false, createdAt: new Date().toISOString() },
      ],
      timeTracking: {
        totalTime: 0,
        entries: [],
        pomodoroSessions: [],
        estimatedTime: 60,
      }
    }
  },
  {
    id: 'template_code_review',
    name: 'Code Review',
    description: 'Review pull request/merge request',
    icon: '🔍',
    category: 'Development',
    defaultValues: {
      priority: 'high',
      status: 'todo',
      subtasks: [
        { id: 'st1', title: 'Read code changes', completed: false, createdAt: new Date().toISOString() },
        { id: 'st2', title: 'Test functionality', completed: false, createdAt: new Date().toISOString() },
        { id: 'st3', title: 'Leave feedback', completed: false, createdAt: new Date().toISOString() },
      ],
      timeTracking: {
        totalTime: 0,
        entries: [],
        pomodoroSessions: [],
        estimatedTime: 45,
      }
    }
  },
  {
    id: 'template_blog_post',
    name: 'Blog Post',
    description: 'Write and publish blog article',
    icon: '✍️',
    category: 'Content',
    defaultValues: {
      priority: 'medium',
      status: 'todo',
      subtasks: [
        { id: 'st1', title: 'Research topic', completed: false, createdAt: new Date().toISOString() },
        { id: 'st2', title: 'Create outline', completed: false, createdAt: new Date().toISOString() },
        { id: 'st3', title: 'Write draft', completed: false, createdAt: new Date().toISOString() },
        { id: 'st4', title: 'Edit and proofread', completed: false, createdAt: new Date().toISOString() },
        { id: 'st5', title: 'Add images', completed: false, createdAt: new Date().toISOString() },
        { id: 'st6', title: 'Publish', completed: false, createdAt: new Date().toISOString() },
      ],
      timeTracking: {
        totalTime: 0,
        entries: [],
        pomodoroSessions: [],
        estimatedTime: 180,
      }
    }
  },
];

// Inbox
export const getInboxItems = (): InboxItem[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.INBOX);
  return data ? JSON.parse(data) : [];
};

export const saveInboxItems = (items: InboxItem[]) => {
  localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(items));
};

export const addInboxItem = (item: InboxItem) => {
  const items = getInboxItems();
  items.unshift(item);
  saveInboxItems(items);
};

export const deleteInboxItem = (itemId: string) => {
  const items = getInboxItems();
  saveInboxItems(items.filter(i => i.id !== itemId));
};

export const markInboxItemProcessed = (itemId: string) => {
  const items = getInboxItems();
  const index = items.findIndex(i => i.id === itemId);
  if (index !== -1) {
    items[index].processed = true;
    saveInboxItems(items);
  }
};

// Focus Mode
export const getFocusedTask = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.FOCUS_TASK);
};

export const setFocusedTask = (taskId: string | null) => {
  if (taskId) {
    localStorage.setItem(STORAGE_KEYS.FOCUS_TASK, taskId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.FOCUS_TASK);
  }
};

// Export/Import
export const exportData = (): ExportData => {
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    tasks: getTasks(),
    tags: getTags(),
    categories: getCategories(),
    templates: getTemplates(),
    settings: getSettings(),
  };
};

export const importData = (data: ExportData): boolean => {
  try {
    if (data.tasks) saveTasks(data.tasks);
    if (data.tags) saveTags(data.tags);
    if (data.categories) saveCategories(data.categories);
    if (data.templates) saveTemplates(data.templates);
    if (data.settings) saveSettings(data.settings);
    return true;
  } catch (error) {
    console.error('Import failed:', error);
    return false;
  }
};

export const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToJSON = () => {
  const data = exportData();
  const filename = `9td-backup-${new Date().toISOString().split('T')[0]}.json`;
  downloadJSON(data, filename);
};

export const exportToCSV = () => {
  const tasks = getTasks();
  const headers = ['Title', 'Description', 'Priority', 'Status', 'Due Date', 'Created', 'Completed'];
  const rows = tasks.map(task => [
    task.title,
    task.description,
    task.priority,
    task.status,
    task.dueDate || '',
    task.createdAt,
    task.completedAt || '',
  ]);
  
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `9td-tasks-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Auto Backup
const autoBackup = () => {
  const settings = getSettings();
  if (!settings.enableAutoBackup) return;
  
  const lastBackup = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
  const now = Date.now();
  
  if (!lastBackup || (now - parseInt(lastBackup)) > settings.autoBackupInterval * 60 * 60 * 1000) {
    const data = exportData();
    localStorage.setItem(`ntd_auto_backup_${now}`, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now.toString());
    
    // Keep only last 5 auto backups
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys.filter(k => k.startsWith('ntd_auto_backup_')).sort();
    if (backupKeys.length > 5) {
      backupKeys.slice(0, backupKeys.length - 5).forEach(k => localStorage.removeItem(k));
    }
  }
};

// Recurring Tasks Helper
export const generateNextOccurrence = (task: Task): Task | null => {
  if (!task.recurring?.enabled || !task.recurring.pattern) return null;
  
  const pattern = task.recurring.pattern;
  const now = new Date();
  let nextDate: Date;
  
  switch (pattern.frequency) {
    case 'daily':
      nextDate = addDays(now, pattern.interval);
      break;
    case 'weekly':
      nextDate = addWeeks(now, pattern.interval);
      break;
    case 'monthly':
      nextDate = addMonths(now, pattern.interval);
      break;
    case 'yearly':
      nextDate = addYears(now, pattern.interval);
      break;
    default:
      return null;
  }
  
  // Check if we should stop generating
  if (pattern.endDate && nextDate > new Date(pattern.endDate)) return null;
  if (pattern.endAfterOccurrences) {
    const tasks = getTasks();
    const occurrences = tasks.filter(t => t.recurring?.parentTaskId === task.id).length;
    if (occurrences >= pattern.endAfterOccurrences) return null;
  }
  
  // Create new task instance
  const newTask: Task = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    dueDate: nextDate.toISOString(),
    status: 'todo',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    completedAt: undefined,
    recurring: {
      ...task.recurring,
      parentTaskId: task.id,
    }
  };
  
  return newTask;
};

export const processRecurringTasks = () => {
  const tasks = getTasks();
  const now = new Date();
  
  tasks.forEach(task => {
    if (task.recurring?.enabled && task.status === 'completed') {
      const nextOccurrence = task.recurring.nextOccurrence;
      if (!nextOccurrence || new Date(nextOccurrence) <= now) {
        const newTask = generateNextOccurrence(task);
        if (newTask) {
          addTask(newTask);
          updateTask(task.id, {
            recurring: {
              ...task.recurring,
              nextOccurrence: newTask.dueDate,
              lastGenerated: now.toISOString(),
            }
          });
        }
      }
    }
  });
};

// Comment Management
export const addComment = (taskId: string, content: string, author: string = 'You') => {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  
  const comment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    author,
    createdAt: new Date().toISOString(),
  };
  
  const updatedComments = [...(task.comments || []), comment];
  updateTask(taskId, { comments: updatedComments });
  
  addLog({
    id: `log_${Date.now()}`,
    taskId,
    action: 'commented',
    description: `Comment added to "${task.title}"`,
    timestamp: new Date().toISOString(),
  });
};

export const updateComment = (taskId: string, commentId: string, content: string) => {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.comments) return;
  
  const updatedComments = task.comments.map(c => 
    c.id === commentId 
      ? { ...c, content, updatedAt: new Date().toISOString() }
      : c
  );
  
  updateTask(taskId, { comments: updatedComments });
};

export const deleteComment = (taskId: string, commentId: string) => {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.comments) return;
  
  const updatedComments = task.comments.filter(c => c.id !== commentId);
  updateTask(taskId, { comments: updatedComments });
};

// Default data
const getDefaultTags = (): Tag[] => [
  { id: 'tag_1', name: 'Bug', color: '#ef4444' },
  { id: 'tag_2', name: 'Feature', color: '#3b82f6' },
  { id: 'tag_3', name: 'Enhancement', color: '#8b5cf6' },
  { id: 'tag_4', name: 'Documentation', color: '#14b8a6' },
  { id: 'tag_5', name: 'Urgent', color: '#f59e0b' },
  { id: 'tag_6', name: 'Design', color: '#ec4899' },
];

const getDefaultCategories = (): Category[] => [
  { id: 'cat_1', name: 'Development', color: '#3b82f6', icon: '💻' },
  { id: 'cat_2', name: 'Design', color: '#ec4899', icon: '🎨' },
  { id: 'cat_3', name: 'Marketing', color: '#14b8a6', icon: '📢' },
  { id: 'cat_4', name: 'Sales', color: '#f59e0b', icon: '💰' },
  { id: 'cat_5', name: 'Support', color: '#8b5cf6', icon: '🛟' },
  { id: 'cat_6', name: 'Research', color: '#06b6d4', icon: '🔬' },
];