import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`bg-card rounded-xl border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-200 ${className}`}
      {...props}
    />
  )
)

export const MotionCard = motion(Card)
export default Card
