import { useEffect, useRef, useState } from 'react'
import { useIsPresent } from 'framer-motion'
import * as THREE from 'three'
import { CrumpledBallSvg } from './CrumpledBallSvg'

/* ---------------------------------------------------------------------
   CrumpledPaper3D — REAL 3D crumpling, not a painted fake.

   One icosahedron mesh carries two vertex states with identical ordering:
   a ridged-noise crumpled BALL and a wrinkled FLAT disc. three.js GPU
   morph targets interpolate every vertex in true 3D space, so opening
   genuinely un-crumples the wad and closing genuinely re-crumples it.
   The draft list is printed onto the paper and undistorts with the mesh.
   Flat-shaded facets + cavity-darkened crevices match the reference photo.
--------------------------------------------------------------------- */

function hash3(x: number, y: number, z: number, seed: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.19) * 43758.5453
  return h - Math.floor(h)
}

function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x); const yi = Math.floor(y); const zi = Math.floor(z)
  const xf = x - xi; const yf = y - yi; const zf = z - zi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const w = zf * zf * (3 - 2 * zf)
  let res = 0
  res += (hash3(xi, yi, zi, seed) * (1 - u) + hash3(xi + 1, yi, zi, seed) * u) * (1 - v) * (1 - w)
  res += (hash3(xi, yi + 1, zi, seed) * (1 - u) + hash3(xi + 1, yi + 1, zi, seed) * u) * v * (1 - w)
  res += (hash3(xi, yi, zi + 1, seed) * (1 - u) + hash3(xi + 1, yi, zi + 1, seed) * u) * (1 - v) * w
  res += (hash3(xi, yi + 1, zi + 1, seed) * (1 - u) + hash3(xi + 1, yi + 1, zi + 1, seed) * u) * v * w
  return res * 2 - 1
}

function fbm3(x: number, y: number, z: number, octaves: number, seed: number): number {
  let sum = 0; let amp = 0.5; let freq = 1
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise3(x * freq, y * freq, z * freq, seed + i * 7.3)
    amp *= 0.5; freq *= 2.03
  }
  return sum
}

/** Sharp-crested ridged noise in [0,1] — creases, not hills. */
function ridged3(x: number, y: number, z: number, seed: number): number {
  return 1 - Math.abs(fbm3(x, y, z, 3, seed) * 1.6)
}

function smootherstep(t: number): number {
  const k = Math.min(1, Math.max(0, t))
  return k * k * k * (k * (k * 6 - 15) + 10)
}

const FLAT_RADIUS = 1.85
const FLAT_SHRINK = 0.58 // mesh scales down as it flattens to hold framing

/* Draft ink, printed onto the 3D paper — undistorts as the wad flattens,
   crumples away as it closes. Mirrors the DOM sheet for a seamless
   handoff once fully flat (when the DOM takes over for clicks). */
export interface DraftTexRow {
  title: string
  typeLabel: string
  txn: string
  timeAgo: string
  pct: number
  hueA: string
  hueB: string
}

export interface DraftTex {
  rows: DraftTexRow[]
  avg: number
  subtitle: string
}

const TEX_W = 512
const TEX_H = 640

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

function pill(g: CanvasRenderingContext2D, x: number, y: number, text: string, font: string, fg: string, bg: string, border: string): number {
  g.font = font
  const w = g.measureText(text).width + 22
  rr(g, x, y, w, 26, 13)
  g.fillStyle = bg
  g.fill()
  g.strokeStyle = border
  g.lineWidth = 1.5
  g.stroke()
  g.fillStyle = fg
  g.fillText(text, x + 11, y + 18)
  return w
}

