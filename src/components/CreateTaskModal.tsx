"use client";

import React, { useState, useEffect } from "react";
import {
  Task,
  Tag,
  Category,
  TaskPriority,
  TaskStatus,
  Attachment,
  TaskTemplate,
  Reminder,
} from "@/types/task";
import { TaskDependencies } from "@/components/TaskDependencies";
import { SubtaskManager } from "@/components/SubtaskManager";
import { TaskCommentsTimeline } from "@/components/TaskCommentsTimeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  X,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Repeat,
  Link as LinkIcon,
  Tag as TagIcon,
  FolderOpen,
  Users,
  FileText,
  Sparkles,
  Target,
  Zap,
  Layers,
  Link2,
  Paperclip,
  Upload,
  File,
  Bell,
  TrendingUp,
  MessageSquare,
  Eye,
  AlertCircle,
  Save,
  ChevronDown,
  ChevronRight,
  Rocket,
  Flag,
  ListTodo,
  Timer,
  Hash,
  Lightbulb,
  Command,
  Keyboard,
  CheckCircle,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { RecurringTaskConfig } from "@/components/RecurringTaskConfig";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


/* Optimized modal size - balanced and professional */
function PaddedFullscreenDialogContent(
  props: React.ComponentProps<typeof DialogContent>
) {
  const { className, children, ...rest } = props;
  return (
    <DialogContent
      {...rest}
      className={cn(
        // Centered positioning
        "fixed z-50 left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
        // Larger size for future features
        "w-[96vw] max-w-[1600px] h-[92vh]",
        "p-0 overflow-hidden",
        // visuals
        "rounded-2xl border bg-background shadow-2xl flex flex-col",
        className
      )}
    >
      {children}
    </DialogContent>
  );
}


interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Task) => void;
  editTask?: Task | null;
  tags: Tag[];
  categories: Category[];
  allTasks?: Task[];
  templates?: TaskTemplate[];
}

const priorityConfig = {
  low: {
    color: "from-blue-500 to-cyan-500",
    icon: Circle,
    label: "Low",
    textColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 hover:bg-blue-500/20",
    borderColor: "border-blue-500",
    dotColor: "bg-blue-500",
  },
  medium: {
    color: "from-yellow-500 to-orange-500",
    icon: AlertCircle,
    label: "Medium",
    textColor: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10 hover:bg-yellow-500/20",
    borderColor: "border-yellow-500",
    dotColor: "bg-yellow-500",
  },
  high: {
    color: "from-orange-500 to-red-500",
    icon: Flag,
    label: "High",
    textColor: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10 hover:bg-orange-500/20",
    borderColor: "border-orange-500",
    dotColor: "bg-orange-500",
  },
  urgent: {
    color: "from-red-500 to-pink-500",
    icon: Zap,
    label: "Urgent",
    textColor: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10 hover:bg-red-500/20",
    borderColor: "border-red-500",
    dotColor: "bg-red-500",
  },
};

const statusConfig = {
  todo: { color: "bg-slate-500/10 text-slate-700 dark:text-slate-300", icon: Circle, label: "To Do" },
  "in-progress": { color: "bg-blue-500/10 text-blue-700 dark:text-blue-300", icon: Clock, label: "In Progress" },
  review: { color: "bg-purple-500/10 text-purple-700 dark:text-purple-300", icon: Target, label: "Review" },
  completed: { color: "bg-green-500/10 text-green-700 dark:text-green-300", icon: CheckCircle2, label: "Completed" },
  cancelled: { color: "bg-red-500/10 text-red-700 dark:text-red-300", icon: X, label: "Cancelled" },
};

