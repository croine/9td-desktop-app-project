"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link as LinkIcon, Settings } from 'lucide-react'
import { QuickLink } from '@/types/task'

const STORAGE_KEY = '9td_quick_links'

interface QuickLinksDropdownProps {
  onOpenSettings?: () => void
}

export function QuickLinksDropdown({ onOpenSettings }: QuickLinksDropdownProps) {
  const [links, setLinks] = useState<QuickLink[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadLinks()
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadLinks()
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('quickLinksUpdate', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('quickLinksUpdate', handleStorageChange)
    }
  }, [])

  const loadLinks = () => {
    const data = localStorage.getItem(STORAGE_KEY)
    setLinks(data ? JSON.parse(data) : [])
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

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    
    // Close dropdown
    setIsOpen(false)
    
    // Handle iframe compatibility
    const isInIframe = window.self !== window.top
    if (isInIframe) {
      window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: fullUrl } }, "*")
    } else {
      window.open(fullUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (links.length === 0) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <LinkIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3">
        <div className="flex items-center justify-between mb-3 pb-2 border-b">
          <h3 className="font-semibold text-sm">Quick Links</h3>
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
                onOpenSettings()
              }}
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Manage</span>
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={(e) => handleLinkClick(e, link.url)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-accent transition-colors group cursor-pointer"
              title={link.title}
              type="button"
            >
              <div className="h-10 w-10 flex items-center justify-center pointer-events-none">
                {link.customIcon ? (
                  <span className="text-2xl pointer-events-none">{link.customIcon}</span>
                ) : (
                  <img
                    src={getFaviconUrl(link.url)}
                    alt={link.title}
                    className="h-6 w-6 pointer-events-none"
                    onError={(e) => {
                      // Fallback to generic icon
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
              <span className="text-[10px] font-medium text-center leading-tight max-w-full truncate pointer-events-none">
                {link.title}
              </span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}