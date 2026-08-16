import { motion } from 'framer-motion'
import { ChevronLeft } from 'react-feather'

type Tone = 'green' | 'orange' | 'rose'

interface SidebarToggleProps {
  collapsed: boolean
  onToggle: () => void
  tone?: Tone
}

const TONE_COLORS: Record<Tone, string> = {
  green: 'text-[#32612D]',
  orange: 'text-[#893101]',
  rose: 'text-[#905D5D]',
}

export default function SidebarToggle({ collapsed, onToggle, tone = 'green' }: SidebarToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      aria-label={collapsed ? 'Ouvrir le menu latéral' : 'Fermer le menu latéral'}
      title={collapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
      initial={false}
      animate={{ rotate: collapsed ? 180 : 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.6 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className={`absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-7 h-7 rounded-full bg-white ${TONE_COLORS[tone]} flex items-center justify-center border border-white/40 shadow-[0_4px_14px_rgba(0,0,0,0.30)] cursor-pointer`}
    >
      <ChevronLeft size={14} strokeWidth={2.6} />
    </motion.button>
  )
}
