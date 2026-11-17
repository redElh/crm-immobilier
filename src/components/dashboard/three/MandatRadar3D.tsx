import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThreeStage, makeGlowTexture, makeLabelSprite, disposeObject3D } from './useThreeStage'
import type { StageHue } from '../Stage'

export interface MandatRadarSlice {
  name: string
  value: number
  hue: StageHue
}

export interface MandatRadar3DProps {
  slices: MandatRadarSlice[]
  centerValue?: string
  centerLabel?: string
  isDark: boolean
  height?: number
  className?: string
  accent?: StageHue
  hint?: string
}

const EMPTY_HUE: StageHue = { a: '#94A3B8', b: '#475569', line: '#94A3B8', glow: 'rgba(148,163,184,0.4)' }

function easeOutCubic(u: number): number {
  if (u <= 0) return 0
  if (u >= 1) return 1
  return 1 - Math.pow(1 - u, 3)
}

function angleDelta(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return Math.abs(d)
}

/**
 * MandatRadar3D — a holographic radar deck: a sweeping beam scans a ring of
 * faceted mandate columns, each column rising to its mandate count. The beam
 * lights every crystal as it passes. Drag to orbit, hover a column to inspect.
 */
export function MandatRadar3D({
  slices,
  centerValue,
  centerLabel,
  isDark,
  height = 300,
  className,
  accent,
  hint = 'glisser pour orbiter · survoler une colonne',
}: MandatRadar3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pauseRef = useRef(false)
  const { orbitRef, addTick, getCtx, fitToBounds } = useThreeStage(containerRef, {
    camPos: [0, 6.4, 8.8],
    lookAt: [0, 0.25, 0],
    fov: 40,
    autoRotateSpeed: 0.03,
    swayAmplitude: 0.05,
    swaySpeed: 0.2,
    pausedRef: pauseRef,
  })
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const hoverRef = useRef<number | null>(null)

  useEffect(() => { hoverRef.current = hoverIdx }, [hoverIdx])

  useEffect(() => {
    const orbit = orbitRef.current
    if (!orbit) return
    while (orbit.children.length) {
      const child = orbit.children[0]
      orbit.remove(child)
      disposeObject3D(child)
    }

    const glowTex = makeGlowTexture()
    const total = slices.reduce((s, d) => s + Math.max(0, d.value), 0)
    const hasData = total > 0
    const accentHue = accent ?? slices[0]?.hue ?? EMPTY_HUE
    const maxValue = Math.max(...slices.map(s => Math.max(0, s.value)), 1)
    const items = slices.length > 0 ? slices : [{ name: 'Aucun mandat', value: 0, hue: EMPTY_HUE }]
    const n = items.length
    const deckR = 2.55
    const columnR = 1.72
    const daisTop = 0.18
    const ink = isDark ? 'rgba(226,232,240,0.94)' : 'rgba(28,25,23,0.86)'

    const key = new THREE.DirectionalLight(0xffffff, isDark ? 1.35 : 1.9)
    key.position.set(4.5, 8, 6)
    orbit.add(key)
    orbit.add(new THREE.HemisphereLight(0xffffff, isDark ? '#0b1023' : '#d9d2c4', isDark ? 0.32 : 0.75))
    const rim = new THREE.PointLight(new THREE.Color(accentHue.a), isDark ? 60 : 30, 34, 2)
    rim.position.set(-5, 4, -4)
    orbit.add(rim)
    const fill = new THREE.PointLight(new THREE.Color(accentHue.a), isDark ? 34 : 18, 30, 2)
    fill.position.set(5, 3, 4)
    orbit.add(fill)
    orbit.add(new THREE.AmbientLight(0xffffff, isDark ? 0.62 : 1.0))

    const deck = new THREE.Mesh(
      new THREE.CylinderGeometry(deckR, deckR + 0.14, 0.18, 64),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(isDark ? '#1b2438' : '#E9E3D5'),
        metalness: isDark ? 0.42 : 0.12,
        roughness: isDark ? 0.48 : 0.6,
      }),
    )
    deck.position.y = daisTop - 0.09
    orbit.add(deck)

    const deckRim = new THREE.Mesh(
      new THREE.TorusGeometry(deckR, 0.02, 10, 120),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentHue.a),
        emissive: new THREE.Color(accentHue.a),
        emissiveIntensity: isDark ? 1.4 : 0.9,
      }),
    )
    deckRim.rotation.x = Math.PI / 2
    deckRim.position.y = daisTop
    orbit.add(deckRim)

    const grid = new THREE.GridHelper(deckR * 3.2, 20, isDark ? 0x94a3b8 : 0x8a8378, isDark ? 0x94a3b8 : 0x8a8378)
    const gridMat = grid.material as THREE.Material & { opacity: number }
    gridMat.transparent = true
    gridMat.opacity = isDark ? 0.14 : 0.26
    grid.position.y = -0.001
    orbit.add(grid)

    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentHue.a), transparent: true, depthWrite: false,
      opacity: isDark ? 0.16 : 0.28, blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    })
    const gridRings: THREE.Mesh[] = []
    ;[0.85, 1.7, deckR].forEach(r => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.007, 6, 96), ringMat.clone())
      ring.rotation.x = Math.PI / 2
      ring.position.y = daisTop + 0.004
      orbit.add(ring)
      gridRings.push(ring)
    })

    const crossMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentHue.a), transparent: true, opacity: isDark ? 0.1 : 0.18,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const crossX = new THREE.Mesh(new THREE.BoxGeometry(deckR * 2, 0.004, 0.004), crossMat)
    crossX.position.y = daisTop + 0.004
    orbit.add(crossX)
    const crossZ = crossX.clone()
    crossZ.rotation.y = Math.PI / 2
    orbit.add(crossZ)

    const sweepGroup = new THREE.Group()
    orbit.add(sweepGroup)
    const sweepMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentHue.a), transparent: true, opacity: isDark ? 0.16 : 0.24,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })
    const sweepArc = new THREE.Mesh(
      new THREE.RingGeometry(0.24, deckR, 48, 1, 0, 0.6),
      sweepMat,
    )
    sweepArc.rotation.x = -Math.PI / 2
    sweepArc.position.y = daisTop + 0.006
    sweepGroup.add(sweepArc)
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(deckR, 0.008, 0.018),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentHue.a), transparent: true, opacity: isDark ? 0.5 : 0.6,
        depthWrite: false, blending: THREE.AdditiveBlending,
      }),
    )
    beam.position.set(deckR / 2, daisTop + 0.008, 0)
    sweepGroup.add(beam)

    interface ColumnRuntime {
      group: THREE.Group
      shell: THREE.Mesh
      shellMat: THREE.MeshPhysicalMaterial
      core: THREE.Mesh
      coreMat: THREE.MeshBasicMaterial
      glow: THREE.Sprite
      label: THREE.Sprite
      targetH: number
      reveal: number
      angle: number
      idx: number
      baseEmissive: number
    }
    const columns: ColumnRuntime[] = []
    const hitMeshes: THREE.Mesh[] = []
    const sharedShellGeo = new THREE.CylinderGeometry(0.2, 0.3, 1, 6, 1)
    const sharedCoreGeo = new THREE.CylinderGeometry(0.11, 0.17, 1, 6, 1)
    const startAngle = -Math.PI / 2

    items.forEach((slice, i) => {
      const value = Math.max(0, slice.value)
      const t = value / maxValue
      const targetH = 0.45 + t * (hasData ? 2.0 : 0.9)
      const angle = startAngle + (i / n) * Math.PI * 2
      const x = Math.cos(angle) * columnR
      const z = Math.sin(angle) * columnR
      const hue = slice.hue

      const group = new THREE.Group()
      group.position.set(x, 0, z)
      orbit.add(group)

      const shellMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hue.b),
        emissive: new THREE.Color(hue.a),
        emissiveIntensity: hasData ? (isDark ? 0.62 : 0.34) : 0.15,
        metalness: isDark ? 0.2 : 0.28,
        roughness: isDark ? 0.12 : 0.16,
        transparent: true,
        opacity: isDark ? 0.84 : 0.72,
        clearcoat: isDark ? 0.85 : 1.0,
        clearcoatRoughness: isDark ? 0.26 : 0.12,
        flatShading: true,
      })
      const shell = new THREE.Mesh(sharedShellGeo, shellMat)
      shell.scale.set(1, 0.001, 1)
      shell.position.y = daisTop
      shell.userData = { idx: i }
      group.add(shell)
      if (hasData) {
        hitMeshes.push(shell)
      }

      const coreMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(hue.a),
        transparent: true,
        opacity: hasData ? (isDark ? 0.58 : 0.86) : 0.2,
        blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      })
      const core = new THREE.Mesh(sharedCoreGeo, coreMat)
      core.scale.set(1, 0.001, 1)
      core.position.y = daisTop
      group.add(core)

      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: new THREE.Color(hue.a), transparent: true,
        opacity: isDark ? 0.8 : 0.5, depthWrite: false, blending: THREE.AdditiveBlending,
      }))
      glow.scale.setScalar(0.6)
      glow.position.y = daisTop + targetH + 0.24
      group.add(glow)

      const label = makeLabelSprite(`${value}`, ink, 30, 850)
      label.scale.multiplyScalar(0.5)
      label.position.y = daisTop + targetH + 0.58
      group.add(label)

      const pool = new THREE.PointLight(new THREE.Color(hue.a), isDark ? 18 : 9, 5.5, 2)
      pool.position.set(x, 1.1, z)
      orbit.add(pool)

      columns.push({
        group, shell, shellMat, core, coreMat, glow, label,
        targetH, reveal: -i * 0.12, angle, idx: i,
        baseEmissive: hasData ? (isDark ? 0.62 : 0.34) : 0.15,
      })
    })

    const dustCount = 34
    const dustGeo = new THREE.BufferGeometry()
    const dustPos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const a = Math.random() * Math.PI * 2
      const r = deckR * (0.5 + Math.random() * 0.7)
      dustPos[i * 3] = Math.cos(a) * r
      dustPos[i * 3 + 1] = Math.random() * 3
      dustPos[i * 3 + 2] = Math.sin(a) * r
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.055, map: glowTex, transparent: true, opacity: isDark ? 0.4 : 0.5,
        depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(accentHue.a),
      }),
    )
    orbit.add(dust)

    fitToBounds(deckR + 0.5, 1.95, 2.4, new THREE.Vector3(0, 0.82, 0))

    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const container = containerRef.current
    let offMove: () => void = () => {}
    if (container) {
      const onMove = (e: PointerEvent) => {
        const ctx = getCtx()
        if (!ctx || hitMeshes.length === 0) return
        const rect = container.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(ndc, ctx.camera)
        const hits = raycaster.intersectObjects(hitMeshes, false)
        const idx = hits.length > 0 ? (hits[0].object.userData.idx as number) : null
        if (idx !== hoverRef.current) {
          hoverRef.current = idx
          setHoverIdx(idx)
        }
        pauseRef.current = idx !== null
      }
      const onLeave = () => {
        hoverRef.current = null
        setHoverIdx(null)
        pauseRef.current = false
      }
      container.addEventListener('pointermove', onMove)
      container.addEventListener('pointerleave', onLeave)
      offMove = () => {
        container.removeEventListener('pointermove', onMove)
        container.removeEventListener('pointerleave', onLeave)
      }
    }

    const cancelTick = addTick((elapsed, dt) => {
      const cur = hoverRef.current
      const paused = pauseRef.current

      if (!paused) sweepGroup.rotation.y = elapsed * 0.72
      const sweepAngle = -sweepGroup.rotation.y

      columns.forEach(c => {
        c.reveal = Math.min(1, c.reveal + dt / 1.0)
        const p = easeOutCubic(Math.max(0, c.reveal))
        const hot = cur === c.idx
        const lit = paused ? 0 : Math.max(0, 1 - angleDelta(c.angle, sweepAngle) / 0.7)
        const height = Math.max(0.001, c.targetH * p)
        c.shell.scale.y = height
        c.shell.scale.x = 1 + (hot ? 0.08 : 0)
        c.shell.scale.z = 1 + (hot ? 0.08 : 0)
        c.shell.position.y = daisTop + height / 2
        c.shellMat.emissiveIntensity = c.baseEmissive + lit * 0.55 + (hot ? 0.8 : 0) + (paused ? 0 : Math.sin(elapsed * 1.6 + c.idx) * 0.08)

        c.core.scale.y = height
        c.core.position.y = daisTop + height / 2
        if (!paused) c.core.rotation.y = -elapsed * 0.4 + c.idx
        c.coreMat.opacity = (hasData ? (isDark ? 0.58 : 0.86) : 0.2) * p + lit * 0.16 + (hot ? 0.16 : 0)

        const top = daisTop + height + 0.24
        c.glow.position.y = top + (paused ? 0 : Math.sin(elapsed * 1.5 + c.idx) * 0.03)
        const glowBase = isDark ? 0.8 : 0.5
        c.glow.material.opacity = p * (glowBase + lit * 0.2 + (hot ? 0.2 : 0))
        c.glow.scale.setScalar((0.55 + lit * 0.14 + (hot ? 0.16 : 0)) * p)
        c.label.position.y = top + 0.34
      })

      if (!paused) {
        sweepMat.opacity = (isDark ? 0.16 : 0.24) + Math.sin(elapsed * 1.3) * 0.03
        ;(beam.material as THREE.MeshBasicMaterial).opacity = (isDark ? 0.5 : 0.6) + Math.sin(elapsed * 1.3) * 0.08
        gridRings.forEach((r, i) => {
          const m = r.material as THREE.MeshBasicMaterial
          m.opacity = (isDark ? 0.16 : 0.28) + Math.sin(elapsed * 0.9 + i) * 0.04
        })
        deckRim.rotation.z = elapsed * 0.15
        const dp = dustGeo.getAttribute('position') as THREE.BufferAttribute
        for (let i = 0; i < dustCount; i++) {
          let y = dp.getY(i) + dt * 0.12
          if (y > 3.2) y = 0.02
          dp.setY(i, y)
        }
        dp.needsUpdate = true
        dust.rotation.y = Math.sin(elapsed * 0.05) * 0.06
      }
    })

    return () => {
      offMove()
      cancelTick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slices, isDark, accent])

  const total = slices.reduce((s, d) => s + Math.max(0, d.value), 0)
  const active = hoverIdx !== null ? slices[hoverIdx] : null
  const pct = active && total > 0 ? Math.round((Math.max(0, active.value) / total) * 100) : null

  return (
    <div
      ref={containerRef}
      className={`stage-3d-shell overflow-hidden rounded-2xl ${className || ''}`}
      style={{ height, position: 'relative', cursor: active ? 'pointer' : 'grab', touchAction: 'pan-y' }}
    >
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
          <div
            className="flex flex-col items-center justify-center rounded-full border text-center backdrop-blur-md"
            style={{
              width: 108,
              height: 96,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.32)' : 'rgba(255,255,255,0.55)',
              boxShadow: isDark
                ? 'inset 0 1px 0 rgba(255,255,255,0.10)'
                : 'inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <span className={isDark ? 'text-xl font-extrabold tracking-tight text-white' : 'text-xl font-extrabold tracking-tight text-slate-900'}>
              {centerValue ?? total}
            </span>
            {centerLabel && (
              <span className={`mt-0.5 text-[8.5px] font-bold uppercase tracking-[1.4px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {centerLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {active ? (
        <div className="pointer-events-none absolute left-3 top-2 z-10">
          <span
            className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md"
            style={{
              color: isDark ? '#fff' : '#1c1917',
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.10)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.74)' : 'rgba(255,255,255,0.86)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: active.hue.line, boxShadow: `0 0 6px ${active.hue.glow}` }} />
            {active.name} · {active.value.toLocaleString('fr-FR')} mandat{active.value > 1 ? 's' : ''}
            {pct !== null ? ` · ${pct}%` : ''}
          </span>
        </div>
      ) : total <= 0 ? (
        <div className="pointer-events-none absolute left-3 top-2 z-10">
          <span
            className="rounded-xl border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md"
            style={{
              color: isDark ? 'rgba(226,232,240,0.75)' : 'rgba(51,65,85,0.8)',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.68)' : 'rgba(255,255,255,0.8)',
            }}
          >
            Aucun mandat
          </span>
        </div>
      ) : null}

      {hint && (
        <div className="pointer-events-none absolute bottom-2 right-3 z-10">
          <span
            className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.2px] backdrop-blur-md"
            style={{
              color: isDark ? 'rgba(226,232,240,0.58)' : 'rgba(28,25,23,0.55)',
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
