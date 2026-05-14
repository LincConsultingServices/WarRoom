'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export function LoadingPhase() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="text-center space-y-6"
      >
        <div className="relative">
          <div className="h-32 w-32 rounded-full border-4 border-red-600/30 flex items-center justify-center mx-auto">
            <div className="h-24 w-24 rounded-full border-2 border-red-600/50 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="h-16 w-16 rounded-full border-t-2 border-red-600"
              />
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">WAR ROOM</h1>
          <p className="text-red-400 text-sm mt-2 tracking-widest uppercase">Entering the arena...</p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-red-500 mx-auto" />
      </motion.div>
    </div>
  )
}
