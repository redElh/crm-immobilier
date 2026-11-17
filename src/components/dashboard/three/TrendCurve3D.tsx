import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThreeStage, makeGlowTexture, makeLabelSprite, disposeObject3D } from './useThreeStage'
import type { StageHue } from '../Stage'

export interface TrendCurveSeries {
  dataKey: string
  name: string
  hue: StageHue
  unit?: string
}

export interface TrendCurve3DProps {
  data: Record<string, string | number>[]
  series: TrendCurveSeries[]
  isDark: boolean
  height?: number
  className?: string
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function formatValue(v: number, unit?: string): string {
  const rounded = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10
  return `${rounded.toLocaleString('fr-FR')}${unit ? ` ${unit}` : ''}`
}

/**
 * TrendCurve3D — two independent glowing curves floating above a grid
 * floor, with translucent curtains, spring-in reveal, travelling pulse and
 * a hover probe. Curves are normalised independently so a small series
 * (mandates) never collapses onto the baseline of a large one (revenue).
 */
export function TrendCurve3D({ data, series, isDark, height = 280, className }: TrendCurve3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { orbitRef, addTick, fitToBounds } = useThreeStage(containerRef, {
    camPos: [0, 6, 13],
    lookAt: [0, 1.295, 0],
    fov: 42,
    autoRotateSpeed: 0,
    swayAmplitude: 0.08,
    swaySpeed: 0.22,
    yawLimit: 0.7,
  })
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const hoverRef = useRef<number | null>(null)

  useEffect(() => { hoverRef.current = hoverIdx }, [hoverIdx])

  useEffect(() => {
    const orbit = orbitRef.current
    if (!orbit || data.length === 0 || series.length === 0) return
    while (orbit.children.length) {
      const child = orbit.children[0]
      orbit.remove(child)
      disposeObject3D(child)
    }

    const glowTex = makeGlowTexture()
    const mutedInk = isDark ? 'rgba(203,213,225,0.66)' : 'rgba(51,65,85,0.66)'
    const n = data.length
    const span = 7.2
    const x0 = -span / 2
    const step = n > 1 ? span / (n - 1) : 0
    const maxHeight = 2.55
    const floorY = 0.04

    /* lighting */
    const key = new THREE.DirectionalLight(0xffffff, isDark ? 1.1 : 1.5)
    key.position.set(3, 8, 5)
    orbit.add(key)
    orbit.add(new THREE.AmbientLight(0xffffff, isDark ? 0.72 : 1))
    series.forEach((s, i) => {
      const l = new THREE.PointLight(new THREE.Color(s.hue.a), isDark ? 42 : 18, 34, 2)
      l.position.set(i === 0 ? -4.5 : 4.5, 3.6, 3.4)
      orbit.add(l)
    })

    /* ground */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 18),
      new THREE.MeshBasicMaterial({
        map: glowTex, transparent: true, opacity: isDark ? 0.12 : 0.24,
        depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(series[0].hue.b),
      })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    orbit.add(floor)

    const grid = new THREE.GridHelper(12, 24, 0x94a3b8, 0x94a3b8)
    const gridMat = grid.material as THREE.Material & { opacity: number }
    gridMat.transparent = true
    gridMat.opacity = isDark ? 0.12 : 0.18
    orbit.add(grid)

    /* curves */
    const chart = new THREE.Group()
    orbit.add(chart)

    const hoverProbe = new THREE.Group()
    hoverProbe.visible = false
    orbit.add(hoverProbe)
    const probeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(series[0].hue.a), transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const probeColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 3.1, 8, 1, true), probeMat)
    probeColumn.position.y = 1.55
    hoverProbe.add(probeColumn)
    const probeDots = series.map(s => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 16, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(s.hue.a) })
      )
      hoverProbe.add(dot)
      return dot
    })

    interface SeriesRuntime {
      curve: THREE.CatmullRomCurve3
      pulse: THREE.Group
      points: { x: number; y: number; z: number }[]
      hue: StageHue
    }
    const runtimes: SeriesRuntime[] = []

    series.forEach((s, si) => {
      const values = data.map(d => Number(d[s.dataKey] ?? 0))
      const max = Math.max(...values, 1)
      const z = si === 0 ? 0 : 0.42
      const points3 = data.map((_, i) => {
        const x = x0 + i * step
        const y = floorY + 0.18 + clamp01(values[i] / max) * maxHeight
        return new THREE.Vector3(x, y, z)
      })
      const curve = new THREE.CatmullRomCurve3(points3, false, 'catmullrom', 0.35)

      /* broad glow tube */
      const glowGeo = new THREE.TubeGeometry(curve, 140, 0.1, 8, false)
      const glow = new THREE.Mesh(
        glowGeo,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(s.hue.a), transparent: true, opacity: isDark ? 0.15 : 0.2,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      )
      chart.add(glow)

      /* crisp core */
      const coreGeo = new THREE.TubeGeometry(curve, 160, 0.032, 8, false)
      const core = new THREE.Mesh(
        coreGeo,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(s.hue.a).lerp(new THREE.Color(0xffffff), 0.3),
          emissive: new THREE.Color(s.hue.a),
          emissiveIntensity: isDark ? 1.6 : 1.1,
          metalness: 0.2, roughness: 0.28,
        })
      )
      chart.add(core)

      /* translucent curtain below the curve */
      const samples = 90
      const curtainPositions = new Float32Array(samples * 2 * 3)
      const indices: number[] = []
      for (let i = 0; i < samples; i++) {
        const p = curve.getPointAt(i / (samples - 1))
        curtainPositions[i * 6] = p.x
        curtainPositions[i * 6 + 1] = p.y
        curtainPositions[i * 6 + 2] = p.z
        curtainPositions[i * 6 + 3] = p.x
        curtainPositions[i * 6 + 4] = floorY
        curtainPositions[i * 6 + 5] = p.z
        if (i < samples - 1) {
          const a = i * 2
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
        }
      }
      const curtainGeo = new THREE.BufferGeometry()
      curtainGeo.setAttribute('position', new THREE.BufferAttribute(curtainPositions, 3))
      curtainGeo.setIndex(indices)
      const curtain = new THREE.Mesh(
        curtainGeo,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(s.hue.a), transparent: true, opacity: isDark ? 0.1 : 0.13,
          side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
        })
      )
      chart.add(curtain)

      /* baseline projection */
      const baseGeo = new THREE.BufferGeometry().setFromPoints(
        points3.map(p => new THREE.Vector3(p.x, floorY + 0.01, p.z))
      )
      const baseline = new THREE.Line(
        baseGeo,
        new THREE.LineBasicMaterial({ color: new THREE.Color(s.hue.a), transparent: true, opacity: 0.24 })
      )
      chart.add(baseline)

      /* data nodes */
      const nodeGeo = new THREE.SphereGeometry(0.075, 16, 16)
      data.forEach((_, i) => {
        const p = points3[i]
        const node = new THREE.Mesh(
          nodeGeo,
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(s.hue.a).lerp(new THREE.Color(0xffffff), 0.45),
            emissive: new THREE.Color(s.hue.a),
            emissiveIntensity: isDark ? 1.8 : 1.2,
            metalness: 0.1, roughness: 0.25,
          })
        )
        node.position.copy(p)
        chart.add(node)

        const halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTex, color: new THREE.Color(s.hue.a), transparent: true,
          opacity: isDark ? 0.7 : 0.45, depthWrite: false, blending: THREE.AdditiveBlending,
        }))
        halo.scale.setScalar(0.38)
        halo.position.copy(p)
        chart.add(halo)
      })

      /* travelling pulse */
      const pulse = new THREE.Group()
      const pulseCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      )
      const pulseGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: new THREE.Color(s.hue.a), transparent: true,
        opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending,
      }))
      pulseGlow.scale.setScalar(0.7)
      pulse.add(pulseCore, pulseGlow)
      chart.add(pulse)

      runtimes.push({ curve, pulse, points: points3.map(p => ({ x: p.x, y: p.y, z: p.z })), hue: s.hue })
    })

    /* floor labels */
    data.forEach((d, i) => {
      const label = makeLabelSprite(String(d.label), mutedInk, 34, 700)
      label.scale.multiplyScalar(0.62)
      label.position.set(x0 + i * step, 0.2, 0.7)
      orbit.add(label)
    })

    /* floating dust */
    const dustCount = 26
    const dustGeo = new THREE.BufferGeometry()
    const dustPos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 10
      dustPos[i * 3 + 1] = Math.random() * 3.6
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.065, map: glowTex, transparent: true, opacity: isDark ? 0.36 : 0.52,
        depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(series[0].hue.a),
      })
    )
    orbit.add(dust)

    fitToBounds(5.5, 2.0, 2.0, new THREE.Vector3(1.5, 1.295, 0))

    /* hover probe based on horizontal position */
    const container = containerRef.current
    let offMove: () => void = () => {}
    if (container) {
      const onMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width
        const idx = Math.max(0, Math.min(n - 1, Math.round(px * (n - 1))))
        if (idx !== hoverRef.current) {
          hoverRef.current = idx
          setHoverIdx(idx)
        }
      }
      const onLeave = () => {
        hoverRef.current = null
        setHoverIdx(null)
      }
      container.addEventListener('pointermove', onMove)
      container.addEventListener('pointerleave', onLeave)
      offMove = () => {
        container.removeEventListener('pointermove', onMove)
        container.removeEventListener('pointerleave', onLeave)
      }
    }

    let reveal = 0
    const cancelTick = addTick((elapsed, dt) => {
      reveal = Math.min(1, reveal + dt / 1.05)
      const eased = 1 - Math.pow(1 - reveal, 3)
      chart.scale.y = 0.02 + eased * 0.98

      for (let si = 0; si < runtimes.length; si++) {
        const rt = runtimes[si]
        const t = ((elapsed * 0.09 + si * 0.37) % 1)
        const p = rt.curve.getPointAt(t)
        rt.pulse.position.copy(p)
        const pulseScale = 0.9 + Math.sin(elapsed * 4 + si) * 0.18
        rt.pulse.scale.setScalar(pulseScale)
      }

      const cur = hoverRef.current
      if (cur !== null && runtimes.length) {
        hoverProbe.visible = true
        const x = x0 + cur * step
        hoverProbe.position.x = x
        runtimes.forEach((rt, si) => {
          probeDots[si].position.set(0, rt.points[cur].y * chart.scale.y, rt.points[cur].z)
        })
        ;(probeColumn.material as THREE.MeshBasicMaterial).opacity = 0.28 + Math.sin(elapsed * 3.1) * 0.08
      } else {
        hoverProbe.visible = false
      }

      const dp = dustGeo.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < dustCount; i++) {
        let y = dp.getY(i) + dt * 0.1
        if (y > 3.8) y = 0.05
        dp.setY(i, y)
      }
      dp.needsUpdate = true
    })

    return () => {
      offMove()
      cancelTick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, series, isDark])

  const active = hoverIdx !== null ? data[hoverIdx] : null
  return (
    <div
      ref={containerRef}
      className={`stage-3d-shell overflow-hidden rounded-2xl ${className || ''}`}
      style={{ height, position: 'relative', cursor: 'crosshair', touchAction: 'pan-y' }}
    >
      {/* legend */}
      <div className="pointer-events-none absolute left-3 top-2 z-10 flex flex-wrap gap-1.5">
        {series.map(s => (
          <span
            key={s.dataKey}
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold backdrop-blur-md"
            style={{
              color: isDark ? '#E2E8F0' : '#334155',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.58)' : 'rgba(255,255,255,0.76)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.hue.line, boxShadow: `0 0 6px ${s.hue.glow}` }} />
            {s.name}
          </span>
        ))}
      </div>

      {/* hover readout */}
      {active && (
        <div className="pointer-events-none absolute right-3 top-2 z-10">
          <div
            className="rounded-xl border px-2.5 py-1.5 text-[11px] backdrop-blur-md"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.10)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.78)' : 'rgba(255,255,255,0.86)',
              boxShadow: '0 10px 28px -16px rgba(0,0,0,0.6)',
            }}
          >
            <p className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{active.label}</p>
            {series.map(s => (
              <p key={s.dataKey} className={`mt-0.5 inline-flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.hue.line, boxShadow: `0 0 6px ${s.hue.glow}` }} />
                {s.name} · <b className={isDark ? 'text-white' : 'text-slate-900'}>
                  {formatValue(Number(active[s.dataKey] ?? 0), s.unit)}
                </b>
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-2 right-3 z-10">
        <span
          className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.2px] backdrop-blur-md"
          style={{
            color: isDark ? 'rgba(226,232,240,0.6)' : 'rgba(28,25,23,0.55)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
            backgroundColor: isDark ? 'rgba(10,14,30,0.55)' : 'rgba(255,255,255,0.7)',
          }}
        >
          survoler pour lire · glisser pour orbiter
        </span>
      </div>
    </div>
  )
}
