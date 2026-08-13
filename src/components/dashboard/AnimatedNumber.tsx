import { useEffect, useRef, useState } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  groupSeparator?: string
}

export function AnimatedNumber({
  value,
  duration = 1.4,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  groupSeparator = ' ',
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!inView) return
    motionValue.set(value)
  }, [inView, value, motionValue])

  useEffect(() => {
    const unsubscribe = spring.on('change', latest => {
      const fixed = latest.toFixed(decimals)
      const parts = fixed.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
      setDisplay(`${prefix}${parts.join('.')}${suffix}`)
    })
    return unsubscribe
  }, [spring, decimals, prefix, suffix, groupSeparator])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
