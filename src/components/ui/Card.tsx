import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`glass-card p-6 rounded-glass shadow-sm hover:shadow-md transition-shadow ${className}`}
      {...props}
    />
  )
)

export const MotionCard = motion(Card)
export default Card