interface GoldenSkylineProps {
  className?: string
}

const GROUND = 420

const backBuildings = [
  { x: 55, w: 95, h: 265 },
  { x: 170, w: 125, h: 355 },
  { x: 315, w: 70, h: 295 },
  { x: 405, w: 115, h: 335 },
  { x: 550, w: 85, h: 300 },
  { x: 660, w: 135, h: 380 },
  { x: 820, w: 90, h: 320 },
  { x: 935, w: 125, h: 360 },
  { x: 1085, w: 85, h: 285 },
]

const frontBuildings = [
  { x: 20, w: 112, h: 195, dome: false, antenna: false },
  { x: 152, w: 78, h: 322, dome: false, antenna: true },
  { x: 250, w: 96, h: 232, dome: true, antenna: false },
  { x: 366, w: 68, h: 152, dome: false, antenna: false },
  { x: 454, w: 112, h: 268, dome: false, antenna: true },
  { x: 586, w: 88, h: 205, dome: false, antenna: false },
  { x: 694, w: 74, h: 342, dome: false, antenna: true },
  { x: 788, w: 112, h: 252, dome: true, antenna: false },
  { x: 920, w: 86, h: 182, dome: false, antenna: false },
  { x: 1026, w: 98, h: 302, dome: false, antenna: true },
  { x: 1144, w: 56, h: 148, dome: false, antenna: false },
]

function renderWindows(b: { x: number; w: number; h: number }) {
  const cols = Math.floor((b.w - 12) / 13)
  const rows = Math.floor((b.h - 20) / 16)
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = (c * 7 + r * 13) % 5 < 3
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={b.x + 8 + c * 13}
          y={GROUND - b.h + 12 + r * 16}
          width="5"
          height="7"
          rx="1"
          fill={lit ? 'rgba(255,248,214,0.8)' : 'rgba(255,241,184,0.12)'}
        />
      )
    }
  }
  return cells
}

export function GoldenSkyline({ className }: GoldenSkylineProps) {
  return (
    <svg
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,241,184,0)" />
          <stop offset="0.6" stopColor="rgba(248,217,116,0.14)" />
          <stop offset="1" stopColor="rgba(248,217,116,0.3)" />
        </linearGradient>
        <linearGradient id="backFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(120,90,38,0.42)" />
          <stop offset="1" stopColor="rgba(50,38,16,0.6)" />
        </linearGradient>
        <linearGradient id="frontFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(255,236,150,0.32)" />
          <stop offset="1" stopColor="rgba(148,106,38,0.2)" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(255,244,198,0.2)" />
          <stop offset="1" stopColor="rgba(255,244,198,0)" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="420" fill="url(#skyGlow)" />
      <circle cx="168" cy="120" r="130" fill="url(#sunGlow)" />
      <circle cx="168" cy="120" r="46" fill="rgba(255,244,198,0.18)" />

      {backBuildings.map((b, i) => (
        <rect
          key={`back-${i}`}
          x={b.x}
          y={GROUND - b.h}
          width={b.w}
          height={b.h}
          fill="url(#backFill)"
        />
      ))}

      {frontBuildings.map((b, i) => {
        const top = GROUND - b.h
        const cx = b.x + b.w / 2
        return (
          <g key={`front-${i}`}>
            <rect
              x={b.x}
              y={top}
              width={b.w}
              height={b.h}
              fill="url(#frontFill)"
              stroke="rgba(255,241,184,0.4)"
              strokeWidth="1"
            />
            {renderWindows(b)}
            {b.antenna && (
              <g>
                <line x1={cx} y1={top} x2={cx} y2={top - 22} stroke="rgba(255,241,184,0.6)" strokeWidth="2" />
                <circle cx={cx} cy={top - 26} r="3" fill="rgba(255,244,198,0.9)" />
              </g>
            )}
            {b.dome && (
              <g>
                <path
                  d={`M ${cx - 30} ${top} A 30 30 0 0 1 ${cx + 30} ${top} Z`}
                  fill="rgba(255,236,150,0.4)"
                  stroke="rgba(255,241,184,0.6)"
                  strokeWidth="1"
                />
                <line x1={cx} y1={top - 30} x2={cx} y2={top - 40} stroke="rgba(255,241,184,0.7)" strokeWidth="2" />
                <circle cx={cx} cy={top - 44} r="3" fill="rgba(255,244,198,0.95)" />
              </g>
            )}
          </g>
        )
      })}

      <rect x="0" y={GROUND - 2} width="1200" height="4" fill="rgba(255,241,184,0.4)" />
    </svg>
  )
}
