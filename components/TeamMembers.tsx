'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'

const teamMembers = [
  "Clare",
  "Richie",
  "Candice",
  "Nyash",
  "Shaun",
  "Newbie"
]

// Simple fallback avatar component (using initials)
const AvatarFallbackComponent: React.FC<{ name: string }> = ({ name }) => (
  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
    <span className="text-lg font-bold text-gray-600">{name.charAt(0)}</span>
  </div>
)

const TeamMembers: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold mb-6"
      >
        Team Members
      </motion.h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {teamMembers.map((member, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <AvatarFallbackComponent name={member} />
            <div className="flex flex-col">
              <span className="text-lg font-medium">{member}</span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <User size={14} />
                Team Member
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default TeamMembers
