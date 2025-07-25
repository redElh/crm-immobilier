import { useState, useEffect, Children, ReactNode } from 'react'
import { Icon } from './Icon'

interface CarouselProps {
  children: ReactNode
  autoPlay?: boolean
  interval?: number
  showControls?: boolean
  showIndicators?: boolean
}

export const Carousel = ({
  children,
  autoPlay = true,
  interval = 5000,
  showControls = true,
  showIndicators = true,
}: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const items = Children.toArray(children)
  const itemsCount = items.length

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % itemsCount)
  }

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount)
  }

  const goToIndex = (index: number) => {
    setCurrentIndex(index)
  }

  useEffect(() => {
    if (!autoPlay || isPaused) return

    const timer = setInterval(goToNext, interval)
    return () => clearInterval(timer)
  }, [currentIndex, isPaused, autoPlay, interval, itemsCount])

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel Items */}
      <div className="relative w-full h-full overflow-hidden">
        {items.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {showControls && itemsCount > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
            aria-label="Previous slide"
          >
            <Icon name="chevron-left" className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
            aria-label="Next slide"
          >
            <Icon name="chevron-right" className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && itemsCount > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}