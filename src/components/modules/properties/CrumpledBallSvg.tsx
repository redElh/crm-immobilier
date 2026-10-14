import { useId, type CSSProperties } from 'react'

/* ---------------------------------------------------------------------
   CrumpledBallSvg — crisp white crumpled-paper ball.

   Hand-placed facets shaded like the reference photo: hot white planes
   upper-left, cool mid-grays across the middle, deep slate crevices
   lower-right. Everything lives inside a circular clip so the wad always
   reads as a BALL, never a rectangle. Zero dependencies, zero canvases.
--------------------------------------------------------------------- */

interface CrumpledBallSvgProps {
  size?: number
  className?: string
  style?: CSSProperties
}

export function CrumpledBallSvg({ size, className, style }: CrumpledBallSvgProps) {
  const uid = useId().replace(/:/g, '')
  const clipId = `cb-clip-${uid}`
  const shadeId = `cb-shade-${uid}`
  const creviceId = `cb-crevice-${uid}`

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={size ? { width: size, height: size, ...style } : style}
      role="img"
      aria-label="Brouillon froissé"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="46" />
        </clipPath>
        <radialGradient id={shadeId} cx="0.36" cy="0.3" r="1.05">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="52%" stopColor="#edf1f6" />
          <stop offset="82%" stopColor="#c3ccd8" />
          <stop offset="100%" stopColor="#98a2b3" />
        </radialGradient>
        <radialGradient id={creviceId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(51,65,85,0.55)" />
          <stop offset="70%" stopColor="rgba(51,65,85,0.18)" />
          <stop offset="100%" stopColor="rgba(51,65,85,0)" />
        </radialGradient>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* base sphere shading */}
        <circle cx="50" cy="50" r="46" fill={`url(#${shadeId})`} />

        {/* bright planes — catch the key light upper-left */}
        <g stroke="rgba(15,23,42,0.20)" strokeWidth="1" strokeLinejoin="round">
          <polygon points="50,7 68,17 59,35" fill="#ffffff" />
          <polygon points="50,7 32,19 41,37" fill="#ffffff" />
          <polygon points="59,35 72,45 55,57" fill="#fbfcfe" />
          <polygon points="41,37 55,57 47,63" fill="#f1f4f8" />
          <polygon points="68,17 87,29 72,45" fill="#e8edf3" />
          <polygon points="32,19 15,35 29,51" fill="#e6eaf0" />
        </g>

        {/* mid-tone planes */}
        <g stroke="rgba(15,23,42,0.22)" strokeWidth="1" strokeLinejoin="round">
          <polygon points="72,45 87,29 93,52 73,61" fill="#d3dae3" />
          <polygon points="15,35 29,51 24,72" fill="#ccd3de" />
          <polygon points="29,51 47,63 40,79" fill="#dde2ea" />
          <polygon points="47,63 55,57 65,77" fill="#c2c9d5" />
        </g>

        {/* deep crevices — shadowed folds lower-right */}
        <g stroke="rgba(15,23,42,0.28)" strokeWidth="1" strokeLinejoin="round">
          <polygon points="55,57 73,61 65,77" fill="#98a2b3" />
          <polygon points="73,61 86,71 65,77" fill="#7c8698" />
          <polygon points="65,77 86,71 78,91" fill="#6d7789" />
          <polygon points="24,72 40,79 48,90" fill="#a7b0bf" />
          <polygon points="40,79 65,77 57,93" fill="#8b95a7" />
          <polygon points="57,93 65,77 78,91" fill="#767f91" />
        </g>

        {/* soft contact shading inside the deepest fold */}
        <ellipse cx="67" cy="72" rx="17" ry="13" fill={`url(#${creviceId})`} />
        {/* key-light bloom upper-left */}
        <ellipse cx="37" cy="29" rx="20" ry="14" fill="#ffffff" opacity="0.55" />

        {/* crest highlights — thin light catches on fold ridges */}
        <g fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1" strokeLinecap="round">
          <path d="M50 7 L59 35" />
          <path d="M32 19 L41 37" />
          <path d="M68 17 L72 45" />
          <path d="M29 51 L40 79" />
        </g>

        {/* roundness vignette — keeps the silhouette spherical */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(100,116,139,0.35)" strokeWidth="1.5" />
        <path d="M18 32 A40 40 0 0 1 62 8" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  )
}
