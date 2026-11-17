import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThreeStage, makeGlowTexture, makeLabelSprite, disposeObject3D } from './useThreeStage'
import type { StageHue } from '../Stage'

export interface Donut3DSlice {
  name: string
  value: number
  hue: StageHue
}

export interface Donut3DProps {
  slices: Donut3DSlice[]
  centerValue?: string
  centerLabel?: string
  isDark: boolean
  height?: number
  className?: string
  /** Neutral label shown in the tooltip when there is no slice. */
  emptyLabel?: string
}

const OUTER = 3.3
const INNER = 1.8
const THICKNESS = 0.9
/** Resting height of the whole chart above the floor grid. */
const BASE_Y = THICKNESS / 2 + 0.14
const EMPTY_HUE: StageHue = { a: '#94A3B8', b: '#475569', line: '#94A3B8', glow: 'rgba(148,163,184,0.4)' }

/** One ring sector (real hole in the middle), extruded and centred on y = 0. */
function makeSector(a0: number, a1: number): any {
  const arc = a1 - a0
  const shape = new (THREE as any).Shape()
  if (arc >= Math.PI * 2 - 1e-3) {
    shape.absarc(0, 0, OUTER, 0, Math.PI * 2, false)
    const hole = new (THREE as any).Path()
    hole.absarc(0, 0, INNER, 0, Math.PI * 2, true)
    shape.holes.push(hole)
  } else {
    shape.absarc(0, 0, OUTER, a0, a1, false)
    shape.absarc(0, 0, INNER, a1, a0, true)
    shape.closePath()
  }
  const geo = new (THREE as any).ExtrudeGeometry(shape, {
    depth: THICKNESS,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 6,
    curveSegments: Math.max(6, Math.ceil((arc / (Math.PI * 2)) * 96)),
  })
  geo.translate(0, 0, -THICKNESS / 2)
  return geo
}

/**
 * Donut3D — a real 3D ring chart: extruded glowing sectors around a solid
 * hub, with the value floating above the hub. Everything (ring, hub, halos,
 * label) lives in one group so nothing drifts relative to anything else.
 * Hovering a sector lifts it outward and pauses the slow spin.
 */
