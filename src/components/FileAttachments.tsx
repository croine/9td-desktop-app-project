"use client"

import { useState, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  FileText, 
  FileVideo, 
  FileAudio,
  X,
  Download,
  Eye,
  Paperclip,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { Attachment } from '@/types/task'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface FileAttachmentsProps {
  taskId: string
  attachments: Attachment[]
  onAttachmentsChange?: (attachments: Attachment[]) => void
  readOnly?: boolean
  compact?: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/*',
  'application/pdf',
  'text/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'video/*',
  'audio/*',
]

export function FileAttachments({
  taskId,
  attachments = [],
  onAttachmentsChange,
  readOnly = false,
  compact = false
}: FileAttachmentsProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon
    if (type.startsWith('video/')) return FileVideo
    if (type.startsWith('audio/')) return FileAudio
    if (type.includes('pdf')) return FileText
    return File
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`
    }

    const isAllowed = ALLOWED_TYPES.some(type => {
      if (type.endsWith('/*')) {
        const prefix = type.split('/')[0]
        return file.type.startsWith(prefix + '/')
      }
      return file.type === type
    })

    if (!isAllowed) {
      return 'File type not supported'
    }

    return null
  }

  const uploadFile = async (file: File) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      toast.error('Please sign in to upload files')
      return null
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const newAttachments: Attachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const error = validateFile(file)

      if (error) {
        toast.error(`${file.name}: ${error}`)
        continue
      }

      const attachment = await uploadFile(file)
      if (attachment) {
        newAttachments.push(attachment)
        toast.success(`${file.name} uploaded successfully`)
      } else {
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    if (newAttachments.length > 0 && onAttachmentsChange) {
      onAttachmentsChange([...attachments, ...newAttachments])
    }

    setUploading(false)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDelete = async (attachmentId: string) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      toast.error('Please sign in to delete files')
      return
    }

    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      if (onAttachmentsChange) {
        onAttachmentsChange(attachments.filter(a => a.id !== attachmentId))
      }
      toast.success('Attachment deleted')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete attachment')
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      toast.error('Please sign in to download files')
      return
    }

    try {
      const response = await fetch(`/api/attachments/${attachment.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Download started')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!readOnly && (
        <Card
          className={`border-2 border-dashed transition-all cursor-pointer ${
            dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-8 text-center">
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">
              {dragOver ? 'Drop files here' : 'Upload attachments'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files or click to browse
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
              <Badge variant="outline">Images</Badge>
              <Badge variant="outline">PDFs</Badge>
              <Badge variant="outline">Documents</Badge>
              <Badge variant="outline">Videos</Badge>
              <Badge variant="outline">Audio</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            accept={ALLOWED_TYPES.join(',')}
          />
        </Card>
      )}

      {/* Uploading State */}
      {uploading && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Uploading files...</span>
          </div>
        </Card>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Attachments ({attachments.length})
          </h4>
          <AnimatePresence>
            {attachments.map((attachment) => {
              const Icon = getFileIcon(attachment.type)
              const isImage = attachment.type.startsWith('image/')
              
              return (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-3 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      {/* File Icon/Preview */}
                      <div className="flex-shrink-0">
                        {isImage ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{attachment.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {isImage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPreviewFile(attachment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(attachment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(attachment.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {attachments.length === 0 && readOnly && (
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No attachments</p>
          </div>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="mt-4">
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Attachment Indicator Badge for Task Cards
export function AttachmentIndicator({ count }: { count: number }) {
  if (count === 0) return null
  
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <Paperclip className="h-3 w-3" />
      {count}
    </Badge>
  )
}
