"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Link, Plus, ExternalLink, Edit2, Trash2, Globe } from 'lucide-react'
import { toast } from 'sonner'

interface QuickLink {
  id: string
  title: string
  url: string
  icon?: string
  createdAt: string
}

const STORAGE_KEY = '9td_quick_links'

export function QuickLinksWidget() {
  const [links, setLinks] = useState<QuickLink[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null)
  const [formData, setFormData] = useState({ title: '', url: '' })

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
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.url.trim()) {
      toast.error('Please fill in all fields')
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
          ? { ...link, title: formData.title.trim(), url }
          : link
      )
      saveLinks(updated)
      toast.success('Link updated')
    } else {
      const newLink: QuickLink = {
        id: `link_${Date.now()}`,
        title: formData.title.trim(),
        url,
        createdAt: new Date().toISOString(),
      }
      saveLinks([...links, newLink])
      toast.success('Link added')
    }

    setFormData({ title: '', url: '' })
    setEditingLink(null)
    setIsOpen(false)
  }

  const handleEdit = (link: QuickLink) => {
    setEditingLink(link)
    setFormData({ title: link.title, url: link.url })
    setIsOpen(true)
  }

  const handleDelete = (linkId: string) => {
    saveLinks(links.filter(link => link.id !== linkId))
    toast.success('Link deleted')
  }

  const handleOpenDialog = () => {
    setEditingLink(null)
    setFormData({ title: '', url: '' })
    setIsOpen(true)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Quick Links</h3>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLink ? 'Edit Link' : 'Add Quick Link'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Project Docs"
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="e.g., https://example.com"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingLink ? 'Update' : 'Add'} Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No quick links yet</p>
          <p className="text-sm">Add frequently accessed websites or resources</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {links.map(link => (
            <Card key={link.id} className="p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 flex-1 min-w-0 hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span className="font-medium truncate">{link.title}</span>
                </a>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleEdit(link)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(link.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  )
}
