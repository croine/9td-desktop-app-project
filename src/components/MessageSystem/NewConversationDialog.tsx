"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, X, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
}

interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableUsers: User[]
  currentUserId: string
  onCreateConversation: (participantIds: string[], name: string | null, isGroup: boolean) => Promise<void>
}

export function NewConversationDialog({
  open,
  onOpenChange,
  availableUsers,
  currentUserId,
  onCreateConversation
}: NewConversationDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [conversationName, setConversationName] = useState('')
  const [isGroup, setIsGroup] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const filteredUsers = availableUsers
    .filter(user => user.id !== currentUserId)
    .filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one participant')
      return
    }

    if (isGroup && !conversationName.trim()) {
      toast.error('Please enter a group name')
      return
    }

    setIsCreating(true)
    try {
      await onCreateConversation(
        selectedUsers,
        isGroup ? conversationName.trim() : null,
        isGroup
      )
      
      // Reset form
      setSelectedUsers([])
      setConversationName('')
      setSearchQuery('')
      setIsGroup(false)
      onOpenChange(false)
      
      toast.success('Conversation created successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create conversation')
    } finally {
      setIsCreating(false)
    }
  }

  const selectedUserObjects = availableUsers.filter(u => selectedUsers.includes(u.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a new conversation with team members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="is-group" className="cursor-pointer">
                Create Group Conversation
              </Label>
            </div>
            <Switch
              id="is-group"
              checked={isGroup}
              onCheckedChange={setIsGroup}
            />
          </div>

          {/* Group Name (if group) */}
          {isGroup && (
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                placeholder="Enter group name..."
                value={conversationName}
                onChange={(e) => setConversationName(e.target.value)}
              />
            </div>
          )}

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>
                Selected ({selectedUsers.length})
                {!isGroup && selectedUsers.length > 1 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Enable group mode for multiple participants)
                  </span>
                )}
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedUserObjects.map(user => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {user.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-destructive/20"
                      onClick={() => handleToggleUser(user.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Users */}
          <div className="space-y-2">
            <Label>Add Participants</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* User List */}
          <ScrollArea className="h-[250px] rounded-md border">
            <div className="p-2 space-y-1">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No users found' : 'No available users'}
                  </p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUsers.includes(user.id)
                  const initials = user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)

                  return (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-auto py-2 px-2",
                        isSelected && "bg-accent"
                      )}
                      onClick={() => handleToggleUser(user.id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </Button>
                  )
                })
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={
                selectedUsers.length === 0 || 
                (isGroup && !conversationName.trim()) ||
                (!isGroup && selectedUsers.length > 1) ||
                isCreating
              }
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Creating...
                </>
              ) : (
                'Create Conversation'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
