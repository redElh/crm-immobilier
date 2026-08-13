import { useState, useEffect, useRef, Children, ReactNode, TouchEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'react-feather'

interface CarouselProps {
  children: ReactNode
  autoPlay?: boolean
  interval?: number
  showControls?: boolean
  showIndicators?: boolean
}

export const Carousel = ({
  children,
  autoPlay = false,
  interval = 5000,
  showControls = true,
  showIndicators = true,
}: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchDelta, setTouchDelta] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const items = Children.toArray(children)
  const itemsCount = items.length

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % itemsCount)
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + itemsCount) % itemsCount)
  }

  const goToIndex = (index: number) => {
    setCurrentIndex(index)
  }

  useEffect(() => {
    if (!autoPlay || isPaused || itemsCount <= 1) return
    const timer = setInterval(goToNext, interval)
    return () => clearInterval(timer)
  }, [currentIndex, isPaused, autoPlay, interval, itemsCount])

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
    setIsDragging(true)
    setTouchDelta(0)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStart === null) return
    const delta = e.touches[0].clientX - touchStart
    setTouchDelta(delta)
  }

  const handleTouchEnd = () => {
    if (Math.abs(touchDelta) > 50) {
      if (touchDelta > 0) {
        goToPrev()
      } else {
        goToNext()
      }
    }
    setTouchStart(null)
    setTouchDelta(0)
    setIsDragging(false)
  }

  if (itemsCount === 0) return null

  const containerWidth = containerRef.current?.offsetWidth || 0
  const baseOffset = -currentIndex * 100
  const dragPercent = containerWidth > 0 ? (touchDelta / containerWidth) * 100 : 0
  const translateX = isDragging ? baseOffset + dragPercent : baseOffset

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex"
        style={{
          transform: `translateX(${translateX}%)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0"
            style={{ visibility: index === currentIndex || (isDragging && Math.abs(index - currentIndex) <= 1) ? 'visible' : 'hidden' }}
          >
            {item}
          </div>
        ))}
      </div>

      {showControls && itemsCount > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 hover:bg-background border border-border/50 shadow-sm flex items-center justify-center transition-all hover:shadow-md z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft size={16} className="text-text-secondary" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 hover:bg-background border border-border/50 shadow-sm flex items-center justify-center transition-all hover:shadow-md z-10"
            aria-label="Next slide"
          >
            <ChevronRight size={16} className="text-text-secondary" />
          </button>
        </>
      )}

      {showIndicators && itemsCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-background/70 backdrop-blur-sm rounded-full px-2 py-1.5 z-10">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'w-5 h-1.5 bg-accent'
                  : 'w-1.5 h-1.5 bg-text-tertiary/40 hover:bg-text-tertiary/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
