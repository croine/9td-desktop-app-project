"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Link, Plus, Edit2, Trash2, Globe, Smile } from 'lucide-react'
import { toast } from 'sonner'
import { QuickLink } from '@/types/task'

const STORAGE_KEY = '9td_quick_links'

// Popular emoji icons for quick selection
const POPULAR_ICONS = [
  '🌐', '📧', '💼', '📱', '🎨', '📊', '📝', '🔧',
  '🎯', '💡', '🚀', '📚', '🎵', '🎮', '📷', '🏠',
  '⚡', '🔥', '💻', '📦', '🔗', '🌟', '💰', '📈'
]

export function QuickLinksManager() {
  const [links, setLinks] = useState<QuickLink[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null)
  const [formData, setFormData] = useState({ title: '', url: '', customIcon: '' })
  const [showIconPicker, setShowIconPicker] = useState(false)

  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = () => {
    const data = localStorage.getItem(STORAGE_KEY)
    setLinks(data ? JSON.parse(data) : [])
  }

  const saveLinks = (newLinks: QuickLink[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLinks))
    setLinks(newLinks)
    // Dispatch event to update dropdown
    window.dispatchEvent(new Event('quickLinksUpdate'))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.url.trim()) {
      toast.error('Please fill in title and URL')
      return
    }

    // Ensure URL has protocol
    let url = formData.url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    if (editingLink) {
      const updated = links.map(link =>
        link.id === editingLink.id
          ? { 
              ...link, 
              title: formData.title.trim(), 
              url,
              customIcon: formData.customIcon.trim() || undefined
            }
          : link
      )
      saveLinks(updated)
      toast.success('Link updated successfully')
    } else {
      const newLink: QuickLink = {
        id: `link_${Date.now()}`,
        title: formData.title.trim(),
        url,
        customIcon: formData.customIcon.trim() || undefined,
        createdAt: new Date().toISOString(),
      }
      saveLinks([...links, newLink])
      toast.success('Link added successfully')
    }

    setFormData({ title: '', url: '', customIcon: '' })
    setEditingLink(null)
    setIsOpen(false)
    setShowIconPicker(false)
  }

  const handleEdit = (link: QuickLink) => {
    setEditingLink(link)
    setFormData({ 
      title: link.title, 
      url: link.url,
      customIcon: link.customIcon || ''
    })
    setIsOpen(true)
  }

  const handleDelete = (linkId: string) => {
    saveLinks(links.filter(link => link.id !== linkId))
    toast.success('Link deleted successfully')
  }

  const handleOpenDialog = () => {
    setEditingLink(null)
    setFormData({ title: '', url: '', customIcon: '' })
    setShowIconPicker(false)
    setIsOpen(true)
  }

  const getDomain = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return ''
    }
  }

  const getFaviconUrl = (url: string): string => {
    const domain = getDomain(url)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">Quick Links</h3>
              <p className="text-sm text-muted-foreground">
                Manage your frequently accessed websites and resources
              </p>
            </div>
          </div>
          <Button onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Globe className="h-16 w-16 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No quick links yet</p>
            <p className="text-sm mt-1">Add your frequently accessed websites to access them quickly from the header</p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map(link => (
              <Card key={link.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  {/* Icon Preview */}
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
                    {link.customIcon ? (
                      <span className="text-2xl">{link.customIcon}</span>
                    ) : (
                      <img
                        src={getFaviconUrl(link.url)}
                        alt={link.title}
                        className="h-6 w-6"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `<svg class="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>`
                          }
                        }}
                      />
                    )}
                  </div>

                  {/* Link Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{link.title}</h4>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate block"
                    >
                      {link.url}
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(link)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Edit Link' : 'Add Quick Link'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., GitHub, Gmail, Project Docs"
              />
            </div>
            
            <div>
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="e.g., https://github.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The website favicon will be auto-detected
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="customIcon">Custom Icon (Optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="h-7 text-xs"
                >
                  <Smile className="h-3.5 w-3.5 mr-1" />
                  Pick Icon
                </Button>
              </div>
              <Input
                id="customIcon"
                value={formData.customIcon}
                onChange={(e) => setFormData({ ...formData, customIcon: e.target.value })}
                placeholder="Enter emoji or leave empty for auto-detect"
                className="text-center text-2xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use any emoji to override the website favicon
              </p>
              
              {showIconPicker && (
                <div className="mt-3 p-3 border rounded-lg bg-muted/50">
                  <p className="text-xs font-medium mb-2">Popular Icons</p>
                  <div className="grid grid-cols-8 gap-2">
                    {POPULAR_ICONS.map((icon, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, customIcon: icon })
                          setShowIconPicker(false)
                        }}
                        className="h-10 w-10 rounded-lg hover:bg-background border border-border flex items-center justify-center text-2xl transition-colors"
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                {editingLink ? 'Update Link' : 'Add Link'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false)
                  setShowIconPicker(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
