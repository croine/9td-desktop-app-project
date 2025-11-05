"use client"

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export function AnimatedTitle() {
  const titleRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative whitespace-nowrap" ref={titleRef}>
      <motion.div
        className="font-display text-5xl font-bold tracking-tight inline-flex items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.span
          className="inline-flex items-center bg-gradient-to-br from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(139, 92, 246, 0.3))',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <motion.span
            className="inline-block"
            animate={{
              rotateY: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1
            }}
            style={{
              display: 'inline-block',
              transformStyle: 'preserve-3d',
            }}
          >
            9
          </motion.span>
          <motion.span
            className="inline-block"
            animate={{
              rotateX: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1,
              delay: 0.2
            }}
            style={{
              display: 'inline-block',
              transformStyle: 'preserve-3d',
            }}
          >
            T
          </motion.span>
          <motion.span
            className="inline-block"
            animate={{
              rotateZ: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1,
              delay: 0.4
            }}
            style={{
              display: 'inline-block',
              transformStyle: 'preserve-3d',
            }}
          >
            D
          </motion.span>
        </motion.span>
      </motion.div>
    </div>
  )
}