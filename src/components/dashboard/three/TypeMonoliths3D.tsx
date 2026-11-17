import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThreeStage, makeGlowTexture, makeLabelSprite, disposeObject3D } from './useThreeStage'
import type { StageHue } from '../Stage'

export interface MonolithSlice {
  name: string
  value: number
  hue: StageHue
}

export interface TypeMonoliths3DProps {
  slices: MonolithSlice[]
  isDark: boolean
  height?: number
  className?: string
  hint?: string
  /** Page accent (admin rose / admin orange / agent violet|emerald). */
  accent?: StageHue
}

function easeOutQuart(u: number): number {
  if (u <= 0) return 0
  if (u >= 1) return 1
  const v = 1 - u
  return 1 - v * v * v * v
}

/**
 * TypeMonoliths3D - five floating crystal monoliths, one per segment of the
 * portfolio. Height encodes the share, a molten core shines through the
 * faceted shell, each obelisk hovers above its hex plinth and a halo portal
 * frames the scene. Drag to orbit, hover to inspect, click to pin.
 */
export function TypeMonoliths3D({
  slices,
  isDark,
  height = 220,
  className,
  hint = 'survolez un monolithe - glissez pour orbiter',
  accent,
}: TypeMonoliths3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pauseRef = useRef(false)
  const { orbitRef, addTick, getCtx, fitToBounds } = useThreeStage(containerRef, {
    camPos: [0, 3.6, 9.0],
    lookAt: [0, 0.95, 0],
    fov: 40,
    autoRotateSpeed: 0.045,
    swayAmplitude: 0.12,
    swaySpeed: 0.2,
    pausedRef: pauseRef,
  })
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const hoverRef = useRef<number | null>(null)
  const selectedRef = useRef<number | null>(null)

  useEffect(() => { hoverRef.current = hoverIdx }, [hoverIdx])
  useEffect(() => { selectedRef.current = selectedIdx }, [selectedIdx])

  useEffect(() => {
    const orbit = orbitRef.current
    if (!orbit || slices.length === 0) return
    while (orbit.children.length) {
      const child = orbit.children[0]
      orbit.remove(child)
      disposeObject3D(child)
    }

    const glowTex = makeGlowTexture()
    const ink = isDark ? 'rgba(226,232,240,0.94)' : 'rgba(28,25,23,0.86)'
    const maxValue = Math.max(...slices.map(s => Math.max(0, s.value)), 1)
    const n = slices.length
    const middle = (n - 1) / 2
    const spacing = n > 5 ? 1.32 : 1.42
    const maxH = 2.45
    const arcDepth = 0.34

    const accentHue = accent ?? slices[0]?.hue ?? { a: '#8B7CFF', b: '#5B4BD4', glow: 'rgba(124,92,255,0.55)', line: '#8B7CFF' }

    const key = new THREE.DirectionalLight(0xffffff, isDark ? 1.5 : 1.9)
    key.position.set(4.5, 8.5, 6)
    orbit.add(key)
    orbit.add(new THREE.HemisphereLight(0xffffff, isDark ? '#0b1023' : '#d9d2c4', isDark ? 0.3 : 0.75))
    const rim = new THREE.PointLight(new THREE.Color(accentHue.a), isDark ? 82 : 34, 40, 2)
    rim.position.set(-5.5, 4.4, -4.2)
    orbit.add(rim)
    const fill = new THREE.PointLight(new THREE.Color(accentHue.a), isDark ? 44 : 18, 40, 2)
    fill.position.set(5.5, 2.8, 4.4)
    orbit.add(fill)
    orbit.add(new THREE.AmbientLight(0xffffff, isDark ? 0.74 : 1.05))

    /* halo portal framing the five pillars */
    const portal = new THREE.Mesh(
      new THREE.TorusGeometry(2.18, 0.026, 12, 84),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentHue.a),
        transparent: true,
        opacity: isDark ? 0.42 : 0.65,
        blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      }),
    )
    portal.position.set(0, 1.32, -1.45)
    orbit.add(portal)
    const portalGlow = new THREE.Mesh(
      new THREE.TorusGeometry(2.18, 0.12, 12, 84),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentHue.b),
        transparent: true,
        opacity: isDark ? 0.14 : 0.22,
        blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      }),
    )
    portalGlow.position.copy(portal.position)
    orbit.add(portalGlow)

    /* obsidian terrace */
    const podiumRadius = (spacing * (n - 1)) / 2 + 0.95
    const terrace = new THREE.Mesh(
      new THREE.CylinderGeometry(podiumRadius, podiumRadius, 0.12, 6),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(isDark ? '#27304e' : '#E9E3D5'),
        metalness: isDark ? 0.36 : 0.08,
        roughness: isDark ? 0.5 : 0.62,
        flatShading: true,
      }),
    )
    terrace.position.y = -0.062
    orbit.add(terrace)
    const terraceRim = new THREE.Mesh(
      new THREE.TorusGeometry(podiumRadius + 0.015, 0.016, 8, 6),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentHue.a),
        emissive: new THREE.Color(accentHue.a),
        emissiveIntensity: isDark ? 1.25 : 0.85,
      }),
    )
    terraceRim.rotation.x = Math.PI / 2
    terraceRim.position.y = 0.002
    orbit.add(terraceRim)

    const floorGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(podiumRadius * 2.4, podiumRadius * 2.4),
      new THREE.MeshBasicMaterial({
        map: glowTex, transparent: true, opacity: isDark ? 0.18 : 0.4,
        depthWrite: false, blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
        color: new THREE.Color(isDark ? accentHue.b : accentHue.a),
      }),
    )
    floorGlow.rotation.x = -Math.PI / 2
    floorGlow.position.y = -0.123
    orbit.add(floorGlow)

    const gridSize = Math.max(8, spacing * n + 3)
    const grid = new THREE.GridHelper(gridSize, 18, isDark ? 0x94a3b8 : 0x8a8378, isDark ? 0x94a3b8 : 0x8a8378)
    const gridMat = grid.material as THREE.Material & { opacity: number }
    gridMat.transparent = true
    gridMat.opacity = isDark ? 0.16 : 0.3
    grid.position.y = -0.124
    orbit.add(grid)

    const hitProxyGeo = new THREE.BoxGeometry(1, 1, 1)
    const hitProxyMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false })
    const hitProxies: THREE.Mesh[] = []

    const shells: THREE.Mesh[] = []
    const gems: THREE.Mesh[] = []
    const gemGlows: THREE.Sprite[] = []
    const cores: THREE.Mesh[] = []
    const plinths: THREE.Mesh[] = []
    const plinthRims: THREE.Mesh[] = []
    const monolithGroups: THREE.Group[] = []

    slices.forEach((slice, i) => {
      const value = Math.max(0, slice.value)
      const t = value / maxValue
      const h = 0.55 + t * maxH
      const x = (i - middle) * spacing
      const z = -Math.abs(i - middle) * arcDepth * 0.8
      const hue = slice.hue

      const group = new THREE.Group()
      group.position.set(x, 0, z)
      orbit.add(group)
      monolithGroups.push(group)

      /* hex plinth + molten rim, kissed by a slice-colored pool light */
      const pool = new THREE.PointLight(new THREE.Color(hue.a), isDark ? 26 : 12, 6.5, 2)
      pool.position.set(x, 1.4, z + 0.35)
      orbit.add(pool)

      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.62, 0.24, 6),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(isDark ? '#232b47' : '#DCD6C9'),
          metalness: isDark ? 0.5 : 0.06,
          roughness: isDark ? 0.42 : 0.58,
          flatShading: true,
        }),
      )
      plinth.position.y = 0.12
      group.add(plinth)
      plinths.push(plinth)

      const plinthRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.022, 8, 6),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(hue.a),
          emissive: new THREE.Color(hue.a),
          emissiveIntensity: isDark ? 1.9 : 1.15,
        }),
      )
      plinthRim.rotation.x = Math.PI / 2
      plinthRim.position.y = 0.243
      group.add(plinthRim)
      plinthRims.push(plinthRim)

      /* molten core inside a faceted crystal shell */
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.155, 0.3, h * 0.94, 6, 1),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(hue.a),
          transparent: true,
          opacity: isDark ? 0.55 : 0.9,
          blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
          depthWrite: false,
        }),
      )
      core.position.y = 0.24
      core.scale.y = 0.001
      core.userData = { u: -i * 0.08, targetH: h * 0.94 }
      group.add(core)
      cores.push(core)

      const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.48, h, 6, 1),
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(hue.b),
          emissive: new THREE.Color(hue.a),
          emissiveIntensity: isDark ? 0.58 : 0.3,
          metalness: isDark ? 0.12 : 0.18,
          roughness: isDark ? 0.1 : 0.14,
          transparent: true,
          opacity: isDark ? 0.78 : 0.66,
          clearcoat: isDark ? 0.85 : 1.0,
          clearcoatRoughness: isDark ? 0.28 : 0.12,
          flatShading: true,
        }),
      )
      shell.position.y = 0.24
      shell.scale.set(1, 0.001, 1)
      shell.userData = { idx: i, targetH: h, u: -i * 0.08, baseEmissive: isDark ? 0.58 : 0.3 }
      group.add(shell)
      shells.push(shell)

      /* invisible full-height proxy so every monolith is easy to hover/pause over */
      const proxyH = Math.max(h, 0.8)
      const proxy = new THREE.Mesh(hitProxyGeo, hitProxyMat)
      proxy.scale.set(1.1, proxyH, 1.1)
      proxy.position.set(x, proxyH / 2, z)
      proxy.userData = { idx: i }
      orbit.add(proxy)
      hitProxies.push(proxy)

      /* floating crown gem - hidden until the crystal rises */
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(hue.a),
          emissive: new THREE.Color(hue.a),
          emissiveIntensity: 2.3,
          metalness: 0.15,
          roughness: 0.12,
          flatShading: true,
          transparent: true,
          opacity: 0,
        }),
      )
      gem.position.y = 0.36 + h + 0.24
      gem.scale.setScalar(0.001)
      group.add(gem)
      gems.push(gem)

      const gemGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: new THREE.Color(hue.a), transparent: true,
        opacity: isDark ? 0.85 : 0.5, depthWrite: false, blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      }))
      gemGlow.scale.setScalar(0.52)
      gemGlow.position.copy(gem.position)
      group.add(gemGlow)
      gemGlows.push(gemGlow)

      /* base warm halo where the crystal meets the plinth */
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 1.5),
        new THREE.MeshBasicMaterial({
          map: glowTex, transparent: true, depthWrite: false, blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
          color: new THREE.Color(hue.a), opacity: isDark ? 0.24 + t * 0.28 : 0.28 + t * 0.18,
        }),
      )
      halo.rotation.x = -Math.PI / 2
      halo.position.set(x, 0.012, z)
      orbit.add(halo)

      const vLabel = makeLabelSprite(`${value}`, ink, 30, 850)
      vLabel.scale.multiplyScalar(0.5)
      vLabel.position.set(x, 0.44 + h + 0.44, z)
      orbit.add(vLabel)
    })

    /* rising ember dust */
    const dustCount = 36
    const dustGeo = new THREE.BufferGeometry()
    const dustPos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * Math.max(7.5, n * spacing)
      dustPos[i * 3 + 1] = Math.random() * 3.4
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 3.6
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.055, map: glowTex, transparent: true, opacity: isDark ? 0.48 : 0.55,
        depthWrite: false, blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
        color: new THREE.Color(isDark ? '#c4b5fd' : accentHue.a),
      }),
    )
    orbit.add(dust)

    const halfWidth = Math.max(podiumRadius + 0.55, 3.0)
    fitToBounds(halfWidth, 2.35, 2.2, new THREE.Vector3(0, 0.98, 0))

    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const container = containerRef.current
    const raycastAt = (clientX: number, clientY: number, targets: THREE.Object3D[]) => {
      const ctx = getCtx()
      if (!ctx || !container) return []
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return []
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, ctx.camera)
      return raycaster.intersectObjects(targets, false)
    }
    const pauseTargets: THREE.Object3D[] = [...hitProxies, terrace, terraceRim]
    const isOverSceneObject = (clientX: number, clientY: number): boolean =>
      raycastAt(clientX, clientY, pauseTargets).length > 0
    let offMove: () => void = () => {}
    if (container) {
      const onMove = (e: PointerEvent) => {
        pauseRef.current = isOverSceneObject(e.clientX, e.clientY)
        const hits = raycastAt(e.clientX, e.clientY, shells)
        const idx = hits.length > 0 ? (hits[0].object.userData.idx as number) : null
        if (idx !== hoverRef.current) {
          hoverRef.current = idx
          setHoverIdx(idx)
        }
      }
      const onLeave = () => { pauseRef.current = false; hoverRef.current = null; setHoverIdx(null) }
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
      const paused = pauseRef.current

      for (let i = 0; i < shells.length; i++) {
        const isHot = cur === i || sel === i
        const bob = paused ? (isHot ? 0.075 : 0) : Math.sin(elapsed * 0.85 + i * 1.35) * 0.045 + (isHot ? 0.075 : 0)
        const group = monolithGroups[i]
        group.position.y = bob

        const shell = shells[i]
        const growU = ((shell.userData.u as number) ?? 0) + dt * 1.9
        shell.userData.u = growU
        const grown = easeOutQuart(Math.min(1, Math.max(0, growU)))
        const targetH = shell.userData.targetH as number
        shell.scale.y = Math.max(0.001, grown)
        shell.position.y = 0.24 + (targetH * grown) / 2
        const mat = shell.material as THREE.MeshPhysicalMaterial
        const goal = isHot ? (shell.userData.baseEmissive as number) + 0.85 : (shell.userData.baseEmissive as number)
        mat.emissiveIntensity += (goal - mat.emissiveIntensity) * Math.min(1, dt * 8)
        const targetScale = isHot ? 1.055 : 1
        shell.scale.x += (targetScale - shell.scale.x) * Math.min(1, dt * 8)
        shell.scale.z += (targetScale - shell.scale.z) * Math.min(1, dt * 8)

        const core = cores[i]
        const coreU = ((core.userData.u as number) ?? 0) + dt * 1.9
        core.userData.u = coreU
        const coreGrown = easeOutQuart(Math.min(1, Math.max(0, coreU)))
        const coreTargetH = core.userData.targetH as number
        core.scale.y = Math.max(0.001, coreGrown)
        core.position.y = 0.24 + (coreTargetH * coreGrown) / 2

        const gem = gems[i]
        const gemU = Math.min(1, Math.max(0, (growU - 0.5) / 0.5))
        const gemGrown = easeOutQuart(gemU)
        gem.scale.setScalar(Math.max(0.001, gemGrown))
        if (!paused) gem.rotation.y = elapsed * (0.55 + i * 0.07)
        const gemBobY = paused ? 0 : Math.sin(elapsed * 1.15 + i * 1.35) * 0.05
        gem.position.y = 0.36 + shell.userData.targetH + 0.24 + gemBobY
        const gemMat = gem.material as THREE.MeshStandardMaterial
        gemMat.opacity = gemGrown
        gemMat.emissiveIntensity = paused ? 1.9 + (isHot ? 0.9 : 0) : 1.9 + Math.sin(elapsed * 1.7 + i * 2.1) * 0.55 + (isHot ? 0.9 : 0)
        gemGlows[i].position.y = gem.position.y
        const glowPulse = paused ? 0.15 : 0.2 * (0.5 + 0.5 * Math.sin(elapsed * 1.7 + i * 2.1))
        gemGlows[i].material.opacity = gemGrown * ((isDark ? 0.85 : 0.5) - 0.15 + glowPulse + (isHot ? 0.15 : 0))
        gemGlows[i].scale.setScalar((paused ? 0.5 + (isHot ? 0.16 : 0) : 0.5 + 0.09 * Math.sin(elapsed * 1.7 + i * 2.1) + (isHot ? 0.16 : 0)) * gemGrown)

        if (!paused) cores[i].rotation.y = -elapsed * 0.35
        const coreMat = cores[i].material as THREE.MeshBasicMaterial
        const corePulse = paused ? 0.07 : 0.14 * (0.5 + 0.5 * Math.sin(elapsed * 1.3 + i))
        coreMat.opacity = (isDark ? 0.5 : 0.78) * easeOutQuart(Math.min(1, Math.max(0, ((cores[i].userData.u as number) ?? 0)))) + corePulse + (isHot ? 0.18 : 0)

        if (!paused) plinthRims[i].rotation.z = elapsed * 0.4 + i
        const rimMat = plinthRims[i].material as THREE.MeshStandardMaterial
        rimMat.emissiveIntensity = paused ? 1.5 + (isHot ? 0.8 : 0) : 1.5 + Math.sin(elapsed * 1.9 + i * 1.7) * 0.5 + (isHot ? 0.8 : 0)
      }

      portal.rotation.z = paused ? portal.rotation.z : Math.sin(elapsed * 0.18) * 0.05
      const portalMat = portal.material as THREE.MeshBasicMaterial
      portalMat.opacity = paused ? portalMat.opacity : (isDark ? 0.3 : 0.55) + 0.1 * (0.5 + 0.5 * Math.sin(elapsed * 0.6))
      portalGlow.rotation.z = portal.rotation.z

      if (!paused) {
        const dp = dustGeo.getAttribute('position') as THREE.BufferAttribute
        for (let i = 0; i < dustCount; i++) {
          let y = dp.getY(i) + dt * 0.16
          if (y > 3.9) y = 0.03
          dp.setY(i, y)
        }
        dp.needsUpdate = true
        dust.rotation.y = Math.sin(elapsed * 0.06) * 0.06
        terraceRim.rotation.z = Math.sin(elapsed * 0.22) * 0.04
      }
    })

    return () => {
      offMove()
      cancelTick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slices, isDark])

  const shownIdx = hoverIdx ?? selectedIdx
  const shownSlice = shownIdx !== null ? slices[shownIdx] : null
  const totalShown = slices.reduce((s, d) => s + Math.max(0, d.value), 0)
  const share = shownSlice && totalShown > 0 ? Math.round((Math.max(0, shownSlice.value) / totalShown) * 100) : 0

  return (
    <div
      ref={containerRef}
      className={`stage-3d-shell overflow-hidden rounded-2xl ${className || ''}`}
      style={{ height, position: 'relative', cursor: hoverIdx !== null ? 'pointer' : 'grab', touchAction: 'pan-y' }}
    >
      {shownSlice && (
        <div className="pointer-events-none absolute left-3 top-2 z-10">
          <span
            className="rounded-xl border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md"
            style={{
              color: isDark ? '#fff' : '#1c1917',
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.10)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.72)' : 'rgba(255,255,255,0.82)',
              boxShadow: `0 8px 22px -12px ${shownSlice.hue.glow}`,
            }}
          >
            {shownSlice.name} - {shownSlice.value} bien{shownSlice.value > 1 ? 's' : ''} - {share}%
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
