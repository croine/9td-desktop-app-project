"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'

interface LogoProps {
  className?: string
}

export function Logo({ className = '' }: LogoProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
    >
      {/* Glass squared container with border outline - minimal padding for perfect fit */}
      <div className="rounded-lg p-0.5 flex items-center justify-center bg-background/50 backdrop-blur-sm border border-input shadow-sm">
        <motion.div
          animate={{
            rotate: isHovered ? 360 : 0
          }}
          transition={{
            duration: 2,
            ease: "easeInOut"
          }}
        >
          <img 
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/cT1Jbvl-1761150151881.jpeg?width=8000&height=8000&resize=contain"
            alt="9TD Logo"
            className="h-10 w-10 object-contain rounded-md"
          />
        </motion.div>
      </div>
    </motion.div>
  )
}