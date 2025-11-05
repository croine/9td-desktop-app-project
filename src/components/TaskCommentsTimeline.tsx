"use client"

import { useState } from 'react'
import { Task, Comment } from '@/types/task'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send, Trash2, Edit2, Check, X } from 'lucide-react'
import { addComment, updateComment, deleteComment } from '@/lib/storage'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface TaskCommentsTimelineProps {
  task: Task
  onUpdate: () => void
}

export const TaskCommentsTimeline = ({ task, onUpdate }: TaskCommentsTimelineProps) => {
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const comments = task.comments || []

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    addComment(task.id, newComment.trim())
    setNewComment('')
    onUpdate()
    toast.success('Comment added')
  }

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    updateComment(task.id, commentId, editContent.trim())
    setEditingId(null)
    setEditContent('')
    onUpdate()
    toast.success('Comment updated')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleDeleteComment = (commentId: string) => {
    deleteComment(task.id, commentId)
    onUpdate()
    toast.success('Comment deleted')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleAddComment()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">
          Comments & Notes
        </h3>
        <span className="text-sm text-muted-foreground">
          ({comments.length})
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card className="glass-card p-6 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              No comments yet. Add the first comment to start the discussion.
            </p>
          </Card>
        ) : (
          <div className="relative pl-6 space-y-4">
            {/* Timeline line */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

            {comments.map((comment, index) => (
              <div key={comment.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-6 top-3 w-4 h-4 rounded-full bg-primary border-2 border-background" />

                <Card className="glass-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                      {comment.updatedAt && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (edited)
                        </span>
                      )}
                    </div>

                    {editingId !== comment.id && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleStartEdit(comment)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px]"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new comment */}
      <Card className="glass-card p-4">
        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment or note... (Cmd/Ctrl + Enter to submit)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] resize-none"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Supports markdown formatting
            </p>
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              size="sm"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Add Comment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
