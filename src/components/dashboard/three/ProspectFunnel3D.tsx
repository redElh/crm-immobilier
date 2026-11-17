import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThreeStage, makeGlowTexture, disposeObject3D } from './useThreeStage'
import type { StageHue } from '../Stage'

export interface ProspectFunnel3DProps {
  stages: { label: string; count: number; hue: StageHue }[]
  isDark: boolean
  height?: number
  className?: string
  accent?: StageHue
}

/**
 * ProspectFunnel3D — a living conversion funnel.
 *
 * Each pipeline stage is a glass tier whose radius and thickness encode
 * the prospect count, wrapped in an additive vertex-coloured funnel skin.
 * Prospects flow down the funnel as luminous particles, a scan ring sweeps
 * the surface, and hovering a tier freezes the scene and reveals details.
 */
export function ProspectFunnel3D({ stages, isDark, height, className, accent }: ProspectFunnel3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const { orbitRef, addTick, getCtx, fitToBounds } = useThreeStage(containerRef, {
    camPos: [0, 3.1, 10.5],
    lookAt: [0, 0.05, 0],
    fov: 40,
    autoRotateSpeed: 0.11,
    swayAmplitude: 0.04,
    swaySpeed: 0.26,
    pausedRef,
  })
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const hoverRef = useRef<number | null>(null)

  const signature = stages.map(s => `${s.label}:${s.count}:${s.hue.a}`).join('|')

  useEffect(() => {
    const orbit = orbitRef.current
    if (!orbit || stages.length === 0) return

    while (orbit.children.length) {
      const child = orbit.children[0]
      orbit.remove(child)
      disposeObject3D(child)
    }

    hoverRef.current = null
    pausedRef.current = false
    setHoverIdx(null)
    setHoverPos(null)

    const dark = isDark
    const n = stages.length
    const maxCount = Math.max(...stages.map(s => s.count), 1)
    const glowTex = makeGlowTexture()

    const topR = 2.05
    const bottomR = 0.55
    const span = 3.0
    const step = n > 1 ? span / (n - 1) : 0
    const topY = n > 1 ? span / 2 : 0
    const ys = stages.map((_, i) => topY - i * step)
    const bottomY = ys[n - 1]
    const thickness = stages.map(s => 0.09 + 0.3 * (s.count / maxCount))
    const ringYs = stages.map((_, i) => ys[i] + thickness[i] / 2)
    const radii = stages.map((s, i) => {
      const t = n > 1 ? i / (n - 1) : 0
      const taper = topR + (bottomR - topR) * t
      const load = 0.6 + 0.4 * Math.sqrt(Math.max(0, s.count) / maxCount)
      return taper * load
    })
    const tipY = bottomY - 0.4
    const plinthY = tipY - 0.12
    const accentHue = accent ?? stages[0].hue

    /* ---------------- colour mapping by height ---------------- */
    const cA = new THREE.Color()
    const cB = new THREE.Color()
    const spanY = Math.max(topY - bottomY, 0.001)
    const colorAt = (target: THREE.Color, y: number) => {
      if (n === 1) return target.set(stages[0].hue.a)
      const t = THREE.MathUtils.clamp((topY - y) / spanY, 0, 1) * (n - 1)
      const i0 = Math.min(Math.floor(t), n - 2)
      const f = t - i0
      cA.set(stages[i0].hue.a)
      cB.set(stages[i0 + 1].hue.a)
      return target.copy(cA).lerp(cB, f)
    }
    const ringTopY = ringYs[0]
    const ringBottomY = ringYs[n - 1]
    const radiusAt = (y: number) => {
      if (n === 1) return radii[0]
      const t = THREE.MathUtils.clamp((ringTopY - y) / Math.max(ringTopY - ringBottomY, 0.001), 0, 1) * (n - 1)
      const i0 = Math.min(Math.floor(t), n - 2)
      const f = t - i0
      return THREE.MathUtils.lerp(radii[i0], radii[i0 + 1], f)
    }

    /* ---------------- lighting ---------------- */
    const keyLight = new THREE.DirectionalLight(0xffffff, dark ? 1.6 : 1.25)
    keyLight.position.set(6, 9, 5)
    orbit.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0x7dd3fc, dark ? 0.6 : 0.42)
    fillLight.position.set(-6, 1, -5)
    orbit.add(fillLight)
    orbit.add(new THREE.AmbientLight(0xffffff, dark ? 0.5 : 0.6))
    const accentLight = new THREE.PointLight(new THREE.Color(accentHue.a), dark ? 55 : 22, 36, 2)
    accentLight.position.set(0, 2.6, 0)
    orbit.add(accentLight)

    /* ---------------- floor / plinth ---------------- */
    const floorY = plinthY - 0.12
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        opacity: dark ? 0.72 : 0.55,
        depthWrite: false,
        blending: THREE.NormalBlending,
        color: new THREE.Color(dark ? '#24304a' : '#f1f5f9'),
      })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = floorY
    orbit.add(floor)

    const floorGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 11),
      new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        opacity: dark ? 0.34 : 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color(accentHue.a),
      })
    )
    floorGlow.rotation.x = -Math.PI / 2
    floorGlow.position.y = floorY + 0.002
    orbit.add(floorGlow)

    const grid = new THREE.GridHelper(16, 32, dark ? 0x64748b : 0x475569, dark ? 0x334155 : 0x94a3b8)
    const gridMat = grid.material as THREE.Material & { opacity: number }
    gridMat.transparent = true
    gridMat.opacity = dark ? 0.24 : 0.14
    grid.position.y = floorY + 0.01
    orbit.add(grid)

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.62, 0.16, 64),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(dark ? '#0b1020' : '#e2e8f0'),
        emissive: new THREE.Color(accentHue.a),
        emissiveIntensity: dark ? 0.22 : 0.08,
        metalness: 0.85,
        roughness: 0.22,
      })
    )
    plinth.position.y = plinthY
    orbit.add(plinth)

    const plinthRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.022, 8, 96),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentHue.a),
        transparent: true,
        opacity: dark ? 0.7 : 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    plinthRim.rotation.x = Math.PI / 2
    plinthRim.position.y = plinthY + 0.09
    orbit.add(plinthRim)

    const outlet = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 24, 24),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentHue.b),
        emissive: new THREE.Color(accentHue.a),
        emissiveIntensity: dark ? 2.4 : 1.2,
        metalness: 0.8,
        roughness: 0.15,
      })
    )
    outlet.position.y = tipY
    orbit.add(outlet)
    const outletGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: new THREE.Color(accentHue.a),
        transparent: true,
        opacity: dark ? 0.8 : 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    outletGlow.scale.setScalar(1.5)
    outletGlow.position.y = tipY
    orbit.add(outletGlow)

    /* ---------------- funnel skin ---------------- */
    const anchors: { r: number; y: number }[] = stages.map((_, i) => ({ r: radii[i], y: ringYs[i] }))
    anchors.push({ r: 0.22, y: tipY })

    const profile: THREE.Vector2[] = []
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i]
      const b = anchors[i + 1]
      const seg = 8
      for (let k = 0; k < seg; k++) {
        const t = k / seg
        const e = t * t * (3 - 2 * t)
        profile.push(new THREE.Vector2(a.r + (b.r - a.r) * e, a.y + (b.y - a.y) * e))
      }
    }
    profile.push(new THREE.Vector2(anchors[anchors.length - 1].r, anchors[anchors.length - 1].y))

    const skinGeo = new THREE.LatheGeometry(profile, 96)
    const skinPos = skinGeo.getAttribute('position') as THREE.BufferAttribute
    const skinColors = new Float32Array(skinPos.count * 3)
    const color = new THREE.Color()
    for (let i = 0; i < skinPos.count; i++) {
      colorAt(color, skinPos.getY(i))
      skinColors[i * 3] = color.r
      skinColors[i * 3 + 1] = color.g
      skinColors[i * 3 + 2] = color.b
    }
    skinGeo.setAttribute('color', new THREE.BufferAttribute(skinColors, 3))
    skinGeo.computeVertexNormals()
    const skin = new THREE.Mesh(
      skinGeo,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: dark ? 0.17 : 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
        toneMapped: false,
      })
    )
    orbit.add(skin)

    const meridianMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(accentHue.a),
      transparent: true,
      opacity: dark ? 0.18 : 0.13,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    for (let m = 0; m < 10; m++) {
      const angle = (m / 10) * Math.PI * 2
      const points = anchors.map(p => new THREE.Vector3(Math.cos(angle) * p.r, p.y, Math.sin(angle) * p.r))
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      orbit.add(new THREE.Line(geo, meridianMat))
    }

    /* ---------------- per-stage glass tiers ---------------- */
    interface Tier {
      idx: number
      disc: THREE.Mesh
      ring: THREE.Mesh
      inner: THREE.Mesh
      halo: THREE.Mesh
      discBaseY: number
      ringBaseY: number
      haloBaseY: number
      ringBaseGlow: number
      discBaseGlow: number
      haloBaseOpacity: number
      scale: number
    }
    const tiers: Tier[] = []
    const hitMeshes: THREE.Mesh[] = []

    stages.forEach((s, i) => {
      const radius = radii[i]
      const thick = thickness[i]
      const ringY = ringYs[i]
      const discGlow = dark ? 0.8 : 0.4
      const ringGlow = dark ? 2.4 : 1.3

      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 0.985, thick, 72),
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(s.hue.b).lerp(new THREE.Color(s.hue.a), 0.42),
          emissive: new THREE.Color(s.hue.a),
          emissiveIntensity: discGlow,
          metalness: 0.66,
          roughness: 0.16,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
          transparent: true,
          opacity: dark ? 0.52 : 0.64,
        })
      )
      disc.position.y = ys[i]
      orbit.add(disc)

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.03 + 0.03 * (s.count / maxCount), 10, 96),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(s.hue.b),
          emissive: new THREE.Color(s.hue.a),
          emissiveIntensity: ringGlow,
          metalness: 0.9,
          roughness: 0.12,
        })
      )
      ring.rotation.x = Math.PI / 2
      ring.position.y = ringY
      orbit.add(ring)

      const inner = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.84, 0.007, 4, 96),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(dark ? '#ffffff' : s.hue.a),
          transparent: true,
          opacity: dark ? 0.24 : 0.3,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      )
      inner.rotation.x = Math.PI / 2
      inner.position.y = ringY + 0.01
      orbit.add(inner)

      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(radius * 2.5, radius * 2.5),
        new THREE.MeshBasicMaterial({
          map: glowTex,
          color: new THREE.Color(s.hue.a),
          transparent: true,
          opacity: dark ? 0.2 : 0.26,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      )
      halo.rotation.x = -Math.PI / 2
      halo.position.y = ringY + 0.004
      orbit.add(halo)

      const hit = new THREE.Mesh(
        new THREE.CylinderGeometry(radius + 0.22, radius + 0.22, Math.max(thick, 0.5) + 0.12, 20),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
      )
      hit.position.y = ys[i]
      hit.userData = { idx: i }
      orbit.add(hit)
      hitMeshes.push(hit)

      tiers.push({
        idx: i,
        disc,
        ring,
        inner,
        halo,
        discBaseY: ys[i],
        ringBaseY: ringY,
        haloBaseY: ringY,
        ringBaseGlow: ringGlow,
        discBaseGlow: discGlow,
        haloBaseOpacity: dark ? 0.2 : 0.26,
        scale: 1,
      })
    })

    /* ---------------- portal hoop ---------------- */
    const portal = new THREE.Mesh(
      new THREE.TorusGeometry(Math.max(0.55, radii[0] * 0.78), 0.04, 12, 96),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentHue.b),
        emissive: new THREE.Color(accentHue.a),
        emissiveIntensity: dark ? 2 : 1.1,
        metalness: 0.88,
        roughness: 0.14,
      })
    )
    portal.rotation.x = Math.PI / 2
    portal.position.y = topY + 0.72
    orbit.add(portal)

    const portalRingA = new THREE.Mesh(
      new THREE.TorusGeometry(Math.max(0.5, radii[0] * 0.66), 0.012, 6, 96),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentHue.a),
        transparent: true,
        opacity: dark ? 0.5 : 0.36,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    portalRingA.rotation.x = Math.PI / 2 + 0.3
    portalRingA.position.y = topY + 0.72
    orbit.add(portalRingA)

    const portalRingB = portalRingA.clone()
    portalRingB.rotation.x = Math.PI / 2 - 0.42
    portalRingB.rotation.y = 0.8
    orbit.add(portalRingB)

    /* ---------------- flowing particles ---------------- */
    const particleCount = 110
    const pPos = new Float32Array(particleCount * 3)
    const pCol = new Float32Array(particleCount * 3)
    const pState: { angle: number; y: number; speed: number; drift: number }[] = []
    const spawnY = ringYs[0]
    for (let i = 0; i < particleCount; i++) {
      pState.push({
        angle: Math.random() * Math.PI * 2,
        y: spawnY - Math.random() * Math.max(spawnY - tipY, 0.1),
        speed: 0.16 + Math.random() * 0.32,
        drift: 0.62 + Math.random() * 0.28,
      })
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3))
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        size: dark ? 0.08 : 0.065,
        map: glowTex,
        vertexColors: true,
        transparent: true,
        opacity: dark ? 0.85 : 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      })
    )
    orbit.add(particles)

    /* ---------------- scan ring ---------------- */
    const scan = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.014, 5, 96),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(dark ? '#ffffff' : accentHue.a),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    scan.rotation.x = Math.PI / 2
    orbit.add(scan)

    /* ---------------- camera framing ---------------- */
    fitToBounds(topR + 0.55, span / 2 + 0.98, 2.3, new THREE.Vector3(0, 0.05, 0))

    /* ---------------- interaction ---------------- */
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const container = containerRef.current
    let offMove = () => {}
    let offLeave = () => {}
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
          if (idx === null) setHoverPos(null)
        }
        if (idx !== null) setHoverPos({ x: e.clientX, y: e.clientY })
      }
      const onLeave = () => {
        hoverRef.current = null
        pausedRef.current = false
        setHoverIdx(null)
        setHoverPos(null)
      }
      container.addEventListener('pointermove', onMove)
      container.addEventListener('pointerleave', onLeave)
      offMove = () => container.removeEventListener('pointermove', onMove)
      offLeave = () => container.removeEventListener('pointerleave', onLeave)
    }

    /* ---------------- animation ---------------- */
    const cancelTick = addTick((elapsed, dt) => {
      const hovering = hoverRef.current !== null
      pausedRef.current = hovering

      accentLight.position.set(
        Math.cos(elapsed * 0.8) * 2.8,
        2.4 + Math.sin(elapsed * 0.6) * 0.8,
        Math.sin(elapsed * 1.1) * 2.8
      )
      accentLight.intensity += ((dark ? 62 : 26) - accentLight.intensity) * Math.min(1, dt * 4)

      ;(plinthRim.material as THREE.MeshBasicMaterial).opacity = (dark ? 0.6 : 0.44) + Math.sin(elapsed * 1.8) * 0.14
      outletGlow.scale.setScalar(1.4 + Math.sin(elapsed * 2.4) * 0.16)
      portalRingA.rotation.y += dt * 0.35
      portalRingB.rotation.y -= dt * 0.28

      for (const tier of tiers) {
        const hot = hoverRef.current === tier.idx
        const goal = hot ? 1.07 : 1
        tier.scale += (goal - tier.scale) * Math.min(1, dt * 10)
        tier.disc.scale.set(tier.scale, 1, tier.scale)
        tier.ring.scale.setScalar(tier.scale)
        tier.inner.scale.setScalar(tier.scale)
        tier.halo.scale.setScalar(tier.scale)

        const bob = hoverRef.current === null ? Math.sin(elapsed * 1.3 + tier.idx * 0.8) * 0.008 : 0
        const lift = hot ? 0.05 : 0
        tier.disc.position.y = tier.discBaseY + bob + lift * 0.6
        tier.ring.position.y = tier.ringBaseY + bob + lift
        tier.inner.position.y = tier.ringBaseY + 0.01 + bob + lift
        tier.halo.position.y = tier.haloBaseY + 0.004 + bob + lift

        const ringMat = tier.ring.material as THREE.MeshStandardMaterial
        const discMat = tier.disc.material as THREE.MeshPhysicalMaterial
        ringMat.emissiveIntensity += ((tier.ringBaseGlow + (hot ? 2 : 0)) - ringMat.emissiveIntensity) * Math.min(1, dt * 9)
        discMat.emissiveIntensity += ((tier.discBaseGlow + (hot ? 0.9 : 0)) - discMat.emissiveIntensity) * Math.min(1, dt * 9)
        const haloMat = tier.halo.material as THREE.MeshBasicMaterial
        haloMat.opacity += ((hot ? 0.55 : tier.haloBaseOpacity) - haloMat.opacity) * Math.min(1, dt * 9)
      }

      for (let i = 0; i < pState.length; i++) {
        const p = pState[i]
        p.y -= p.speed * dt
        if (p.y < tipY) {
          p.y = spawnY
          p.angle = Math.random() * Math.PI * 2
          p.speed = 0.16 + Math.random() * 0.32
        }
        const r = radiusAt(p.y) * p.drift
        pPos[i * 3] = Math.cos(p.angle) * r
        pPos[i * 3 + 1] = p.y
        pPos[i * 3 + 2] = Math.sin(p.angle) * r
        colorAt(color, p.y)
        pCol[i * 3] = color.r
        pCol[i * 3 + 1] = color.g
        pCol[i * 3 + 2] = color.b
      }
      ;(pGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
      ;(pGeo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true

      const progress = (elapsed * 0.22) % 1
      const scanY = ringTopY - progress * Math.max(ringTopY - tipY, 0.1)
      const scanR = radiusAt(scanY)
      scan.position.y = scanY
      scan.scale.set(scanR, scanR, 1)
      ;(scan.material as THREE.MeshBasicMaterial).opacity = (dark ? 0.55 : 0.4) * (1 - progress * 0.55)
    })

    return () => {
      offMove()
      offLeave()
      cancelTick()
      pausedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, isDark, accent])

  const hovered = hoverIdx !== null ? stages[hoverIdx] : null
  const share = hovered ? Math.round((hovered.count / Math.max(stages.reduce((s, x) => s + x.count, 0), 1)) * 100) : 0

  return (
    <div
      ref={containerRef}
      className={`stage-3d-shell overflow-hidden rounded-2xl mx-auto ${className || ''}`}
      style={{
        height,
        position: 'relative',
        cursor: hoverIdx !== null ? 'pointer' : 'grab',
        touchAction: 'pan-y',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.5) 100%)'
            : 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.14) 100%)',
        }}
        aria-hidden="true"
      />

      {hovered && hoverPos && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: hoverPos.x + 14,
            top: hoverPos.y - 10,
            ...(isDark
              ? { color: '#fff', borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(10,14,30,0.85)' }
              : { color: '#1c1917', borderColor: 'rgba(15,23,42,0.12)', backgroundColor: 'rgba(255,255,255,0.92)' }),
          }}
        >
          <span
            className="inline-flex flex-col gap-0.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold backdrop-blur-md shadow-xl"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.18)',
              boxShadow: `0 0 16px ${hovered.hue.glow}`,
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: hovered.hue.line, boxShadow: `0 0 8px ${hovered.hue.glow}` }}
              />
              {hovered.label} · {hovered.count} prospect{hovered.count > 1 ? 's' : ''}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[1px] opacity-60">{share}% du pipeline</span>
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-2 left-3 z-10 hidden sm:flex flex-wrap items-center gap-x-3 gap-y-1 max-w-[70%]">
        {stages.map((s, i) => (
          <span
            key={`${s.label}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-md transition-opacity"
            style={{
              color: isDark ? 'rgba(226,232,240,0.82)' : 'rgba(28,25,23,0.72)',
              opacity: hoverIdx === null || hoverIdx === i ? 1 : 0.42,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: s.hue.line, boxShadow: `0 0 6px ${s.hue.glow}` }}
            />
            {s.label}
            <b className="tabular-nums" style={{ color: isDark ? '#fff' : '#1c1917' }}>{s.count}</b>
          </span>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-2 right-3 z-10">
        <span
          className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.2px] backdrop-blur-md"
          style={{
            color: isDark ? 'rgba(226,232,240,0.65)' : 'rgba(28,25,23,0.55)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
            backgroundColor: isDark ? 'rgba(10,14,30,0.55)' : 'rgba(255,255,255,0.72)',
          }}
        >
          glisser pour explorer · survoler une étape
        </span>
      </div>
    </div>
  )
}
