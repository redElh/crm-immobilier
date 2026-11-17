import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThreeStage, makeGlowTexture, disposeObject3D } from './useThreeStage'
import { Bars3D, type Bars3DItem } from './Bars3D'
import type { StageHue } from '../Stage'

export interface ContactOrbitSlice {
  name: string
  value: number
  hue: StageHue
}

export interface ContactOrbit3DProps {
  slices: ContactOrbitSlice[]
  centerValue?: string
  centerLabel?: string
  isDark: boolean
  height?: number
  className?: string
  accent?: StageHue
  emptyLabel?: string
}

const EMPTY_HUE: StageHue = { a: '#94A3B8', b: '#475569', line: '#94A3B8', glow: 'rgba(148,163,184,0.4)' }

function easeOutCubic(u: number): number {
  if (u <= 0) return 0
  if (u >= 1) return 1
  return 1 - Math.pow(1 - u, 3)
}

const MAX_SATELLITES = 8

function makeCenterBadge(value: string, label: string | undefined, isDark: boolean): THREE.Sprite {
  const width = 280
  const height = 236
  const ratio = 3
  const canvas = document.createElement('canvas')
  canvas.width = width * ratio
  canvas.height = height * ratio
  const ctx = canvas.getContext('2d')!
  ctx.scale(ratio, ratio)
  ctx.beginPath()
  ctx.ellipse(width / 2, height / 2, width / 2 - 12, height / 2 - 12, 0, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? 'rgba(10,14,30,0.46)' : 'rgba(255,255,255,0.66)'
  ctx.fill()
  ctx.lineWidth = 1.6
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.12)'
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A'
  ctx.font = '800 60px Inter, "Segoe UI", system-ui, sans-serif'
  ctx.fillText(value, width / 2, label ? height / 2 - 14 : height / 2)
  if (label) {
    ctx.fillStyle = isDark ? 'rgba(148,163,184,0.94)' : 'rgba(71,85,105,0.84)'
    ctx.font = '700 19px Inter, "Segoe UI", system-ui, sans-serif'
    ctx.fillText(label.toUpperCase(), width / 2, height / 2 + 38)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 4
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    alphaTest: 0.04,
  }))
  sprite.scale.set((width / 140) * 0.78, (height / 140) * 0.78, 1)
  return sprite
}

/**
 * ContactOrbit3D — orbits satellites while populations stay small enough to
 * count one by one; switches to the dashboard's neon bar scene once a ring
 * would overflow (more than {@link MAX_SATELLITES} contacts).
 */
export function ContactOrbit3D(props: ContactOrbit3DProps) {
  const needsBars = props.slices.some(s => Math.max(0, s.value) > MAX_SATELLITES)
  return needsBars ? <ContactBars3D {...props} /> : <ContactOrbitScene {...props} />
}

function ContactBars3D({
  slices,
  centerValue,
  centerLabel,
  isDark,
  height = 300,
  className,
  accent,
}: ContactOrbit3DProps) {
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0)
  const hue = accent ?? slices[0]?.hue ?? EMPTY_HUE
  const data = useMemo<Bars3DItem[]>(() => slices.map(s => {
    const value = Math.max(0, s.value)
    const share = total > 0 ? Math.round((value / total) * 100) : 0
    return {
      label: s.name,
      value,
      hue: s.hue,
      meta: total > 0 ? `${share}% du portefeuille` : 'aucun contact',
    }
  }), [slices, total])
  return (
    <Bars3D
      data={data}
      hue={hue}
      isDark={isDark}
      height={height}
      className={className}
      showValues
      showLabels={false}
      showTrend={false}
      barSpacing={2.1}
      hint={`${centerValue ?? total} ${centerLabel ?? 'contacts'} · glisser pour orbiter`}
    />
  )
}

/**
 * ContactOrbitScene — a holographic contact constellation: a faceted nucleus
 * surrounded by tilted orbital rings, one per contact type. Every contact
 * becomes a satellite on its ring; bigger populations carry brighter rings
 * and denser clusters. Drag to orbit, hover a ring to inspect.
 */
