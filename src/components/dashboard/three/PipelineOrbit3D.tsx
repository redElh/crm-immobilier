import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThreeStage, makeGlowTexture, disposeObject3D } from './useThreeStage'
import type { StageHue } from '../Stage'

export interface PipelineOrbit3DProps {
  stages: { label: string; count: number; hue: StageHue }[]
  isDark: boolean
  height?: number
  className?: string
}

/**
 * PipelineOrbit3D — premium living constellation.
 *
 * A breathing TorusKnot energy core, nested counter-rotating rings,
 * per-stage elliptical orbital shells with guiding tracks, polished
 * satellites with motion trails and pulsing conduits, a layered
 * particle nebula, animated multi-colour lighting, hover highlighting
 * and click-to-focus camera orbiting.
 */
export function PipelineOrbit3D({ stages, isDark, height = 400, className }: PipelineOrbit3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef<boolean>(false)
  const { orbitRef, addTick, getCtx } = useThreeStage(containerRef, {
    camPos: [0, 5.5, 12],
    lookAt: [0, 0, 0],
    fov: 45,
    autoRotateSpeed: 0.06,
    swayAmplitude: 0.03,
    pausedRef,
    /* Free 360° drag-to-orbit — no clamping so the system spins fully around its centre. */
  })
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [focusIdx, setFocusIdx] = useState<number | null>(null)
  const hoverRef = useRef<number | null>(null)
  const focusRef = useRef<number | null>(null)
  const scaleCurRef = useRef<number[]>([])
  const frozenRotRef = useRef<number | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => { hoverRef.current = hoverIdx }, [hoverIdx])
  useEffect(() => { focusRef.current = focusIdx }, [focusIdx])

  useEffect(() => {
    const orbit = orbitRef.current
    if (!orbit) return
    while (orbit.children.length) {
      const child = orbit.children[0]
      orbit.remove(child)
      disposeObject3D(child)
    }

    const glowTex = makeGlowTexture()
    const dark = isDark
    const maxCount = Math.max(...stages.map(s => s.count), 1)
    const ringStart = 1.9
    const ringGap = stages.length > 4 ? 0.62 : 0.78
    const trailLength = 26

    /* --------------------------------------------------------------
       Lighting — warm key, cool fill, ambient and animated accent rim.
       -------------------------------------------------------------- */
    const keyLight = new THREE.DirectionalLight(0xffffff, dark ? 1.5 : 1.2)
    keyLight.position.set(6, 9, 5)
    orbit.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0x7dd3fc, dark ? 0.55 : 0.4)
    fillLight.position.set(-6, -2, -5)
    orbit.add(fillLight)
    orbit.add(new THREE.AmbientLight(0xffffff, dark ? 0.45 : 0.55))
    const accentLight = new THREE.PointLight(0x22d3ee, dark ? 70 : 25, 42, 2)
    accentLight.position.set(0, 3, 0)
    orbit.add(accentLight)

    /* --------------------------------------------------------------
       Floor, glow wash and grid.
       -------------------------------------------------------------- */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 34),
      new THREE.MeshBasicMaterial({
        map: glowTex, transparent: true, opacity: dark ? 0.11 : 0.17,
        depthWrite: false, blending: THREE.AdditiveBlending,
        color: new THREE.Color(dark ? '#0b1120' : '#f1f5f9'),
      })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.5
    orbit.add(floor)

    const grid = new THREE.GridHelper(18, 36, 0x334155, 0x1e293b)
    ;(grid.material as THREE.Material & { opacity: number }).transparent = true
    ;(grid.material as THREE.Material & { opacity: number }).opacity = dark ? 0.05 : 0.09
    grid.position.y = -0.49
    orbit.add(grid)

    /* --------------------------------------------------------------
       Core — breathing TorusKnot energy heart with nested rings.
       -------------------------------------------------------------- */
    const coreGroup = new THREE.Group()
    coreGroup.position.y = 0.4
    orbit.add(coreGroup)

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55, 2),
      new THREE.MeshStandardMaterial({
        color: dark ? '#0b1120' : '#ffffff',
        emissive: new THREE.Color(dark ? '#22d3ee' : '#f59e0b'),
        emissiveIntensity: dark ? 2.4 : 1.2,
        metalness: 0.94,
        roughness: 0.10,
      })
    )
    coreGroup.add(core)

    const coreShell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.72, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffffff, wireframe: true, transparent: true,
        opacity: dark ? 0.26 : 0.18, depthWrite: false, blending: THREE.AdditiveBlending,
      })
    )
    coreGroup.add(coreShell)

    const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: new THREE.Color(dark ? '#22d3ee' : '#f59e0b'),
      transparent: true, opacity: 0.92, depthWrite: false, blending: THREE.AdditiveBlending,
    }))
    coreGlow.scale.setScalar(4.4)
    coreGroup.add(coreGlow)

    const coreRings = new THREE.Group()
    coreGroup.add(coreRings)
    for (let k = 0; k < 3; k++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.95 + k * 0.44, 0.014, 4, 96),
        new THREE.MeshBasicMaterial({
          color: 0xffffff, transparent: true,
          opacity: dark ? 0.34 : 0.26, depthWrite: false, blending: THREE.AdditiveBlending,
        })
      )
      ring.rotation.x = Math.PI / 2 + k * 0.34
      ring.rotation.z = k * 0.72
      coreRings.add(ring)
    }

    /* --------------------------------------------------------------
       Orbital shells — one per pipeline stage.
       -------------------------------------------------------------- */
    interface Orbiter {
      pivot: THREE.Group
      sphere: THREE.Mesh
      hit: THREE.Mesh
      ringMesh: THREE.Mesh
      track: THREE.Points
      halo: THREE.Sprite
      beam: THREE.Line
      trail: THREE.Line
      trailPos: Float32Array
      speed: number
      orbitRadius: number
      sphereRadius: number
      hue: StageHue
      count: number
      phase: number
      angle: number
    }
    const orbiters: Orbiter[] = []
    const hitMeshes: THREE.Mesh[] = []
    scaleCurRef.current = stages.map(() => 1)

    stages.forEach((s, i) => {
      const r = ringStart + i * ringGap
      const pivot = new THREE.Group()
      pivot.rotation.x = THREE.MathUtils.degToRad(i % 2 === 0 ? 20 : -16)
      pivot.rotation.z = THREE.MathUtils.degToRad(i % 3 === 1 ? 6 : -5)
      orbit.add(pivot)

      /* main orbital ring */
      const ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.009, 5, 128),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(s.hue.a), transparent: true,
          opacity: dark ? 0.24 : 0.32, depthWrite: false, blending: THREE.AdditiveBlending,
        })
      )
      ringMesh.rotation.x = Math.PI / 2
      pivot.add(ringMesh)

      /* faint outer guiding track */
      const trackMesh = new THREE.Mesh(
        new THREE.TorusGeometry(r + 0.08, 0.005, 4, 96),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(s.hue.a), transparent: true,
          opacity: dark ? 0.1 : 0.14, depthWrite: false, blending: THREE.AdditiveBlending,
        })
      )
      trackMesh.rotation.x = Math.PI / 2
      pivot.add(trackMesh)

      /* dotted track */
      const dots: THREE.Vector3[] = []
      const dotCount = 40
      for (let d = 0; d < dotCount; d++) {
        const a = (d / dotCount) * Math.PI * 2
        dots.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))
      }
      const track = new THREE.Points(
        new THREE.BufferGeometry().setFromPoints(dots),
        new THREE.PointsMaterial({
          size: 0.045, color: new THREE.Color(s.hue.a), transparent: true,
          opacity: dark ? 0.38 : 0.46, depthWrite: false, blending: THREE.AdditiveBlending,
        })
      )
      pivot.add(track)

      /* beam conduit from core to satellite */
      const beamGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(r, 0, 0),
      ])
      const beam = new THREE.Line(
        beamGeo,
        new THREE.LineBasicMaterial({
          color: new THREE.Color(s.hue.a), transparent: true,
          opacity: dark ? 0.2 : 0.26, depthWrite: false, blending: THREE.AdditiveBlending,
        })
      )
      pivot.add(beam)

      /* motion trail */
      const trailPos = new Float32Array(trailLength * 3)
      const trailGeo = new THREE.BufferGeometry()
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
      const trail = new THREE.Line(
        trailGeo,
        new THREE.LineBasicMaterial({
          color: new THREE.Color(s.hue.a), transparent: true,
          opacity: dark ? 0.44 : 0.52, depthWrite: false, blending: THREE.AdditiveBlending,
        })
      )
      pivot.add(trail)

      /* satellite sphere */
      const radius = 0.13 + 0.15 * Math.sqrt(s.count / maxCount) + 0.035
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 36, 36),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(s.hue.b).lerp(new THREE.Color(s.hue.a), 0.5),
          emissive: new THREE.Color(s.hue.a),
          emissiveIntensity: dark ? 1.4 : 0.8,
          metalness: 0.78,
          roughness: 0.12,
        })
      )
      sphere.userData = { idx: i, hue: s.hue }
      pivot.add(sphere)

       /* generous invisible hit zone so hovering a planet is easy and
          forgiving — you don't have to guess the exact pixel. */
       const hitSphere = new THREE.Mesh(
         new THREE.SphereGeometry(0.9, 16, 16),
         new THREE.MeshBasicMaterial({
           color: 0xffffff, transparent: true, opacity: 0, depthWrite: false,
         })
       )
       hitSphere.userData = { idx: i }
       pivot.add(hitSphere)
       hitMeshes.push(hitSphere)

      /* satellite ring */
      const satRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.8, 0.018, 3, 32),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(s.hue.a), transparent: true,
          opacity: dark ? 0.48 : 0.38, depthWrite: false, blending: THREE.AdditiveBlending,
        })
      )
      satRing.rotation.x = Math.PI / 2
      sphere.add(satRing)

      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: new THREE.Color(s.hue.a), transparent: true,
        opacity: dark ? 0.88 : 0.62, depthWrite: false, blending: THREE.AdditiveBlending,
      }))
      halo.scale.setScalar(radius * 4.8)
      sphere.add(halo)

       const phase = (i / Math.max(stages.length, 1)) * Math.PI * 2
       orbiters.push({ pivot, sphere, hit: hitSphere, ringMesh, track, halo, beam, trail, trailPos, speed: 0.2 / (1 + i * 0.14), orbitRadius: r, sphereRadius: radius, hue: s.hue, count: s.count, phase, angle: phase })
    })

    /* --------------------------------------------------------------
       Particle nebula — three drifting, twinkling depth layers.
       -------------------------------------------------------------- */
    const buildLayer = (count: number, radius: number, speed: number, opacity: number, size: number) => {
      const pos = new Float32Array(count * 3)
      const sizes = new Float32Array(count)
      const phases = new Float32Array(count)
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2
        const th = (Math.random() - 0.5) * Math.PI
        const rr = radius * (0.45 + Math.random() * 0.55)
        pos[i * 3] = Math.cos(a) * Math.cos(th) * rr
        pos[i * 3 + 1] = Math.sin(th) * rr
        pos[i * 3 + 2] = Math.sin(a) * Math.cos(th) * rr
        sizes[i] = size * (0.55 + Math.random() * 0.9)
        phases[i] = Math.random() * Math.PI * 2
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
      geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
      const mat = new THREE.PointsMaterial({
        size, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffffff,
      })
      return { pts: new THREE.Points(geo, mat), speed, count, baseOpacity: opacity }
    }
    const layers = [
      buildLayer(130, 3.6, 0.09, dark ? 0.18 : 0.14, 0.075),
      buildLayer(100, 6.0, 0.045, dark ? 0.11 : 0.09, 0.055),
      buildLayer(70, 9.0, 0.022, dark ? 0.07 : 0.06, 0.045),
    ]
    layers.forEach(l => orbit.add(l.pts))

    /* --------------------------------------------------------------
       Camera framing — fixed, centred on the orbit origin so the whole
       constellation stays centred in the card (2D mx centering of the
       visual, handled by the container flex + mx-auto below).
       -------------------------------------------------------------- */
    const ctx = getCtx()
    if (ctx) {
      ctx.camera.position.set(0, 5.5, 12)
      ctx.camera.lookAt(0, 0, 0)
      ctx.camera.updateProjectionMatrix()
    }

    /* --------------------------------------------------------------
       Interaction — hover highlight + click to focus / release.
       -------------------------------------------------------------- */
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const container = containerRef.current
    let offMove: () => void = () => {}
    let offClick: () => void = () => {}
    if (container) {
      const onMove = (e: PointerEvent) => {
        const c = getCtx()
        if (!c) return
        const rect = container.getBoundingClientRect()
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(ndc, c.camera)
        orbit.updateMatrixWorld()
        const hits = raycaster.intersectObjects(hitMeshes, false)
         const idx = hits.length > 0 ? (hits[0].object.userData.idx as number) : null
         if (idx !== hoverRef.current) {
           hoverRef.current = idx
           pausedRef.current = idx !== null
           setHoverIdx(idx)
           setHoverPos({ x: e.clientX, y: e.clientY })
           if (focusRef.current === null) setFocusIdx(null)
         } else if (idx !== null) {
           setHoverPos({ x: e.clientX, y: e.clientY })
         }
      }
       const onLeave = () => { hoverRef.current = null; pausedRef.current = false; setHoverIdx(null); setHoverPos(null); if (focusRef.current === null) setFocusIdx(null) }
      const onClick = (e: PointerEvent) => {
        const c = getCtx()
        if (!c) return
        const rect = container.getBoundingClientRect()
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(ndc, c.camera)
        orbit.updateMatrixWorld()
        const hits = raycaster.intersectObjects(hitMeshes, false)
        if (hits.length > 0) {
          const idx = hits[0].object.userData.idx as number
          setFocusIdx(idx === focusIdx ? null : idx)
          setHoverIdx(null)
        } else {
          setFocusIdx(null)
          setHoverIdx(null)
        }
      }
      container.addEventListener('pointermove', onMove)
      container.addEventListener('pointerleave', onLeave)
      container.addEventListener('pointerdown', onClick)
      offMove = () => {
        container.removeEventListener('pointermove', onMove)
        container.removeEventListener('pointerleave', onLeave)
      }
      offClick = () => container.removeEventListener('pointerdown', onClick)
    }

    /* --------------------------------------------------------------
       Animation tick.
       -------------------------------------------------------------- */
    const tmpVec = new THREE.Vector3()
     const cancelTick = addTick((elapsed, dt) => {
       const hovering = hoverRef.current !== null
       pausedRef.current = hovering
       /* --- core --- */
       if (!hovering) {
         core.rotation.y += dt * 0.5
         core.rotation.x = Math.sin(elapsed * 1.0) * 0.2
         core.rotation.z = Math.cos(elapsed * 0.7) * 0.14
       }
      const corePulse = 1 + Math.sin(elapsed * 2.4) * 0.045
      core.scale.setScalar(corePulse)
      coreShell.rotation.y -= dt * 0.3
      coreShell.rotation.z += dt * 0.16
      coreGlow.scale.setScalar(4.4 + Math.sin(elapsed * 2.4) * 0.3)
      const coreMat = core.material as THREE.MeshStandardMaterial
      coreMat.emissiveIntensity += ((dark ? 2.9 : 1.5) - coreMat.emissiveIntensity) * Math.min(1, dt * 6)
       if (!hovering) {
         coreRings.rotation.y += dt * (0.14 + 0.07 * Math.sin(elapsed))
         coreRings.rotation.x = Math.sin(elapsed * 0.8) * 0.16
       }
      accentLight.position.set(
        Math.cos(elapsed * 0.8) * 3.2,
        2.8 + Math.sin(elapsed * 0.55) * 0.9,
        Math.sin(elapsed * 1.0) * 3.2
      )
      accentLight.intensity += ((dark ? 95 : 40) - accentLight.intensity) * Math.min(1, dt * 4)

       /* --- particle nebula --- */
       layers.forEach(l => {
         if (!hovering) l.pts.rotation.y += l.speed * dt
         l.pts.rotation.x = hovering ? l.pts.rotation.x : Math.sin(elapsed * 0.35 + l.speed * 12) * 0.07
        const mat = l.pts.material as THREE.PointsMaterial
        mat.opacity = l.baseOpacity + Math.sin(elapsed * (1.2 + l.speed * 8)) * 0.035
      })

      /* --- orbiters --- */
       for (let i = 0; i < orbiters.length; i++) {
         const o = orbiters[i]
         if (!hovering) o.angle += o.speed * dt
         const angle = o.angle
         const x = Math.cos(angle) * o.orbitRadius
         const z = Math.sin(angle) * o.orbitRadius
         o.sphere.position.set(x, 0, z)
         o.hit.position.set(x, 0, z)

        /* beam conduit aims at satellite */
        const beamPos = o.beam.geometry.getAttribute('position') as THREE.BufferAttribute
        beamPos.setXYZ(1, x, 0, z)
        beamPos.needsUpdate = true
        const beamMat = o.beam.material as THREE.LineBasicMaterial

        /* motion trail behind satellite */
        const trailN = o.trailPos.length / 3
        for (let t = 0; t < trailN; t++) {
          const a = angle - (t / Math.max(trailN - 1, 1)) * 0.5
          o.trailPos[t * 3] = Math.cos(a) * o.orbitRadius
          o.trailPos[t * 3 + 1] = 0
          o.trailPos[t * 3 + 2] = Math.sin(a) * o.orbitRadius
        }
        ;(o.trail.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true

        /* hover / focus scale + glow */
        const hot = hoverRef.current === i
        const focused = focusRef.current === i
        const goal = focused ? 1.7 : hot ? 1.3 : 1
        scaleCurRef.current[i] += (goal - scaleCurRef.current[i]) * Math.min(1, dt * 11)
        o.sphere.scale.setScalar(scaleCurRef.current[i])
        o.halo.scale.setScalar(o.sphereRadius * (focused ? 6 : hot ? 5.4 : 4.8) * scaleCurRef.current[i])

        const satMat = o.sphere.material as THREE.MeshStandardMaterial
        satMat.emissiveIntensity += ((focused ? 2.2 : hot ? 1.5 : (dark ? 1.4 : 0.8)) - satMat.emissiveIntensity) * Math.min(1, dt * 8)

        beamMat.opacity += ((focused ? 0.85 : hot ? 0.55 : (dark ? 0.2 : 0.26)) - beamMat.opacity) * Math.min(1, dt * 9)
      }

      /* --- focus camera: orbit around the selected satellite --- */
      const c = getCtx()
      if (focusRef.current !== null && c) {
        const f = orbiters[focusRef.current]
        const worldPos = f.sphere.getWorldPosition(tmpVec)
        const away = worldPos.clone().normalize()
        const perp = new THREE.Vector3(-away.z, 0, away.x).normalize()
        const camOffset = away.clone().multiplyScalar(3.5)
          .add(perp.clone().multiplyScalar(Math.sin(elapsed * 0.55 + focusRef.current) * 1.5))
          .add(new THREE.Vector3(0, Math.cos(elapsed * 0.4) * 1.2, 0))
        c.camera.position.copy(worldPos.clone().add(camOffset))
        c.camera.lookAt(worldPos)
        c.camera.updateProjectionMatrix()
      }

      /* --- pause the whole system while hovering a planet ---
         constellation spin and satellite orbits both freeze. */
      if (hoverRef.current !== null) {
        if (frozenRotRef.current === null) {
          frozenRotRef.current = orbit.rotation.y
        }
        orbit.rotation.y = frozenRotRef.current
        orbit.rotation.x = 0
        orbit.rotation.z = 0
      } else {
        frozenRotRef.current = null
      }
    })

    return () => {
      offMove()
      offClick()
      cancelTick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages, isDark])

  const active = hoverIdx !== null && focusIdx === null ? stages[hoverIdx] : null
  const focused = focusIdx !== null ? stages[focusIdx] : null
  return (
    <div
      ref={containerRef}
      className={`stage-3d-shell overflow-hidden rounded-2xl flex items-center justify-center mx-auto ${className || ''}`}
      style={{
        height,
        position: 'relative',
        cursor: hoverIdx !== null || focusIdx !== null ? 'pointer' : 'grab',
        touchAction: 'pan-y',
      }}
    >
      {/* premium vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.55) 100%)'
            : 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.18) 100%)',
        }}
        aria-hidden="true"
      />
      {hoverIdx !== null && focusIdx === null && hoverPos && stages[hoverIdx] && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: hoverPos.x + 14,
            top: hoverPos.y - 10,
            ...(isDark
              ? {
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.16)',
                  backgroundColor: 'rgba(10,14,30,0.82)',
                }
              : {
                  color: '#1c1917',
                  borderColor: 'rgba(15,23,42,0.12)',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                }),
          }}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md shadow-xl"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.18)',
              boxShadow: `0 0 14px ${stages[hoverIdx].hue.glow}`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: stages[hoverIdx].hue.line, boxShadow: `0 0 8px ${stages[hoverIdx].hue.glow}` }} />
            {stages[hoverIdx].label} · {stages[hoverIdx].count} mandats
          </span>
        </div>
      )}
      {active && (
        <div className="pointer-events-none absolute left-3 top-2 z-10">
          <span
            className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md"
            style={{
              color: isDark ? '#fff' : '#1c1917',
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.10)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.78)' : 'rgba(255,255,255,0.86)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: active.hue.line, boxShadow: `0 0 7px ${active.hue.glow}` }} />
            {active.label} · {active.count}
          </span>
        </div>
      )}
      {focused && (
        <div className="pointer-events-none absolute left-3 top-2 z-10">
          <span
            className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md"
            style={{
              color: isDark ? '#fff' : '#1c1917',
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.10)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.78)' : 'rgba(255,255,255,0.86)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: focused.hue.line, boxShadow: `0 0 8px ${focused.hue.glow}` }} />
            Calé sur <b>{focused.label}</b> · {focused.count}
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 right-3 z-10">
        <span
          className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.2px] backdrop-blur-md"
          style={{
            color: isDark ? 'rgba(226,232,240,0.65)' : 'rgba(28,25,23,0.55)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
            backgroundColor: isDark ? 'rgba(10,14,30,0.55)' : 'rgba(255,255,255,0.72)',
          }}
        >
          {focusIdx !== null ? 'cliquer pour relâcher le focus' : 'glisser pour explorer · cliquer un satellite'}
        </span>
      </div>
    </div>
  )
}
