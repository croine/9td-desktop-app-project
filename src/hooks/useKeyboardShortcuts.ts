"use client"

import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  callback: () => void
  description: string
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlOrMeta = shortcut.ctrl || shortcut.meta
        const isCtrlOrMeta = event.ctrlKey || event.metaKey
        
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const modifierMatches = ctrlOrMeta ? isCtrlOrMeta : true
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey

        if (keyMatches && modifierMatches && shiftMatches) {
          // Don't trigger if user is typing in an input/textarea
          const target = event.target as HTMLElement
          if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
          ) {
            // Allow Ctrl/Cmd+K even in inputs
            if (!(shortcut.key === 'k' && isCtrlOrMeta)) {
              return
            }
          }

          event.preventDefault()
          shortcut.callback()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Predefined shortcuts helper
export const createShortcuts = {
  createTask: (callback: () => void): KeyboardShortcut => ({
    key: 'k',
    ctrl: true,
    meta: true,
    callback,
    description: 'Create new task'
  }),
  
  focusSearch: (callback: () => void): KeyboardShortcut => ({
    key: '/',
    ctrl: true,
    meta: true,
    callback,
    description: 'Focus search'
  }),
  
  numberNav: (number: number, callback: () => void): KeyboardShortcut => ({
    key: number.toString(),
    callback,
    description: `Navigate to view ${number}`
  }),
}
