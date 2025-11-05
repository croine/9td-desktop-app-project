import { TaskComment } from '@/types/comment'

const STORAGE_KEY = '9td_task_comments'

export function getComments(): TaskComment[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function getTaskComments(taskId: string): TaskComment[] {
  return getComments().filter(comment => comment.taskId === taskId)
}

export function addComment(comment: Omit<TaskComment, 'id' | 'createdAt' | 'updatedAt'>): TaskComment {
  const newComment: TaskComment = {
    ...comment,
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  const comments = getComments()
  comments.push(newComment)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments))
  
  return newComment
}

export function updateComment(commentId: string, updates: Partial<TaskComment>): void {
  const comments = getComments()
  const index = comments.findIndex(c => c.id === commentId)
  
  if (index !== -1) {
    comments[index] = {
      ...comments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments))
  }
}

export function deleteComment(commentId: string): void {
  const comments = getComments().filter(c => c.id !== commentId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments))
}

export function deleteTaskComments(taskId: string): void {
  const comments = getComments().filter(c => c.taskId !== taskId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments))
}
