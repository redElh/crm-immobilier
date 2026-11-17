import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollDebug() {
  const location = useLocation()
  const [scrollInfo, setScrollInfo] = useState({
    scrollTop: 0,
    sectionKey: '',
    savedScroll: 0,
    hasLocalStorage: false
  })

  useEffect(() => {
    const updateScrollInfo = () => {
      const main = document.querySelector('main')
      const routeKey = `${location.pathname}${location.search}`
      const sectionKey = location.pathname.split('/')[2] || 'dashboard'
      
      let savedScroll = 0
      let hasLocalStorage = false
      
      try {
        if (typeof localStorage !== 'undefined') {
          hasLocalStorage = true
          const raw = localStorage.getItem('crm-scroll-pages-v1')
          if (raw) {
            const parsed = JSON.parse(raw)
            savedScroll = parsed[routeKey] || 0
          }
        }
      } catch {}
      
      setScrollInfo({
        scrollTop: main?.scrollTop || 0,
        sectionKey,
        savedScroll,
        hasLocalStorage
      })
    }
    
    updateScrollInfo()
    
    const main = document.querySelector('main')
    if (main) {
      main.addEventListener('scroll', updateScrollInfo)
    }
    
    const interval = setInterval(updateScrollInfo, 1000)
    
    return () => {
      if (main) {
        main.removeEventListener('scroll', updateScrollInfo)
      }
      clearInterval(interval)
    }
  }, [location.pathname, location.search])

  if (!scrollInfo.hasLocalStorage) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div>Section: {scrollInfo.sectionKey}</div>
      <div>Current: {scrollInfo.scrollTop}px</div>
      <div>Saved: {scrollInfo.savedScroll}px</div>
      <div>Diff: {Math.abs(scrollInfo.scrollTop - scrollInfo.savedScroll)}px</div>
      <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.7 }}>
        {scrollInfo.scrollTop === scrollInfo.savedScroll ? '✓ Synced' : '✗ Not synced'}
      </div>
    </div>
  )
}