export function CreateTaskModal({
  open,
  onOpenChange,
  onSave,
  editTask,
  tags,
  categories,
  allTasks = [],
  templates = [],
}: CreateTaskModalProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoCalculateProgress, setAutoCalculateProgress] = useState(true);
  const [draftComment, setDraftComment] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["essentials"]));
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    tags: [],
    categories: [],
    assignees: [],
    dueDate: undefined,
    subtasks: [],
    recurring: undefined,
    dependencies: [],
    links: [],
    notes: "",
    attachments: [],
    progress: 0,
    reminders: [],
    comments: [],
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    if (!open || !hasUnsavedChanges) return;

    const draftKey = editTask?.id ? `draft-edit-${editTask.id}` : 'draft-new-task';
    const interval = setInterval(() => {
      localStorage.setItem(draftKey, JSON.stringify({
        formData,
        selectedDate,
        notes,
        links,
        attachments,
        timestamp: new Date().toISOString(),
      }));
      setLastAutoSave(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [formData, selectedDate, notes, links, attachments, open, hasUnsavedChanges, editTask]);

  // Load draft on open
  useEffect(() => {
    if (!open || editTask) return;

    const draftKey = 'draft-new-task';
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const draftDate = new Date(draft.timestamp);
        const hoursSince = (Date.now() - draftDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSince < 24) {
          toast.info("Found unsaved draft", {
            description: "Your previous work has been restored",
            duration: 3000,
          });
          setFormData(draft.formData);
          setSelectedDate(draft.selectedDate ? new Date(draft.selectedDate) : undefined);
          setNotes(draft.notes || "");
          setLinks(draft.links || []);
          setAttachments(draft.attachments || []);
        }
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, [open, editTask]);

  // Reset form
  useEffect(() => {
    if (open && editTask) {
      setFormData({
        title: editTask.title || "",
        description: editTask.description || "",
        priority: editTask.priority || "medium",
        status: editTask.status || "todo",
        tags: editTask.tags || [],
        categories: editTask.categories || [],
        assignees: editTask.assignees || [],
        dueDate: editTask.dueDate,
        subtasks: editTask.subtasks || [],
        recurring: editTask.recurring,
        dependencies: editTask.dependencies || [],
        links: editTask.links,
        notes: editTask.notes,
        attachments: editTask.attachments,
        progress: editTask.progress || 0,
        reminders: editTask.reminders,
        timeTracking: editTask.timeTracking,
        comments: editTask.comments || [],
      });
      setSelectedDate(editTask.dueDate ? new Date(editTask.dueDate) : undefined);
      const estimatedTime = editTask.timeTracking?.estimatedTime || 0;
      setEstimatedHours(Math.floor(estimatedTime / 60).toString());
      setEstimatedMinutes((estimatedTime % 60).toString());
      setNotes(editTask.notes || "");
      setLinks(editTask.links || []);
      setAttachments(editTask.attachments || []);
      setProgress(editTask.progress || 0);
      setReminders(editTask.reminders || []);
    } else if (open && !editTask) {
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        tags: [],
        categories: [],
        assignees: [],
        dueDate: undefined,
        subtasks: [],
        recurring: undefined,
        dependencies: [],
        links: [],
        notes: "",
        attachments: [],
        progress: 0,
        reminders: [],
        comments: [],
      });
      setSelectedDate(undefined);
      setSelectedTime("");
      setEstimatedHours("");
      setEstimatedMinutes("");
      setNotes("");
      setLinks([]);
      setAttachments([]);
      setProgress(0);
      setReminders([]);
      setHasUnsavedChanges(false);
      setDraftComment("");
      setExpandedSections(new Set(["essentials"]));
    }
  }, [editTask, open]);

  // Unsaved changes flag
  useEffect(() => {
    if (formData.title || formData.description) setHasUnsavedChanges(true);
  }, [formData]);

  // Auto progress from subtasks
  useEffect(() => {
    if (autoCalculateProgress && formData.subtasks && formData.subtasks.length > 0) {
      const completed = formData.subtasks.filter((st) => st.completed).length;
      const total = formData.subtasks.length;
      setProgress(Math.round((completed / total) * 100));
    }
  }, [formData.subtasks, autoCalculateProgress]);

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('task-form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const toggleSection = (section: string) => {
    const next = new Set(expandedSections);
    next.has(section) ? next.delete(section) : next.add(section);
    setExpandedSections(next);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
        newAttachments.push({
          id: `attachment_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: base64,
          uploadedAt: new Date().toISOString(),
        });
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    toast.success(`${newAttachments.length} file(s) attached`);
  };

  const setQuickDate = (days: number) => {
    const d = addDays(new Date(), days);
    setSelectedDate(d);
    toast.success(`Due date set to ${format(d, "PPP")}`);
  };

  const addReminder = (type: "relative" | "absolute", minutesBefore?: number, time?: string) => {
    setReminders((r) => [
      ...r,
      {
        id: `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type,
        minutesBefore,
        time,
        sent: false,
      },
    ]);
    toast.success("Reminder added");
  };

  const applyTemplate = (template: TaskTemplate) => {
    setFormData((f) => ({
      ...f,
      title: template.name,
      description: template.description,
      priority: template.defaultValues.priority || "medium",
      status: template.defaultValues.status || "todo",
      subtasks: template.defaultValues.subtasks || [],
    }));
    toast.success(`Template "${template.name}" applied`);
  };

  const handleSubmit = (e: React.FormEvent, createAnother = false) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmedTitle = formData.title?.trim();
    if (!trimmedTitle) {
      toast.error("Please enter a task title");
      return;
    }
    if (!selectedDate) {
      toast.warning('No due date set - task will appear in "Someday" list');
    }

    const now = new Date().toISOString();
    const estimatedTime =
      (parseInt((document.getElementById("hours") as HTMLInputElement)?.value || "0") || 0) * 60 +
      (parseInt((document.getElementById("mins") as HTMLInputElement)?.value || "0") || 0);

    const task: Task = {
      id: editTask?.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: trimmedTitle,
      description: formData.description?.trim() || "",
      priority: (formData.priority as TaskPriority) || "medium",
      status: (formData.status as TaskStatus) || "todo",
      tags: formData.tags || [],
      categories: formData.categories || [],
      assignees: formData.assignees || [],
      dueDate: selectedDate?.toISOString(),
      subtasks: formData.subtasks || [],
      createdAt: editTask?.createdAt || now,
      updatedAt: now,
      recurring: formData.recurring,
      dependencies: formData.dependencies || [],
      links: links.length > 0 ? links : undefined,
      notes: notes.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      progress,
      reminders: reminders.length > 0 ? reminders : undefined,
      timeTracking: {
        totalTime: editTask?.timeTracking?.totalTime || 0,
        entries: editTask?.timeTracking?.entries || [],
        pomodoroSessions: editTask?.timeTracking?.pomodoroSessions || [],
        estimatedTime: estimatedTime || undefined,
      },
      comments: formData.comments || [],
    };

    if (!editTask && draftComment.trim()) {
      task.comments = [
        {
          id: `comment_${Date.now()}`,
          content: draftComment,
          author: "You",
          timestamp: now,
        },
      ];
    }

    try {
      onSave(task);
      
      // Clear draft
      const draftKey = editTask?.id ? `draft-edit-${editTask.id}` : 'draft-new-task';
      localStorage.removeItem(draftKey);
      
      if (createAnother) {
        toast.success("Task created! Create another?");
        const keepPriority = formData.priority;
        const keepCategories = formData.categories;
        setFormData({
          title: "",
          description: "",
          priority: keepPriority,
          status: "todo",
          tags: [],
          categories: keepCategories,
          assignees: [],
          dueDate: undefined,
          subtasks: [],
          recurring: undefined,
          dependencies: [],
          links: [],
          notes: "",
          attachments: [],
          progress: 0,
          reminders: [],
          comments: [],
        });
        setSelectedDate(undefined);
        setSelectedTime("");
        setEstimatedHours("");
        setEstimatedMinutes("");
        setNotes("");
        setLinks([]);
        setAttachments([]);
        setProgress(0);
        setReminders([]);
        setDraftComment("");
        setHasUnsavedChanges(false);
      } else {
        handleClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save task. Please try again.");
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges && !confirm("You have unsaved changes. Close anyway?")) return;

    setFormData({
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
      tags: [],
      categories: [],
      assignees: [],
      dueDate: undefined,
      subtasks: [],
      recurring: undefined,
      links: [],
      notes: "",
      attachments: [],
      progress: 0,
      reminders: [],
      comments: [],
    });
    setSelectedDate(undefined);
    setSelectedTime("");
    setEstimatedHours("");
    setEstimatedMinutes("");
    setNotes("");
    setLinks([]);
    setNewLink("");
    setAttachments([]);
    setProgress(0);
    setReminders([]);
    setDraftComment("");
    setHasUnsavedChanges(false);
    onOpenChange(false);
  };

  const toggleTag = (tagId: string) => {
    setFormData((f) => {
      const cur = f.tags || [];
      return { ...f, tags: cur.includes(tagId) ? cur.filter((id) => id !== tagId) : [...cur, tagId] };
    });
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((f) => {
      const cur = f.categories || [];
      return {
        ...f,
        categories: cur.includes(categoryId) ? cur.filter((id) => id !== categoryId) : [...cur, categoryId],
      };
    });
  };

  const completedSubtasks = formData.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = formData.subtasks?.length || 0;
  const titleCharCount = formData.title?.length || 0;
  const maxTitleChars = 100;

  const PriorityIcon = priorityConfig[(formData.priority as TaskPriority) || "medium"].icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <PaddedFullscreenDialogContent>
        <div className="flex h-full min-h-0">
          {/* Left Column - Illustration & Templates */}
          <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-8 flex-col relative overflow-hidden rounded-l-2xl">
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.2),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.15),transparent_50%)]" />
            
            <div className="relative z-10 flex-1 flex flex-col">
              {/* Header */}
              <div className="text-center space-y-3 mb-6">
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 rounded-2xl rotate-6 opacity-20 animate-pulse" />
                  <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <Rocket className="w-10 h-10 text-primary-foreground" />
                  </div>
                </div>

                <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {editTask ? "Update Your Task" : "Create Your Next Task"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {editTask 
                    ? "Make changes to keep your task organized"
                    : "Stay organized and achieve your goals"
                  }
                </p>
              </div>

              {/* Feature highlights */}
              <div className="mt-auto space-y-2">
                <div className="text-xs font-semibold text-muted-foreground mb-3">Key Features</div>
                {[
                  { icon: Target, text: "Set priorities and deadlines", shortcut: "Tab to navigate" },
                  { icon: ListTodo, text: "Break down into subtasks", shortcut: "Auto progress tracking" },
                  { icon: Zap, text: "Smart suggestions", shortcut: "AI-powered recommendations" },
                  { icon: Save, text: "Auto-save drafts", shortcut: "⌘S to save manually" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-left group">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">{item.text}</div>
                      <div className="text-[10px] text-muted-foreground">{item.shortcut}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Keyboard shortcuts hint */}
              <div className="mt-4 p-3 rounded-xl bg-background/40 border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Keyboard className="h-3.5 w-3.5" />
                  <span><kbd className="px-1.5 py-0.5 rounded bg-background/80 border text-[10px] font-mono">⌘S</kbd> to save • <kbd className="px-1.5 py-0.5 rounded bg-background/80 border text-[10px] font-mono">Tab</kbd> to navigate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="flex-1 flex flex-col min-h-0 lg:w-[60%]">
            {/* Header with Progress */}
            <div className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg lg:hidden">
                    <Rocket className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <DialogTitle className="font-display text-xl font-bold">
                      {editTask ? "Edit Task" : "New Task"}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {editTask ? "Update task details" : "Fill in the details below"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {lastAutoSave && (
                    <Badge variant="outline" className="text-[10px] gap-1.5">
                      <Save className="h-3 w-3" />
                      Saved {format(lastAutoSave, 'HH:mm')}
                    </Badge>
                  )}
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="text-[10px] gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      Unsaved
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <form id="task-form" onSubmit={(e) => handleSubmit(e, false)} className="p-6 pb-32 space-y-5">
                {/* Essential Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                      Task Title <span className="text-destructive">*</span>
                      <span className={cn("ml-auto text-xs font-mono", titleCharCount > maxTitleChars ? "text-destructive" : "text-muted-foreground")}>
                        {titleCharCount}/{maxTitleChars}
                      </span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="What needs to be done?"
                      required
                      maxLength={maxTitleChars}
                      className="h-11 text-base font-medium"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Add more details..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Priority</Label>
                      <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as TaskPriority })}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(priorityConfig).map(([key, config]) => {
                            const Icon = config.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span>{config.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as TaskStatus })}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => {
                            const Icon = config.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span>{config.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start h-10", !selectedDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                        <div className="p-3 border-t">
                          <div className="text-xs font-semibold mb-2 text-muted-foreground">Quick Select</div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: 'Today', days: 0 },
                              { label: 'Tomorrow', days: 1 },
                              { label: 'In 3 days', days: 3 },
                              { label: 'Next week', days: 7 },
                              { label: 'In 2 weeks', days: 14 },
                              { label: 'In 30 days', days: 30 },
                            ].map(({ label, days }) => (
                              <Button
                                key={label}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setQuickDate(days)}
                                className="text-xs h-8"
                              >
                                {label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {selectedDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(selectedDate, 'EEEE, MMMM d')} • {Math.ceil((selectedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days from now
                      </p>
                    )}
                  </div>

                  {/* Categories */}
                  {categories.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Categories</Label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => toggleCategory(category.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                              formData.categories?.includes(category.id) ? "ring-2 ring-offset-1 scale-105" : "opacity-60 hover:opacity-100"
                            )}
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            {category.icon && <span>{category.icon}</span>}
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                              formData.tags?.includes(tag.id) ? "ring-2 ring-offset-1 scale-105" : "opacity-60 hover:opacity-100"
                            )}
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            <Hash className="h-3 w-3" />
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtasks */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold">Subtasks</Label>
                    {totalSubtasks > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {completedSubtasks}/{totalSubtasks}
                      </Badge>
                    )}
                  </div>
                  <SubtaskManager
                    subtasks={formData.subtasks || []}
                    onChange={(subtasks) => setFormData({ ...formData, subtasks })}
                    maxDepth={2}
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="border-t bg-background px-6 py-3 flex items-center justify-between">
              <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                {!editTask && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleSubmit(e as any, true)}
                    className="gap-2"
                  >
                    Save & New
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  onClick={(e) => handleSubmit(e as any, false)}
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                  disabled={!formData.title?.trim()}
                >
                  <Rocket className="h-4 w-4" />
                  {editTask ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PaddedFullscreenDialogContent>
    </Dialog>
  );
}