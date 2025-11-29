/**
 * Enhanced Notification Service
 * Handles desktop notifications, @mentions, task alerts, and due date reminders
 */

export type NotificationType = 
  | 'task_due_soon'
  | 'task_overdue'
  | 'task_assigned'
  | 'mention'
  | 'task_completed'
  | 'task_updated'
  | 'dependency_unblocked'
  | 'reminder';

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: any;
  priority?: 'low' | 'medium' | 'high';
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationPayload[] = [];
  private listeners: Set<(notifications: NotificationPayload[]) => void> = new Set();
  private permissionGranted: boolean = false;

  private constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.loadNotifications();
      this.requestPermission();
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async requestPermission(): Promise<void> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
    }
  }

  private loadNotifications(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('9td_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  private saveNotifications(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('9td_notifications', JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  subscribe(callback: (notifications: NotificationPayload[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.notifications);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  async send(payload: Omit<NotificationPayload, 'id' | 'timestamp' | 'read'>): Promise<void> {
    const notification: NotificationPayload = {
      ...payload,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      priority: payload.priority || 'medium'
    };

    this.notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    
    this.saveNotifications();

    // Show desktop notification only in browser
    if (typeof window !== 'undefined' && this.permissionGranted && 'Notification' in window) {
      try {
        const notif = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
          requireInteraction: notification.priority === 'high'
        });

        notif.onclick = () => {
          if (notification.actionUrl) {
            window.focus();
            window.location.href = notification.actionUrl;
          }
          notif.close();
        };
      } catch (error) {
        console.error('Failed to show desktop notification:', error);
      }
    }
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  delete(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getAll(): NotificationPayload[] {
    return this.notifications;
  }

  getUnread(): NotificationPayload[] {
    return this.notifications.filter(n => !n.read);
  }
}

let _notificationServiceInstance: NotificationService | null = null;

export const notificationService = new Proxy({} as NotificationService, {
  get(target, prop) {
    if (typeof window === 'undefined') {
      // Return no-op functions during SSR
      return () => {};
    }
    if (!_notificationServiceInstance) {
      _notificationServiceInstance = NotificationService.getInstance();
    }
    const value = (_notificationServiceInstance as any)[prop];
    return typeof value === 'function' ? value.bind(_notificationServiceInstance) : value;
  }
});

/**
 * Detect @mentions in text
 */
export function detectMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
}

/**
 * Check if user should be notified for a due date
 */
export function shouldNotifyForDueDate(dueDate: string, notificationTimings: number[]): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMinutes = Math.floor((due.getTime() - now.getTime()) / (1000 * 60));
  
  // Check if current time matches any notification timing
  return notificationTimings.some(timing => {
    // Notify if within 5 minutes of the timing threshold
    return Math.abs(diffMinutes - timing) <= 5;
  });
}

/**
 * Schedule due date notifications
 */
export function scheduleDueDateNotifications(
  tasks: any[],
  notificationTimings: number[] = [15, 60, 1440] // 15min, 1hr, 1day
): void {
  if (typeof window === 'undefined') return;
  
  tasks.forEach(task => {
    if (task.dueDate && task.status !== 'completed' && task.status !== 'cancelled') {
      if (shouldNotifyForDueDate(task.dueDate, notificationTimings)) {
        const due = new Date(task.dueDate);
        const now = new Date();
        const diffMinutes = Math.floor((due.getTime() - now.getTime()) / (1000 * 60));
        
        let message = '';
        if (diffMinutes <= 0) {
          message = `Task "${task.title}" is overdue!`;
        } else if (diffMinutes <= 15) {
          message = `Task "${task.title}" is due in 15 minutes!`;
        } else if (diffMinutes <= 60) {
          message = `Task "${task.title}" is due in 1 hour!`;
        } else if (diffMinutes <= 1440) {
          message = `Task "${task.title}" is due today!`;
        }
        
        if (message) {
          notificationService.send({
            type: diffMinutes <= 0 ? 'task_overdue' : 'task_due_soon',
            title: '⏰ Task Due Soon',
            message,
            priority: diffMinutes <= 15 ? 'high' : 'medium',
            actionUrl: '/#/your-tasks',
            metadata: { taskId: task.id }
          });
        }
      }
    }
  });
}