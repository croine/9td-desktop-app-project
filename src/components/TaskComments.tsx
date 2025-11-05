"use client"

import { useState } from 'react'
import { Comment } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Send, Edit2, Trash2, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface TaskCommentsProps {
  comments: Comment[]
  onAddComment: (content: string) => void
  onUpdateComment: (commentId: string, content: string) => void
  onDeleteComment: (commentId: string) => void
}

export function TaskComments({
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleSubmit = () => {
    if (!newComment.trim()) return
    onAddComment(newComment)
    setNewComment('')
  }

  const handleUpdate = (commentId: string) => {
    if (!editContent.trim()) return
    onUpdateComment(commentId, editContent)
    setEditingId(null)
    setEditContent('')
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const sortedComments = [...comments].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">Comments & Notes</h3>
        <Badge variant="secondary">{comments.length}</Badge>
      </div>

      {/* Add Comment */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment or note..."
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={handleSubmit}
                disabled={!newComment.trim()}
                className="gap-2"
              >
                <Send className="h-3 w-3" />
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Comments List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedComments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <Card className="p-4">
                  <div className="flex gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{comment.author}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                              <span className="ml-1">(edited)</span>
                            )}
                          </p>
                        </div>
                        {editingId !== comment.id && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => startEdit(comment)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => onDeleteComment(comment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {editingId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(comment.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(null)
                                setEditContent('')
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {comments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet. Be the first to add one!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