function ContactOrbitScene({
  slices,
  centerValue,
  centerLabel,
  isDark,
  height = 300,
  className,
  accent,
  emptyLabel = 'Aucun contact',
}: ContactOrbit3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pauseRef = useRef(false)
  const { orbitRef, addTick, getCtx, fitToBounds } = useThreeStage(containerRef, {
    camPos: [0, 5.4, 10.2],
    lookAt: [0, 0, 0],
    fov: 38,
    autoRotateSpeed: 0.05,
    swayAmplitude: 0.09,
    swaySpeed: 0.24,
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
    const items = hasData ? slices : [{ name: emptyLabel, value: 0, hue: EMPTY_HUE }]
    const n = items.length
    const baseRadius = 1.65
    const step = n > 3 ? 0.5 : 0.62

    const key = new THREE.DirectionalLight(0xffffff, isDark ? 1.25 : 1.85)
    key.position.set(4, 9, 6)
    orbit.add(key)
    orbit.add(new THREE.AmbientLight(0xffffff, isDark ? 0.55 : 0.95))
    const rim = new THREE.PointLight(new THREE.Color(accentHue.a), isDark ? 42 : 26, 30, 2)
    rim.position.set(-4, 3.5, -4)
    orbit.add(rim)
    const fill = new THREE.PointLight(new THREE.Color(accentHue.a), isDark ? 24 : 14, 26, 2)
    fill.position.set(4, 2, 4)
    orbit.add(fill)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.MeshBasicMaterial({
        map: glowTex, transparent: true, opacity: isDark ? 0.1 : 0.22,
        depthWrite: false, blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
        color: new THREE.Color(accentHue.b),
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.25
    orbit.add(floor)

    const nucleus = new THREE.Group()
    orbit.add(nucleus)
    const coreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHue.b),
      emissive: new THREE.Color(accentHue.a),
      emissiveIntensity: isDark ? 1.4 : 0.9,
      metalness: isDark ? 0.35 : 0.55,
      roughness: isDark ? 0.25 : 0.2,
      flatShading: true,
    })
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), coreMat)
    nucleus.add(core)
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentHue.a), wireframe: true, transparent: true,
      opacity: isDark ? 0.38 : 0.5, depthWrite: false,
    })
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(0.84, 1), wireMat)
    nucleus.add(wire)
    const nucleusGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: new THREE.Color(accentHue.a), transparent: true,
      opacity: isDark ? 0.55 : 0.7, depthWrite: false, blending: THREE.AdditiveBlending,
    }))
    nucleusGlow.scale.setScalar(3.4)
    nucleus.add(nucleusGlow)

    const centerGroup = new THREE.Group()
    orbit.add(centerGroup)
    const centerBadge = makeCenterBadge(
      centerValue ?? (hasData ? String(total) : '0'),
      centerLabel,
      isDark,
    )
    centerBadge.renderOrder = -1
    centerGroup.add(centerBadge)

    interface Sat {
      mesh: THREE.Mesh
      base: number
      phase: number
    }
    interface RingRuntime {
      group: THREE.Group
      mat: THREE.MeshBasicMaterial
      sats: Sat[]
      satMat: THREE.MeshStandardMaterial
      hue: StageHue
      share: number
      reveal: number
      spin: number
      idx: number
    }
    const rings: RingRuntime[] = []
    const hitMeshes: THREE.Mesh[] = []
    const satGeo = new THREE.SphereGeometry(1, 14, 14)

    items.forEach((slice, i) => {
      const radius = baseRadius + i * step
      const value = Math.max(0, slice.value)
      const share = hasData && total > 0 ? value / total : 0
      const group = new THREE.Group()
      group.rotation.x = Math.PI / 2 + (i - (n - 1) / 2) * 0.16
      group.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.12 * i
      orbit.add(group)

      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(slice.hue.a),
        transparent: true,
        opacity: hasData ? 0.22 + share * 0.6 : 0.3,
        blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, hasData ? 0.018 + share * 0.02 : 0.012, 8, 132),
        ringMat,
      )
      group.add(ring)

      const satMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(slice.hue.b).lerp(new THREE.Color(slice.hue.a), isDark ? 0.32 : 0.46),
        emissive: new THREE.Color(slice.hue.a),
        emissiveIntensity: hasData ? 1.1 : 0.2,
        metalness: isDark ? 0.3 : 0.5,
        roughness: isDark ? 0.35 : 0.2,
      })
      const count = hasData
        ? Math.max(2, Math.min(MAX_SATELLITES, Math.round((0.25 + value / maxValue) * 6)))
        : 1
      const sats: Sat[] = []
      for (let j = 0; j < count; j++) {
        const a = (j / count) * Math.PI * 2 + i * 0.7
        const rad = radius + Math.sin(j * 1.7 + i) * 0.06
        const size = hasData ? 0.075 + share * 0.09 : 0.05
        const mesh = new THREE.Mesh(satGeo, satMat)
        mesh.scale.setScalar(size)
        mesh.position.set(Math.cos(a) * rad, Math.sin(a) * rad, 0)
        mesh.userData = { idx: i }
        group.add(mesh)
        hitMeshes.push(mesh)
        sats.push({ mesh, base: size, phase: a })
      }

      group.scale.setScalar(0.001)
      rings.push({
        group, mat: ringMat, sats, satMat, hue: slice.hue, share,
        reveal: -i * 0.12, spin: (i % 2 === 0 ? 1 : -1) * (0.14 + i * 0.03), idx: i,
      })
    })

    const dustCount = 40
    const dustGeo = new THREE.BufferGeometry()
    const dustPos = new Float32Array(dustCount * 3)
    const spread = baseRadius + (n - 1) * step + 1.1
    for (let i = 0; i < dustCount; i++) {
      const a = Math.random() * Math.PI * 2
      const r = spread * (0.45 + Math.random() * 0.75)
      dustPos[i * 3] = Math.cos(a) * r
      dustPos[i * 3 + 1] = (Math.random() - 0.4) * 3.2
      dustPos[i * 3 + 2] = Math.sin(a) * r
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.06, map: glowTex, transparent: true, opacity: isDark ? 0.32 : 0.5,
        depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(accentHue.a),
      }),
    )
    orbit.add(dust)

    const halfWidth = baseRadius + (n - 1) * step + 0.6
    fitToBounds(halfWidth, 2.15, 2.6, new THREE.Vector3(0, 0, 0))

    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const cameraDir = new THREE.Vector3()
    const inverseOrbit = new THREE.Quaternion()
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
      const ctx = getCtx()
      if (ctx) {
        cameraDir.copy(ctx.camera.position).normalize()
        cameraDir.applyQuaternion(inverseOrbit.copy(orbit.quaternion).invert())
        centerGroup.position.copy(cameraDir).multiplyScalar(0.96)
      }

      rings.forEach(r => {
        r.reveal = Math.min(1, r.reveal + dt / 0.95)
        const p = easeOutCubic(Math.max(0, r.reveal))
        const hot = cur === r.idx
        r.group.scale.setScalar(Math.max(0.001, p * (1 + (hot ? 0.04 : 0))))
        if (!paused) r.group.rotation.z += dt * r.spin * (hot ? 0.3 : 1)
        r.mat.opacity = (hasData ? 0.2 + r.share * 0.55 : 0.28) + (hot ? 0.22 : 0)
        r.satMat.emissiveIntensity = paused
          ? (hasData ? 1.2 : 0.2) + (hot ? 0.9 : 0)
          : (hasData ? 1.1 : 0.2) + Math.sin(elapsed * 1.9 + r.idx) * 0.25 + (hot ? 0.9 : 0)
        r.sats.forEach((s, j) => {
          const breathe = paused ? 0 : Math.sin(elapsed * 2.1 + j * 1.4 + r.idx) * 0.08
          const target = s.base * (1 + (hot ? 0.55 : 0) + breathe)
          s.mesh.scale.setScalar(Math.max(0.001, target * p))
        })
      })

      if (!paused) {
        nucleus.rotation.y += dt * 0.5
        nucleus.rotation.x = Math.sin(elapsed * 0.3) * 0.18
        wire.rotation.y -= dt * 0.35
        wire.rotation.z = Math.sin(elapsed * 0.4) * 0.12
        const dp = dustGeo.getAttribute('position') as THREE.BufferAttribute
        for (let i = 0; i < dustCount; i++) {
          let y = dp.getY(i) + dt * 0.07
          if (y > 2.1) y = -1.3
          dp.setY(i, y)
        }
        dp.needsUpdate = true
        dust.rotation.y = Math.sin(elapsed * 0.05) * 0.08
      }

      const pulse = paused ? 0 : Math.sin(elapsed * 1.4) * 0.18
      coreMat.emissiveIntensity = (isDark ? 1.4 : 0.9) + pulse + (cur !== null ? 0.35 : 0)
      wireMat.opacity = (isDark ? 0.38 : 0.5) + (paused ? 0 : Math.sin(elapsed * 1.1) * 0.08)
      nucleusGlow.material.opacity = (isDark ? 0.55 : 0.7) + (paused ? 0 : Math.sin(elapsed * 1.4) * 0.1)
      nucleusGlow.scale.setScalar(3.4 + (paused ? 0 : Math.sin(elapsed * 1.4) * 0.18))
    })

    return () => {
      offMove()
      cancelTick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slices, isDark, accent, emptyLabel, centerValue, centerLabel])

  const total = slices.reduce((s, d) => s + Math.max(0, d.value), 0)
  const active = hoverIdx !== null ? slices[hoverIdx] : null
  const pct = active && total > 0 ? Math.round((Math.max(0, active.value) / total) * 100) : null

  return (
    <div
      ref={containerRef}
      className={`stage-3d-shell overflow-hidden rounded-2xl ${className || ''}`}
      style={{ height, position: 'relative', cursor: active ? 'pointer' : 'grab', touchAction: 'pan-y' }}
    >
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
            {active.name} · {active.value.toLocaleString('fr-FR')}
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
            {emptyLabel}
          </span>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-2 right-3 z-10">
        <span
          className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.2px] backdrop-blur-md"
          style={{
            color: isDark ? 'rgba(226,232,240,0.58)' : 'rgba(28,25,23,0.55)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
            backgroundColor: isDark ? 'rgba(10,14,30,0.55)' : 'rgba(255,255,255,0.7)',
          }}
        >
          glisser pour orbiter · survoler une orbite
        </span>
      </div>
    </div>
  )
}
