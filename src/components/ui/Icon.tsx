import React from 'react'

interface IconProps {
  name: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const iconMap = {
  bed: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2 4v16h20V4M2 4h20M2 8h20M6 4v4M10 4v4M14 4v4M18 4v4"
    />
  ),
  bath: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 4v3m4-3v3m4-3v3M3 6h18M3 12h18M3 18h18"
    />
  ),
  home: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
  ),
  building: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
    />
  ),
  map: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.06 3.689c-.33-.165-.68-.26-1.04-.26-.417 0-.82.126-1.156.364L3.504 4.82c-.748.374-1.628.17-1.628-.836V15.38c0-.426.241-.816.622-1.006l4.875-2.437c.373-.186.87-.186 1.243 0l3.869 1.934c.317.159.69.159 1.006 0l3.869-1.934c.373-.186.87-.186 1.243 0z"
    />
  ),
  umbrella: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  ),
  diamond: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v12m-3-6l3 3 3-3M4.5 9l3-3m0 0l3 3m-3-3v12m6-12l3 3m0 0l3-3m-3 3v12"
    />
  ),
  plus: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  )
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
}

export const Icon: React.FC<IconProps> = ({ name, className = '', size = 'md' }) => {
  const iconPath = iconMap[name as keyof typeof iconMap]
  
  if (!iconPath) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`${sizeMap[size]} ${className}`}
    >
      {iconPath}
    </svg>
  )
}