function paintDraftTexture(g: CanvasRenderingContext2D, tex: DraftTex): void {
  const pad = 30
  g.clearRect(0, 0, TEX_W, TEX_H)
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, TEX_W, TEX_H)
  g.textBaseline = 'alphabetic'

  // header
  g.fillStyle = '#1c1917'
  g.font = '800 27px system-ui, -apple-system, sans-serif'
  g.fillText('Brouillons en cours', pad, 54)
  g.fillStyle = '#57534e'
  g.font = '500 17px system-ui, -apple-system, sans-serif'
  g.fillText(tex.subtitle, pad, 82)
  // avg badge, top-right
  g.font = '700 16px system-ui, -apple-system, sans-serif'
  const badge = `${tex.avg}% moyen`
  const bw = g.measureText(badge).width + 26
  rr(g, TEX_W - pad - bw, 32, bw, 32, 16)
  g.fillStyle = 'rgba(139,124,255,0.16)'
  g.fill()
  g.strokeStyle = 'rgba(91,33,182,0.30)'
  g.lineWidth = 1.5
  g.stroke()
  g.fillStyle = '#5b21b6'
  g.fillText(badge, TEX_W - pad - bw + 13, 54)

  // overall progress groove
  const barY = 104
  rr(g, pad, barY, TEX_W - pad * 2, 12, 6)
  g.fillStyle = 'rgba(15,23,42,0.10)'
  g.fill()
  const grad = g.createLinearGradient(pad, 0, TEX_W - pad, 0)
  grad.addColorStop(0, '#5B4BD4')
  grad.addColorStop(1, '#8B7CFF')
  rr(g, pad, barY, Math.max(12, (TEX_W - pad * 2) * (tex.avg / 100)), 12, 6)
  g.fillStyle = grad
  g.fill()

  // rows
  let y = 152
  const rows = tex.rows.slice(0, 4)
  for (let k = 0; k < rows.length; k++) {
    const row = rows[k]
    // hue edge
    const eg = g.createLinearGradient(0, y, 0, y + 92)
    eg.addColorStop(0, row.hueA)
    eg.addColorStop(1, row.hueB)
    rr(g, pad, y + 4, 5, 88, 2.5)
    g.fillStyle = eg
    g.fill()
    // orb
    const og = g.createLinearGradient(pad + 16, y, pad + 62, y + 46)
    og.addColorStop(0, row.hueA)
    og.addColorStop(1, row.hueB)
    rr(g, pad + 16, y, 46, 46, 12)
    g.fillStyle = og
    g.fill()
    g.fillStyle = 'rgba(255,255,255,0.92)'
    g.beginPath()
    g.arc(pad + 39, y + 23, 7, 0, Math.PI * 2)
    g.fill()
    // title
    g.fillStyle = '#1c1917'
    g.font = '700 20px system-ui, -apple-system, sans-serif'
    const title = row.title.length > 24 ? row.title.slice(0, 23) + '…' : row.title
    g.fillText(title, pad + 72, y + 24)
    // pills
    let px = pad + 72
    px += pill(g, px, y + 34, row.typeLabel, '700 14px system-ui, sans-serif', '#4c1d95', 'rgba(139,124,255,0.14)', 'rgba(76,29,149,0.30)') + 8
    if (row.txn) {
      pill(g, px, y + 34, row.txn, '600 14px system-ui, sans-serif', '#57534e', 'rgba(100,116,139,0.10)', 'rgba(100,116,139,0.30)')
    }
    g.fillStyle = '#78716c'
    g.font = '500 14px system-ui, -apple-system, sans-serif'
    g.fillText(row.timeAgo, pad + 72, y + 86)
    // completion ring
    const cx = TEX_W - pad - 26
    const cy = y + 40
    g.lineWidth = 6
    g.strokeStyle = 'rgba(15,23,42,0.10)'
    g.beginPath()
    g.arc(cx, cy, 20, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = row.hueB
    g.lineCap = 'round'
    g.beginPath()
    g.arc(cx, cy, 20, -Math.PI / 2, -Math.PI / 2 + (row.pct / 100) * Math.PI * 2)
    g.stroke()
    g.fillStyle = row.hueB
    g.font = '800 13px system-ui, sans-serif'
    const label = `${row.pct}%`
    g.fillText(label, cx - g.measureText(label).width / 2, cy + 5)
    y += 108
  }

  // footer
  g.fillStyle = '#78716c'
  g.font = 'italic 500 15px system-ui, sans-serif'
  g.fillText('Sauvegardés automatiquement', pad, TEX_H - 24)
  g.fillStyle = '#44403c'
  g.font = '700 16px system-ui, sans-serif'
  const f = 'Fermer'
  const fw = g.measureText(f).width
  g.fillText(f, TEX_W - pad - fw, TEX_H - 24)
  g.strokeStyle = 'rgba(120,113,108,0.6)'
  g.lineWidth = 1.5
  g.beginPath()
  g.moveTo(TEX_W - pad - fw, TEX_H - 18)
  g.lineTo(TEX_W - pad, TEX_H - 18)
  g.stroke()
}

interface CrumpledPaperBall3DProps {
  seed?: number
  detail?: number
  className?: string
  tex: DraftTex
}