export function Donut3D({
  slices,
  centerValue,
  centerLabel,
  isDark,
  height = 280,
  className,
  emptyLabel = 'Aucune donnée',
}: Donut3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pauseRef = useRef(false)
  const { orbitRef, addTick, getCtx, fitToBounds } = useThreeStage(containerRef, {
    camPos: [0, 5, 12],
    lookAt: [0, 0, 0],
    fov: 35,
    autoRotateSpeed: 0,
    swayAmplitude: 0.1,
    swaySpeed: 0.28,
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
    const accent = hasData ? slices[0].hue : EMPTY_HUE
    const idleGlow = isDark ? 0.6 : 0.7
    const hotGlow = 1.6

    /* lighting */
    const key = new THREE.DirectionalLight(0xffffff, isDark ? 1.1 : 1.9)
    key.position.set(3.5, 8, 6)
    orbit.add(key)
    orbit.add(new THREE.AmbientLight(0xffffff, isDark ? 0.5 : 0.94))
    const rim = new THREE.PointLight(0xffffff, isDark ? 20 : 20, 22, 2)
    rim.position.set(-4.5, 4.2, -4)
    orbit.add(rim)

    /* ambient floor glow */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      new THREE.MeshBasicMaterial({
        map: glowTex, transparent: true, opacity: isDark ? 0.08 : 0.24,
        depthWrite: false, blending: isDark ? THREE.NormalBlending : THREE.AdditiveBlending,
        color: new THREE.Color(accent.b),
      })
    )
    floor.rotation.x = -Math.PI / 2
    orbit.add(floor)

    /* everything below shares this group: ring, hub, halos, label */
    const chartGroup = new THREE.Group()
    chartGroup.position.y = -0.3
    orbit.add(chartGroup)

    interface SliceRuntime {
      mesh: THREE.Mesh
      mat: THREE.MeshStandardMaterial
      dir: THREE.Vector3
      reveal: number
      hover: number
    }
    const runtimes: SliceRuntime[] = []
    const hitMeshes: THREE.Mesh[] = []

    const items = hasData ? slices : [{ name: emptyLabel, value: 1, hue: EMPTY_HUE }]
    const visible = items.filter(s => s.value > 0).length
    const gap = visible > 1 ? 0.035 : 0
    let start = 0

    items.forEach((slice, i) => {
      const angle = (Math.max(0, slice.value) / (hasData ? total : 1)) * Math.PI * 2
      if (angle < 1e-3) return
      const pad = Math.min(gap, angle * 0.4)
      const a0 = start + pad / 2
      const a1 = start + angle - pad / 2
      const mid = start + angle / 2
      start += angle

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(slice.hue.b).lerp(new THREE.Color(slice.hue.a), isDark ? 0.25 : 0.42),
        emissive: new THREE.Color(slice.hue.a),
        emissiveIntensity: hasData ? idleGlow : 0.12,
        metalness: hasData ? (isDark ? 0.25 : 0.48) : 0.3,
        roughness: hasData ? (isDark ? 0.55 : 0.26) : 0.55,
        transparent: !hasData,
        opacity: hasData ? 1 : 0.55,
      })
      const mesh = new THREE.Mesh(makeSector(a0, a1), mat)
      mesh.rotation.x = -Math.PI / 2 // lay flat; shape angle a maps to world (cos a, -sin a)
      mesh.scale.setScalar(0.001)
      mesh.userData = { idx: i }
      chartGroup.add(mesh)

      if (hasData) {
        hitMeshes.push(mesh)
        const light = new THREE.PointLight(new THREE.Color(slice.hue.a), isDark ? 12 : 12, 7, 2)
        const rMid = (OUTER + INNER) / 2
        light.position.set(Math.cos(mid) * rMid, 1.3, -Math.sin(mid) * rMid)
        chartGroup.add(light)
      }

      runtimes.push({
        mesh,
        mat,
        dir: new THREE.Vector3(Math.cos(mid), 0, -Math.sin(mid)),
        reveal: -i * 0.1,
        hover: 0,
      })
    })

    /* hub that fills the hole: a real 3D disc, not a flat sticker */
    const hubR = INNER - 0.12
    const hubH = THICKNESS * 0.7
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(hubR, hubR, hubH, 64),
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x1e293b : 0xf1f5f9,
        metalness: isDark ? 0.4 : 0.75,
        roughness: isDark ? 0.45 : 0.22,
        emissive: new THREE.Color(accent.a),
        emissiveIntensity: isDark ? 0.05 : 0.18,
      })
    )
    chartGroup.add(hub)

    const hubTop = hubH / 2
    const hubRing = new THREE.Mesh(
      new THREE.TorusGeometry(hubR, 0.028, 12, 96),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(accent.a), transparent: true, opacity: isDark ? 0.65 : 0.85 })
    )
    hubRing.rotation.x = Math.PI / 2
    hubRing.position.y = hubTop
    chartGroup.add(hubRing)

    const hubGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: new THREE.Color(accent.a), transparent: true,
      opacity: isDark ? 0.25 : 0.35, depthWrite: false, blending: THREE.AdditiveBlending,
    }))
    hubGlow.scale.setScalar(hubR * 3.2)
    hubGlow.position.y = hubTop + 0.02
    chartGroup.add(hubGlow)

    /* centre text: follows the donut hole but stays upright */
    const labelGroup = new THREE.Group()
    chartGroup.add(labelGroup)

    const overlay = (sprite: any) => {
      const m = sprite.material as any
      m.depthTest = false
      sprite.renderOrder = 10
      labelGroup.add(sprite)
    }
    if (centerValue || centerLabel) {
      const valStr = centerValue ?? total.toLocaleString('fr-FR')
      const valShadow = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'
      const valBlur = isDark ? 10 : 6
      const valLabel = makeLabelSprite(valStr, isDark ? '#ffffff' : '#0f172a', 54, 900, valShadow, valBlur)
      valLabel.scale.multiplyScalar(1.4)
      valLabel.position.set(0, (centerLabel ? 0.3 : 0.45), 0)
      overlay(valLabel)

      if (centerLabel) {
        const labShadow = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'
        const labBlur = isDark ? 8 : 6
        const labLabel = makeLabelSprite(centerLabel, isDark ? '#e2e8f0' : '#0f172a', 44, 900, labShadow, labBlur)
        labLabel.scale.multiplyScalar(0.9)
        labLabel.position.set(0, -0.3, 0)
        overlay(labLabel)
      }
    }

    /* orbital halos, inside the group so they tilt and bob with the ring */
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent.a),
      transparent: true, opacity: isDark ? 0.12 : 0.3, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const haloA = new THREE.Mesh(new THREE.TorusGeometry(OUTER + 0.48, 0.012, 6, 120), haloMat)
    haloA.rotation.x = Math.PI / 2
    chartGroup.add(haloA)
    const haloB = new THREE.Mesh(new THREE.TorusGeometry(OUTER + 0.66, 0.006, 6, 120), haloMat.clone())
    haloB.rotation.x = Math.PI / 2
    chartGroup.add(haloB)

    /* floating sparkle bed */
    const dustCount = 34
    const dustGeo = new THREE.BufferGeometry()
    const dustPos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const a = Math.random() * Math.PI * 2
      const r = OUTER * (0.7 + Math.random() * 0.55)
      dustPos[i * 3] = Math.cos(a) * r
      dustPos[i * 3 + 1] = Math.random() * 2.2
      dustPos[i * 3 + 2] = Math.sin(a) * r
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.06, map: glowTex, transparent: true, opacity: isDark ? 0.2 : 0.55,
        depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(accent.a),
      })
    )
    orbit.add(dust)

    /* outer halo (OUTER + 0.66) is the widest element — centre on the chart group
       (which sits at y = -0.3) so the donut is vertically centred in the card */
    fitToBounds(4, 2, 4, new THREE.Vector3(0.5, -0.3, 0))

    /* hover */
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const container = containerRef.current
    let offMove: () => void = () => {}
    if (container) {
      const onMove = (e: PointerEvent) => {
        const ctx = getCtx()
        if (!ctx || hitMeshes.length === 0) return
        const rect = container.getBoundingClientRect()
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
      const onLeave = () => { hoverRef.current = null; setHoverIdx(null); pauseRef.current = false }
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

      for (const rt of runtimes) {
        /* one owner for scale: reveal * hover, so the two never fight */
        rt.reveal = Math.min(1, rt.reveal + dt / 1.05)
        const p = rt.reveal <= 0 ? 0 : 1 - Math.pow(1 - rt.reveal, 3)
        const hot = hasData && cur !== null && rt.mesh.userData.idx === cur
        rt.hover += ((hot ? 1 : 0) - rt.hover) * Math.min(1, dt * 8)

        rt.mesh.scale.setScalar(Math.max(0.001, p * (1 + 0.04 * rt.hover)))
        const lift = rt.hover * 0.14 * p
        rt.mesh.position.set(rt.dir.x * lift, lift * 0.35, rt.dir.z * lift)
        if (hasData) rt.mat.emissiveIntensity = idleGlow + (hotGlow - idleGlow) * rt.hover
      }

      /* living chart: slow spin (paused while inspecting), gentle bob */
      if (!paused) {
        chartGroup.rotation.y += dt * (isDark ? 0.1 : 0.08) * (cur === null ? 1 : 0.15)
        chartGroup.position.y = BASE_Y + Math.sin(elapsed * 0.85) * 0.045
        chartGroup.rotation.z = Math.sin(elapsed * 0.42) * 0.025
        labelGroup.quaternion.copy(chartGroup.quaternion).invert()
        haloA.rotation.z += dt * 0.14
        haloB.rotation.z -= dt * 0.09
        ;(haloA.material as THREE.MeshBasicMaterial).opacity = (isDark ? 0.2 : 0.26) + Math.sin(elapsed * 1.2) * 0.06

        const dp = dustGeo.getAttribute('position') as THREE.BufferAttribute
        for (let i = 0; i < dustCount; i++) {
          let y = dp.getY(i) + dt * 0.09
          if (y > 2.5) y = 0.05
          dp.setY(i, y)
        }
        dp.needsUpdate = true
      }
    })

    return () => {
      offMove()
      cancelTick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slices, isDark, centerValue, centerLabel, emptyLabel])

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
              backgroundColor: isDark ? 'rgba(10,14,30,0.74)' : 'rgba(255,255,255,0.84)',
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
          glisser pour orbiter · survoler un segment
        </span>
      </div>
    </div>
  )
}