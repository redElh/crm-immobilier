import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { useThreeStage, makeGlowTexture, makeLabelSprite, disposeObject3D } from './useThreeStage'
import type { StageHue } from '../Stage'

export interface Bars3DItem {
  label: string
  value: number
  hue?: StageHue
  /** Secondary line shown in the tooltip. */
  meta?: string
}

export interface Bars3DProps {
  data: Bars3DItem[]
  hue: StageHue
  isDark: boolean
  height?: number
  className?: string
  valueFormatter?: (value: number) => string
  hint?: string
  /** When true the value is printed above every column (auto-thinned). */
  showValues?: boolean
  /** When false, the per-bar labels in front of the columns are hidden. */
  showLabels?: boolean
  showTrend?: boolean
  barSpacing?: number
  /** Uniform scale applied to the whole 3D scene (1 = default). */
  scale?: number
}

export function formatCompactValue(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`
  if (abs >= 1_000) return `${Math.round(v / 1_000)}K`
  return `${Math.round(v)}`
}

function easeDamped(u: number): number {
  if (u <= 0) return 0
  if (u >= 1) return 1
  const u1 = u - 1
  return 1 + u1 * u1 * u1 * u1 * u1 * (8 * Math.sin(u1 * Math.PI * 4) + Math.PI * u1) * 0.32
}

/**
 * Bars3D — rounded neon columns with a floating trend line, reflections,
 * light halos and drifting particles. Drag to orbit (gently constrained),
 * hover a column to inspect it, click to pin the tooltip.
 */
export function Bars3D({
  data,
  hue,
  isDark,
  height,
  className,
  valueFormatter = formatCompactValue,
  hint = 'glisser pour orbiter · cliquer pour épingler',
  showValues = true,
  showLabels = true,
  showTrend = true,
  barSpacing,
  scale = 1,
}: Bars3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { orbitRef, addTick, getCtx, fitToBounds } = useThreeStage(containerRef, {
    camPos: [0, 5, 11],
    lookAt: [0, 1.1, 0],
    fov: 42,
    autoRotateSpeed: 0,
    swayAmplitude: 0.14,
    swaySpeed: 0.26,
    yawLimit: undefined,
    pitchLimit: 0,
  })
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const hoverRef = useRef<number | null>(null)
  const selectedRef = useRef<number | null>(null)

  useEffect(() => { hoverRef.current = hoverIdx }, [hoverIdx])
  useEffect(() => { selectedRef.current = selectedIdx }, [selectedIdx])

  useEffect(() => {
    const orbit = orbitRef.current
    if (!orbit || data.length === 0) return
    while (orbit.children.length) {
      const child = orbit.children[0]
      orbit.remove(child)
      disposeObject3D(child)
    }

    const glowTex = makeGlowTexture()
    const ink = isDark ? 'rgba(226,232,240,0.94)' : 'rgba(28,25,23,0.86)'
    const mutedInk = isDark ? 'rgba(203,213,225,0.72)' : 'rgba(51,65,85,0.72)'
    const maxValue = Math.max(...data.map(d => d.value), 1)
    const n = data.length
    const baseSpacing = n > 9 ? 0.8 : n > 6 ? 0.94 : 1.16
    const spacing = barSpacing ?? baseSpacing
    const barWidth = baseSpacing * 0.56
    const barDepth = 0.62
    const maxHeight = 3.15
    const x0 = (-(n - 1) / 2) * spacing
    const sceneCenter = 0

    /* lighting */
    const key = new THREE.DirectionalLight(0xffffff, isDark ? 1.0 : 1.4)
    key.position.set(4, 9, 6)
    orbit.add(key)
    const rim = new THREE.PointLight(new THREE.Color(hue.a), isDark ? 50 : 24, 42, 2)
    rim.position.set(-5.5, 4.2, -4.5)
    orbit.add(rim)
    const fill = new THREE.PointLight(new THREE.Color(hue.b), isDark ? 30 : 16, 42, 2)
    fill.position.set(6.5, 3.2, 4.5)
    orbit.add(fill)
    orbit.add(new THREE.AmbientLight(0xffffff, isDark ? 0.45 : 0.8))

    /* grid */
    const gridSize = Math.max(9, n * spacing + 3)
    const grid = new THREE.GridHelper(gridSize, Math.max(14, n * 2), 0x94a3b8, 0x94a3b8)
    const gridMat = grid.material as THREE.Material & { opacity: number }
    gridMat.transparent = true
    gridMat.opacity = isDark ? 0.08 : 0.12
    grid.position.y = -0.01
    orbit.add(grid)

    /* bars */
    const colGeo = new RoundedBoxGeometry(barWidth, 1, barDepth, 5, Math.min(0.15, barWidth * 0.22))
    const capGeo = new RoundedBoxGeometry(barWidth * 1.045, 0.085, barDepth * 1.045, 4, 0.035)
    const haloGeo = new THREE.PlaneGeometry(1.55, 1.55)
    const sparkGeo = new THREE.SphereGeometry(0.065, 12, 12)
    const bars: THREE.Mesh[] = []
    const caps: THREE.Mesh[] = []
    const halos: THREE.Sprite[] = []
    const sparks: THREE.Mesh[] = []
    const itemHues: StageHue[] = []

    data.forEach((d, i) => {
      const itemHue = d.hue ?? hue
      itemHues.push(itemHue)
      const t = d.value / maxValue
      const h = Math.max(0.14, t * maxHeight)
      const x = x0 + i * spacing
      const col = new THREE.Color(itemHue.b).lerp(new THREE.Color(itemHue.a), 0.25 + t * 0.75)

      const bar = new THREE.Mesh(
        colGeo,
        new THREE.MeshStandardMaterial({
          color: col,
          emissive: new THREE.Color(itemHue.a).multiplyScalar(0.32),
          emissiveIntensity: isDark ? 0.7 : 0.5,
          metalness: isDark ? 0.3 : 0.4,
          roughness: isDark ? 0.5 : 0.3,
        })
      )
      bar.position.set(x, 0.001, 0)
      bar.scale.set(1, 0.001, 1)
      bar.userData = { idx: i, targetH: h, u: -i * 0.065, hue: itemHue }
      orbit.add(bar)
      bars.push(bar)

      const cap = new THREE.Mesh(
        capGeo,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(itemHue.a).lerp(new THREE.Color(0xffffff), 0.55),
          emissive: new THREE.Color(itemHue.a),
          emissiveIntensity: isDark ? 1.2 : 0.9,
          metalness: isDark ? 0.2 : 0.15,
          roughness: isDark ? 0.35 : 0.25,
        })
      )
      cap.position.set(x, 0.06, 0)
      orbit.add(cap)
      caps.push(cap)

      /* warm halo pooling at the base */
      const halo = new THREE.Mesh(
        haloGeo,
        new THREE.MeshBasicMaterial({
        map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        color: new THREE.Color(itemHue.a), opacity: 0.12 + t * 0.22,
        })
      )
      halo.rotation.x = -Math.PI / 2
      halo.position.set(x, 0.012, 0)
      orbit.add(halo)

      /* glowing tip */
      const spark = new THREE.Mesh(
        sparkGeo,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(itemHue.a).lerp(new THREE.Color(0xffffff), 0.35),
          transparent: true, opacity: 0.95,
        })
      )
      spark.position.set(x, 0.1, 0)
      orbit.add(spark)
      sparks.push(spark)

      const tipGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: new THREE.Color(itemHue.a), transparent: true,
        opacity: isDark ? 0.8 : 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
      }))
      tipGlow.scale.setScalar(0.72)
      tipGlow.position.set(x, 0.2, 0)
      orbit.add(tipGlow)
      halos.push(tipGlow)

      if (showLabels) {
        const label = makeLabelSprite(d.label, mutedInk, 38, 700)
        label.scale.multiplyScalar(0.72)
        label.position.set(x, 0.16, barDepth / 2 + 0.48)
        orbit.add(label)
      }

      if (showValues && (n <= 8 || i === 0 || d.value === maxValue || i === n - 1)) {
        const vLabel = makeLabelSprite(valueFormatter(d.value), ink, 32, 800)
        vLabel.scale.multiplyScalar(0.56)
        vLabel.position.set(x, h + 0.46, 0)
        orbit.add(vLabel)
      }
    })

    let trendGeo: THREE.BufferGeometry | null = null
    let trendMesh: THREE.Mesh | null = null
    if (showTrend) {
      trendGeo = new THREE.BufferGeometry()
      trendGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
      trendMesh = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(hue.a),
          emissive: new THREE.Color(hue.a),
          emissiveIntensity: isDark ? 1.2 : 0.8,
          metalness: 0.35,
          roughness: 0.4,
          transparent: true,
          opacity: isDark ? 0.9 : 0.85,
        })
      )
      orbit.add(trendMesh)
    }

    /* floating dust */
    const dustCount = 34
    const dustGeo = new THREE.BufferGeometry()
    const dustPos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * Math.max(6, n * spacing + 2)
      dustPos[i * 3 + 1] = Math.random() * 3.4
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4.4
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.07, map: glowTex, transparent: true, opacity: isDark ? 0.25 : 0.45,
        depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(hue.a),
      })
    )
    orbit.add(dust)

    orbit.scale.setScalar(scale || 1)

    /* camera framing so nothing ever clips out of the card */
    const halfWidth = Math.max((n - 1) * spacing / 2 + 2.0, 3.5)
    const centerOfBars = 0 // Mathematically x0 + (n-1)*spacing/2 = 0
    fitToBounds(
      halfWidth,
      maxHeight / 2 + 0.8,
      2.5,
      new THREE.Vector3(0, 1.3, 0)
    )

    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const container = containerRef.current
    let offMove: () => void = () => {}
    let offClick: () => void = () => {}
    if (container) {
      const onMove = (e: PointerEvent) => {
        const ctx = getCtx()
        if (!ctx) return
        const rect = container.getBoundingClientRect()
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(ndc, ctx.camera)
        const hits = raycaster.intersectObjects(bars, false)
        const idx = hits.length > 0 ? (hits[0].object.userData.idx as number) : null
        if (idx !== hoverRef.current) {
          hoverRef.current = idx
          setHoverIdx(idx)
        }
      }
      const onLeave = () => { hoverRef.current = null; setHoverIdx(null) }
      const onClick = () => {
        hoverRef.current === null
          ? setSelectedIdx(null)
          : setSelectedIdx(prev => (prev === hoverRef.current ? null : hoverRef.current))
      }
      container.addEventListener('pointermove', onMove)
      container.addEventListener('pointerleave', onLeave)
      container.addEventListener('click', onClick)
      offMove = () => {
        container.removeEventListener('pointermove', onMove)
        container.removeEventListener('pointerleave', onLeave)
        container.removeEventListener('click', onClick)
      }
    }

    const cancelTick = addTick((elapsed, dt) => {
      const cur = hoverRef.current
      const sel = selectedRef.current
      const positions = trendGeo ? trendGeo.getAttribute('position') as THREE.BufferAttribute : null

      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i]
        const target = bar.userData.targetH as number
        const u = (bar.userData.u as number) + dt * 1.3
        bar.userData.u = u
        const eased = easeDamped(u)
        const y = Math.max(0.001, target * eased)
        bar.scale.y = y
        bar.position.y = y / 2

        const isHot = cur === i || sel === i
        const sway = 1 + Math.sin(elapsed * 1.6 + i * 0.7) * 0.015
        bar.scale.x = sway * (isHot ? 1.06 : 1)
        bar.scale.z = sway * (isHot ? 1.06 : 1)

        caps[i].position.y = y + 0.06
        sparks[i].position.y = y + 0.12
        sparks[i].scale.setScalar(isHot ? 1.5 : 1)
        halos[i].position.y = y + 0.24
        halos[i].scale.setScalar(isHot ? 1.1 : 0.72)

        const mat = bar.material as THREE.MeshStandardMaterial
        const goal = isHot ? 2.5 : isDark ? 1.05 : 0.7
        mat.emissiveIntensity += (goal - mat.emissiveIntensity) * Math.min(1, dt * 9)
        const base = new THREE.Color(itemHues[i].a).multiplyScalar(isHot ? 0.4 : 0.2)
        if (isHot) base.lerp(new THREE.Color(0xffffff), 0.35)
        mat.emissive.lerp(base, Math.min(1, dt * 12))

        if (positions) positions.setXYZ(i, bar.position.x, y + 0.16, 0)
      }
      if (positions && trendMesh) {
        positions.needsUpdate = true
        const curvePoints: THREE.Vector3[] = []
        for (let i = 0; i < n; i++) {
          curvePoints.push(new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i)))
        }
        const curve = new THREE.CatmullRomCurve3(curvePoints)
        const tubeGeo = new THREE.TubeGeometry(curve, Math.max(12, n * 8), 0.07, 10, false)
        if (trendMesh.geometry) trendMesh.geometry.dispose()
        trendMesh.geometry = tubeGeo
      }

      /* drifting dust */
      const dp = dustGeo.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < dustCount; i++) {
        let y = dp.getY(i) + dt * 0.12
        if (y > 3.8) y = 0.05
        dp.setY(i, y)
      }
      dp.needsUpdate = true
      dust.rotation.y = Math.sin(elapsed * 0.08) * 0.08
    })

    return () => {
      offMove()
      offClick()
      cancelTick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, hue, isDark, valueFormatter, showValues, showLabels, showTrend, barSpacing])

  const shownIdx = hoverIdx ?? selectedIdx
  return (
    <div
      ref={containerRef}
      className={`stage-3d-shell overflow-hidden rounded-2xl ${className || ''}`}
      style={{ height, position: 'relative', cursor: hoverIdx !== null ? 'pointer' : 'grab', touchAction: 'pan-y' }}
    >
      {shownIdx !== null && data[shownIdx] && (
        <div className="pointer-events-none absolute left-3 top-2 z-10">
          <span
            className="rounded-xl border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md"
            style={{
              color: isDark ? '#fff' : '#1c1917',
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.10)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.72)' : 'rgba(255,255,255,0.82)',
              boxShadow: `0 8px 22px -12px ${(data[shownIdx].hue ?? hue).glow}`,
            }}
          >
            {data[shownIdx].label} · {valueFormatter(data[shownIdx].value)}
            {data[shownIdx].meta ? ` · ${data[shownIdx].meta}` : ''}
          </span>
        </div>
      )}
      {hint && (
        <div className="pointer-events-none absolute bottom-2 right-3 z-10">
          <span
            className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.2px] backdrop-blur-md"
            style={{
              color: isDark ? 'rgba(226,232,240,0.6)' : 'rgba(28,25,23,0.55)',
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.55)' : 'rgba(255,255,255,0.7)',
            }}
          >
            {hint}
          </span>
        </div>
      )}
    </div>
  )
}