export function CrumpledPaperBall3D({ seed = 1, detail = 6, className, tex }: CrumpledPaperBall3DProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const isPresent = useIsPresent()
  const presentRef = useRef(isPresent)
  presentRef.current = isPresent
  const paintRef = useRef<(t: DraftTex) => void>(() => undefined)
  const texRef = useRef(tex)
  texRef.current = tex
  // If WebGL ever fails, fall back to the vector wad — never a blank hole.
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    paintRef.current(texRef.current)
  })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    try {

    /* ---- geometry: ball state written in place, flat + mid states as
       GPU morph targets with identical vertex ordering ---- */
    const geo = new THREE.IcosahedronGeometry(1, detail)
    const pos = geo.getAttribute('position') as THREE.BufferAttribute
    const count = pos.count
    const v = new THREE.Vector3()
    const ox = seed * 3.1; const oy = seed * 5.7; const oz = seed * 1.3
    const radii = new Float32Array(count)
    let minR = Infinity; let maxR = -Infinity
    for (let i = 0; i < count; i++) {
      v.fromBufferAttribute(pos, i).normalize()
      const large = ridged3(v.x * 2.1 + ox, v.y * 2.1 + oy, v.z * 2.1 + oz, seed)
      const med = ridged3(v.x * 4.6 + oy, v.y * 4.6 + oz, v.z * 4.6 + ox, seed + 3)
      const fine = fbm3(v.x * 10.5 + oz, v.y * 10.5 + ox, v.z * 10.5 + oy, 2, seed + 9)
      const r = Math.max(0.68, 1 + (large - 0.55) * 0.5 + (med - 0.5) * 0.17 + fine * 0.05)
      radii[i] = r
      if (r < minR) minR = r
      if (r > maxR) maxR = r
    }
    const colors = new Float32Array(count * 3)
    const mid = new Float32Array(count * 3)
    const flat = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      v.fromBufferAttribute(pos, i).normalize()
      const r = radii[i]
      const large = ridged3(v.x * 2.1 + ox, v.y * 2.1 + oy, v.z * 2.1 + oz, seed)
      const med = ridged3(v.x * 4.6 + oy, v.y * 4.6 + oz, v.z * 4.6 + ox, seed + 3)
      const fine = fbm3(v.x * 10.5 + oz, v.y * 10.5 + ox, v.z * 10.5 + oy, 2, seed + 9)
      // ball state (slight natural squash)
      pos.setXYZ(i, v.x * r * 1.04, v.y * r * 0.94, v.z * r)
      // cavity occlusion: valleys stay dark like the photo
      const t = (r - minR) / Math.max(1e-5, maxR - minR)
      const s = t * t * (3 - 2 * t)
      const shade = 0.5 + 0.5 * s
      colors[i * 3] = shade * 0.97
      colors[i * 3 + 1] = shade * 0.98
      colors[i * 3 + 2] = Math.min(1, shade * 1.02)
      // flat state: same vertex fanned onto a wrinkled disc
      const wx = fbm3(v.x * 2.6 + oz, v.z * 2.6 + ox, 4.2, 2, seed + 21)
      const wz = fbm3(v.z * 2.6 + ox, v.x * 2.6 + oy, 8.8, 2, seed + 33)
      const wy = fbm3(v.x * 3.4 + oy, v.z * 3.4 + oz, 1.1, 2, seed + 45)
      flat[i * 3] = v.x * FLAT_RADIUS + wx * 0.05
      flat[i * 3 + 1] = v.y * 0.05 + wy * 0.075
      flat[i * 3 + 2] = v.z * FLAT_RADIUS + wz * 0.05
      // mid state: large folds half-released, medium folds still gripping
      const rm = Math.max(0.68, 1 + (large - 0.55) * 0.15 + (med - 0.5) * 0.17 + fine * 0.05)
      mid[i * 3] = v.x * rm * 1.28
      mid[i * 3 + 1] = v.y * rm * 0.55 + wy * 0.04
      mid[i * 3 + 2] = v.z * rm * 1.28
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    // planar UVs from the FLAT state — the printed draft smears over the
    // crumpled ball, then resolves as the paper flattens (the reveal)
    const uvs = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      uvs[i * 2] = flat[i * 3] / (2 * FLAT_RADIUS) + 0.5
      uvs[i * 2 + 1] = 1 - (flat[i * 3 + 2] / (2 * FLAT_RADIUS) + 0.5)
    }
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.morphAttributes.position = [
      new THREE.Float32BufferAttribute(mid, 3),
      new THREE.Float32BufferAttribute(flat, 3),
    ]
    geo.computeVertexNormals()

    /* ---- renderer / studio lighting matched to the reference ---- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.14
    host.appendChild(renderer.domElement)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20)
    camera.position.set(0, 0.2, 5.2)
    camera.lookAt(0, 0, 0)

    const key = new THREE.DirectionalLight(0xffffff, 2.8)
    key.position.set(2.6, 3.6, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xdbeafe, 0.55)
    fill.position.set(-4, 0.6, 2.4)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 0.85)
    rim.position.set(-1.6, 2.2, -4)
    scene.add(rim)
    scene.add(new THREE.AmbientLight(0xffffff, 0.42))

    const texCanvas = document.createElement('canvas')
    texCanvas.width = TEX_W
    texCanvas.height = TEX_H
    const texture = new THREE.CanvasTexture(texCanvas)
    texture.colorSpace = THREE.SRGBColorSpace
    paintRef.current = (t: DraftTex) => {
      const g = texCanvas.getContext('2d')
      if (!g) return
      paintDraftTexture(g, t)
      texture.needsUpdate = true
    }
    paintRef.current(texRef.current)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0,
      flatShading: true,
      vertexColors: true,
      map: texture,
    })
    const mesh = new THREE.Mesh(geo, material)
    mesh.morphTargetInfluences = [0, 0]
    mesh.rotation.set(0.45, 0.7, 0.12)
    scene.add(mesh)

    /* ---- morph driver: p = 0 wad … 1 sheet. The path bends through the
       mid state — influence 0 swells mid-transition while influence 1
       ramps late — so folds release progressively instead of all at once.
       Follows AnimatePresence presence: unfold after the toss,
       re-crumple on close. */
    const morph = { p: 0, from: 0, target: 1, t: 0, delay: 0.15, dur: 1.1 }
    const retarget = (present: boolean) => {
      morph.from = morph.p
      morph.t = 0
      if (present) {
        morph.target = 1
        morph.delay = 0.15
        morph.dur = 1.1
      } else {
        morph.target = 0
        morph.delay = 0.15
        morph.dur = 1.2
      }
    }
    retarget(presentRef.current)
    let lastPresent = presentRef.current

    const resize = () => {
      const w = host.clientWidth || 64
      const h = host.clientHeight || 64
      if (w === 0 || h === 0) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    let raf = 0
    const clock = new THREE.Clock()
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05)
      const t = clock.elapsedTime
      if (presentRef.current !== lastPresent) {
        lastPresent = presentRef.current
        retarget(lastPresent)
      }
      morph.t += dt
      const lp = Math.min(1, Math.max(0, (morph.t - morph.delay) / morph.dur))
      morph.p = morph.from + (morph.target - morph.from) * lp
      const midBump = Math.pow(Math.sin(Math.PI * morph.p), 1.5)
      mesh.morphTargetInfluences[0] = midBump
      mesh.morphTargetInfluences[1] = smootherstep((morph.p - 0.25) / 0.75)
      const spread = morph.p
      const transitioning = Math.abs(morph.target - spread) > 0.002
      mesh.rotation.set(
        0.45 + Math.sin(t * 0.55) * 0.15,
        mesh.rotation.y + (transitioning ? 1.1 : 0.5) * dt,
        0.12 + Math.sin(t * 0.7) * 0.07
      )
      mesh.position.y = Math.sin(t * 0.9) * 0.05 * (1 - spread * 0.6)
      // hold the flattened footprint inside the frame as it spreads
      const fit = 1 - (1 - FLAT_SHRINK) * morph.p
      mesh.scale.set(fit, 1, fit)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh
        if (m.isMesh) {
          m.geometry.dispose()
          const mat = m.material
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
          else mat.dispose()
        }
      })
      renderer.dispose()
      texture.dispose()
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement)
      }
      }
    } catch {
      setFailed(true)
    }
  }, [seed, detail])

  if (failed) {
    return (
      <div className={className} aria-hidden="true" style={{ width: '100%', height: '100%' }}>
        <CrumpledBallSvg className="h-full w-full" />
      </div>
    )
  }
  return <div ref={hostRef} className={className} aria-hidden="true" style={{ width: '100%', height: '100%' }} />
}
