"use client"

import { AppSettings } from '@/types/task'

interface DashboardTitleProps {
  settings: AppSettings
}

export function DashboardTitle({ settings }: DashboardTitleProps) {
  if (!settings.showTitle) return null

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  }

  const fontClasses = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    display: 'font-display',
  }

  const classes = [
    sizeClasses[settings.titleSize],
    fontClasses[settings.titleFont],
    settings.titleBold ? 'font-bold' : 'font-normal',
    settings.titleItalic ? 'italic' : '',
    settings.titleUnderline ? 'underline' : '',
    settings.titleUppercase ? 'uppercase' : '',
    settings.titleShadow ? 'drop-shadow-lg' : '',
    'transition-all duration-300 whitespace-nowrap',
  ].filter(Boolean).join(' ')

  const titleStyle: React.CSSProperties = {
    color: settings.titleColor,
    backgroundColor: settings.titleBackgroundColor || 'transparent',
    padding: settings.titlePadding ? `${settings.titlePadding}px` : undefined,
    borderRadius: settings.titleBorderRadius ? `${settings.titleBorderRadius}px` : undefined,
    letterSpacing: settings.titleLetterSpacing ? `${settings.titleLetterSpacing}px` : undefined,
    transform: settings.titleRotation ? `rotate(${settings.titleRotation}deg)` : undefined,
    ...(settings.titleOutline && {
      textShadow: `
        -1px -1px 0 ${settings.titleOutlineColor},
        1px -1px 0 ${settings.titleOutlineColor},
        -1px 1px 0 ${settings.titleOutlineColor},
        1px 1px 0 ${settings.titleOutlineColor}
      `,
    }),
  }

  return (
    <div className={classes} style={titleStyle}>
      {settings.dashboardTitle}
    </div>
  )
}