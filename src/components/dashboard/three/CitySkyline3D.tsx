import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThreeStage, makeGlowTexture, makeLabelSprite, disposeObject3D } from './useThreeStage'
import type { StageHue } from '../Stage'

export interface SkylineItem {
  label: string
  value: number
  meta?: string
  trend?: number // e.g., +12% vs previous month
  status?: 'active' | 'pending' | 'sold'
}

export interface CitySkyline3DProps {
  data: SkylineItem[]
  hue: StageHue
  isDark: boolean
  height?: number | string
  className?: string
  hint?: string
  onSelectTower?: (item: SkylineItem, index: number) => void
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Custom elastic easing for satisfying tower growth
function easeOutElastic(x: number): number {
  if (x === 0) return 0
  if (x === 1) return 1
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}

interface FacadeTextures {
  map: THREE.CanvasTexture
  emissiveMap: THREE.CanvasTexture
}

function makeFacadeTextures(variant: number, isDark: boolean): FacadeTextures {
  const rand = mulberry32(variant * 1013 + 77)
  const cw = 128
  const ch = 256
  const cols = 5
  const rows = 15
  const marginX = 15
  const marginTop = 18
  const marginBottom = 14
  const cellW = (cw - marginX * 2) / cols
  const cellH = (ch - marginTop - marginBottom) / rows
  const winW = Math.min(13, cellW - 5)
  const winH = Math.min(7.5, cellH - 4)

  const base = document.createElement('canvas')
  base.width = cw
  base.height = ch
  const bctx = base.getContext('2d')!
  const facade = bctx.createLinearGradient(0, 0, 0, ch)
  if (isDark) {
    facade.addColorStop(0, variant % 2 === 0 ? '#465070' : '#3a4160')
    facade.addColorStop(0.55, variant % 2 === 0 ? '#303748' : '#2b3149')
    facade.addColorStop(1, '#222842')
  } else {
    facade.addColorStop(0, variant % 2 === 0 ? '#f2efe7' : '#e9e6dd')
    facade.addColorStop(0.55, variant % 2 === 0 ? '#d8d4c8' : '#cfccc0')
    facade.addColorStop(1, '#b3afa3')
  }
  bctx.fillStyle = facade
  bctx.fillRect(0, 0, cw, ch)

  const glow = document.createElement('canvas')
  glow.width = cw
  glow.height = ch
  const gctx = glow.getContext('2d')!
  gctx.fillStyle = '#000000'
  gctx.fillRect(0, 0, cw, ch)

  const warm = ['#ffd9a0', '#ffc47a', '#ffe9c4']
  const cool = ['#a8dcff', '#8fd0ff']
  const litRatio = 0.42 + variant * 0.08

  for (let r = 0; r < rows; r++) {
    const floorLit = rand() > 0.15
    for (let c = 0; c < cols; c++) {
      const x = marginX + c * cellW + (cellW - winW) / 2
      const y = marginTop + r * cellH + (cellH - winH) / 2
      const lit = floorLit && rand() < litRatio
      bctx.fillStyle = isDark ? (lit ? 'rgba(24,28,38,0.95)' : 'rgba(8,10,16,0.9)') : (lit ? 'rgba(58,52,44,0.85)' : 'rgba(70,64,54,0.62)')
      bctx.fillRect(x, y, winW, winH)

      if (lit) {
        const palette = rand() < 0.78 ? warm : cool
        gctx.fillStyle = palette[Math.floor(rand() * palette.length)]
        gctx.globalAlpha = 0.6 + rand() * 0.4
        gctx.fillRect(x, y, winW, winH)
        gctx.globalAlpha = 1
      }
    }
  }

  const map = new THREE.CanvasTexture(base)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 4
  const emissiveMap = new THREE.CanvasTexture(glow)
  emissiveMap.colorSpace = THREE.SRGBColorSpace
  emissiveMap.anisotropy = 4
  return { map, emissiveMap }
}

export function CitySkyline3D({
  data,
  hue,
  isDark,
  height,
  className,
  hint = 'glisser pour orbiter - cliquer pour epingler',
  onSelectTower,
}: CitySkyline3DProps) {
  const pauseRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { orbitRef, addTick, getCtx, fitToBounds } = useThreeStage(containerRef, {
    camPos: [0, 4.2, 10.5],
    lookAt: [0, 1.1, 0],
    fov: 38,
    autoRotateSpeed: 0.15, // Gentle cinematic idle rotation
    swayAmplitude: 0.08,
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
    if (!orbit || data.length === 0) return
    while (orbit.children.length) {
      const child = orbit.children[0]
      orbit.remove(child)
      disposeObject3D(child)
    }

    const glowTex = makeGlowTexture()
    const ink = isDark ? 'rgba(226,232,240,0.94)' : 'rgba(28,25,23,0.86)'
    const maxValue = Math.max(...data.map(d => d.value), 1)
    const n = data.length
    const spacing = n > 10 ? 0.82 : n > 7 ? 1.1 : 1.45
    const maxHeight = 3.1

    // Lighting setup
    const key = new THREE.DirectionalLight(0xffffff, isDark ? 1.8 : 2.0)
    key.position.set(6, 10, 8)
    orbit.add(key)
    
    const rim = new THREE.PointLight(new THREE.Color(hue.a), isDark ? 110 : 45, 45, 2)
    rim.position.set(-7, 5, -5)
    orbit.add(rim)

    const fill = new THREE.PointLight(new THREE.Color(hue.b), isDark ? 70 : 30, 45, 2)
    fill.position.set(7, 3.5, 5)
    orbit.add(fill)
    
    orbit.add(new THREE.AmbientLight(0xffffff, isDark ? 0.85 : 1.1))

    // Holographic Cyber-Grid Podium Base
    const podiumRadius = ((n - 1) * spacing) / 2 + 0.6
    const podium = new THREE.Mesh(
      new THREE.CylinderGeometry(podiumRadius, podiumRadius + 0.2, 0.18, 64),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(isDark ? '#1a2238' : '#e6e1d5'),
        metalness: 0.5,
        roughness: 0.3,
      })
    )
    podium.position.y = -0.09
    orbit.add(podium)

    const rimRing = new THREE.Mesh(
      new THREE.TorusGeometry(podiumRadius + 0.03, 0.03, 12, 80),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(hue.a),
        emissive: new THREE.Color(hue.a),
        emissiveIntensity: 2.5,
        metalness: 0.3,
        roughness: 0.2,
      })
    )
    rimRing.rotation.x = Math.PI / 2
    rimRing.position.y = 0.002
    orbit.add(rimRing)

    const facades = [makeFacadeTextures(0, isDark), makeFacadeTextures(1, isDark), makeFacadeTextures(2, isDark)]
    const x0 = (-(n - 1) / 2) * spacing
    let tallest = 0
    let maxBuildingH = 0.35
    data.forEach((d, i) => { if (d.value > data[tallest].value) tallest = i })
    const hasTallest = data[tallest] && data[tallest].value > 0

    const buildings: THREE.Mesh[] = []
    const roofStrips: THREE.Mesh[] = []
    const beacons: THREE.Mesh[] = []
    const beaconGlows: THREE.Sprite[] = []
    const roofs: THREE.Mesh[] = []
    const halos: THREE.Mesh[] = []

    const bodyGeo = new THREE.BoxGeometry(1, 1, 1)
    const roofGeo = new THREE.BoxGeometry(1, 1, 1)
    const stripGeo = new THREE.BoxGeometry(1, 1, 1)
    const beaconGeo = new THREE.SphereGeometry(0.06, 12, 12)
    const haloGeo = new THREE.PlaneGeometry(2.2, 2.2)
    const hitProxyGeo = new THREE.BoxGeometry(1, 1, 1)
    const hitProxyMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false })
    const hitProxies: THREE.Mesh[] = []

    data.forEach((d, i) => {
      const rand = mulberry32(i * 613 + 29)
      const t = maxValue > 0 ? d.value / maxValue : 0
      const h = Math.max(0.25, 0.4 + t * maxHeight)
      if (h > maxBuildingH) maxBuildingH = h
      const w = 0.55 + rand() * 0.3
      const depth = 0.55 + rand() * 0.25
      const x = x0 + i * spacing
      const z = (rand() - 0.5) * 0.3
      const variant = i % facades.length
      const facade = facades[variant]

      const body = new THREE.Mesh(
        bodyGeo,
        new THREE.MeshStandardMaterial({
          map: facade.map,
          emissiveMap: facade.emissiveMap,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: isDark ? 1.4 : 1.1,
          color: new THREE.Color(0xffffff),
          metalness: isDark ? 0.65 : 0.15,
          roughness: isDark ? 0.35 : 0.75,
        })
      ) 
      body.scale.set(w, 0.001, depth)
      body.position.set(x, 0, z)
      body.userData = { idx: i, targetH: h, u: -i * 0.05, baseEmissive: isDark ? 1.4 : 1.1 }
      orbit.add(body)
      buildings.push(body)

      const proxyH = Math.max(h, 0.7)
      const proxy = new THREE.Mesh(hitProxyGeo, hitProxyMat)
      proxy.scale.set(w + 0.22, proxyH, depth + 0.22)
      proxy.position.set(x, proxyH / 2, z)
      proxy.userData = { idx: i }
      orbit.add(proxy)
      hitProxies.push(proxy)

      // Light pool under tower
      const halo = new THREE.Mesh(
        haloGeo,
        new THREE.MeshBasicMaterial({
          map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          color: new THREE.Color(hue.a), opacity: 0.2 + t * 0.25,
        })
      )
      halo.rotation.x = -Math.PI / 2
      halo.position.set(x, 0.015, z)
      orbit.add(halo)
      halos.push(halo)

      const roof = new THREE.Mesh(
        roofGeo,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(isDark ? '#252c42' : '#c9c3b6'),
          metalness: 0.7, roughness: 0.3,
        })
      )
      roof.scale.set(w * 1.05, 0.07, depth * 1.05)
      roof.position.set(x, 0.04, z)
      orbit.add(roof)
      roofs.push(roof)

      const strip = new THREE.Mesh(
        stripGeo,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(hue.a),
          emissive: new THREE.Color(hue.a),
          emissiveIntensity: 2.2,
          metalness: 0.2, roughness: 0.2,
        })
      )
      strip.scale.set(w * 1.06, 0.02, depth * 1.06)
      strip.position.set(x, 0.08, z)
      orbit.add(strip)
      roofStrips.push(strip)

      const beacon = new THREE.Mesh(
        beaconGeo,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(hue.a),
          emissive: new THREE.Color(hue.a),
          emissiveIntensity: 2.8,
        })
      )
      beacon.position.set(x, 0.13, z)
      orbit.add(beacon)
      beacons.push(beacon)

      const beaconGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: new THREE.Color(hue.a), transparent: true,
        opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending,
      }))
      beaconGlow.scale.setScalar(0.38)
      beaconGlow.position.set(x, 0.14, z)
      orbit.add(beaconGlow)
      beaconGlows.push(beaconGlow)

      // Labels (front + back so flipping the scene keeps the month visible)
      const label = makeLabelSprite(d.label, isDark ? '#f1f5f9' : '#1c1917', 40, 800, 'rgba(0,0,0,0.6)', 7)
      label.scale.multiplyScalar(0.82)
      label.position.set(x, 0.17, depth / 2 + 0.55)
      orbit.add(label)
      const backLabel = label.clone()
      backLabel.position.set(x, 0.17, -(depth / 2 + 0.55))
      orbit.add(backLabel)

      if (n <= 8 || i % 2 === 0 || d.value === maxValue) {
        const vLabel = makeLabelSprite(`${d.value}`, ink, 32, 800)
        vLabel.scale.multiplyScalar(0.5)
        vLabel.position.set(x, h + 0.35, z)
        orbit.add(vLabel)
      }
    })

    // Pinnacle Antenna for Tallest Building
    let pinnacle: { antenna: THREE.Mesh; tip: THREE.Mesh; tipGlow: THREE.Sprite } | null = null
    if (hasTallest) {
      const tZ = buildings[tallest].position.z
      const tX = buildings[tallest].position.x
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.025, 0.5, 6),
        new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.9, roughness: 0.2 })
      )
      antenna.position.set(tX, 0.3, tZ)
      orbit.add(antenna)

      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 12, 12),
        new THREE.MeshStandardMaterial({ color: hue.a, emissive: hue.a, emissiveIntensity: 3.0 })
      )
      tip.position.set(tX, 0.58, tZ)
      orbit.add(tip)

      const tipGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: new THREE.Color(hue.a), transparent: true, opacity: 0.95,
        depthWrite: false, blending: THREE.AdditiveBlending,
      }))
      tipGlow.scale.setScalar(0.45)
      tipGlow.position.set(tX, 0.58, tZ)
      orbit.add(tipGlow)
      pinnacle = { antenna, tip, tipGlow }
    }

    // Floating Atmospheric Dust / Sparkles
    const dustCount = 50
    const dustGeo = new THREE.BufferGeometry()
    const dustPos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 8
      dustPos[i * 3 + 1] = Math.random() * 3.8
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4.5
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.055, map: glowTex, transparent: true, opacity: isDark ? 0.5 : 0.65,
        depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color('#ffdfa9'),
      })
    )
    orbit.add(dust)

    const contentBottom = -0.2
    const contentTop = maxBuildingH + 0.8
    const fitCenter = new THREE.Vector3(0, (contentTop + contentBottom) / 2, 0)
    fitToBounds(Math.max(((n - 1) * spacing) / 2 + 1.8, 3.4), 2.9, 2.5, fitCenter)

    // Raycasting & Interaction
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const container = containerRef.current
    let offMove: () => void = () => {}
    let offClick: () => void = () => {}

    const raycastAt = (clientX: number, clientY: number, targets: THREE.Object3D[]) => {
      const ctx = getCtx()
      if (!ctx) return []
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return []
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, ctx.camera)
      return raycaster.intersectObjects(targets, false)
    }

    const pickTower = (clientX: number, clientY: number): number | null => {
      const hits = raycastAt(clientX, clientY, hitProxies)
      return hits.length > 0 ? (hits[0].object.userData.idx as number) : null
    }
    const pauseTargets: THREE.Object3D[] = [...hitProxies, podium, rimRing]
    const isOverSceneObject = (clientX: number, clientY: number): boolean =>
      raycastAt(clientX, clientY, pauseTargets).length > 0

    if (container) {
      let downX = 0
      let downY = 0
      const onPointerDown = (e: PointerEvent) => { downX = e.clientX; downY = e.clientY }
      const onMove = (e: PointerEvent) => {
        pauseRef.current = isOverSceneObject(e.clientX, e.clientY)
        const idx = pickTower(e.clientX, e.clientY)
        if (idx !== hoverRef.current) {
          hoverRef.current = idx
          setHoverIdx(idx)
        }
      }
      const onLeave = () => { pauseRef.current = false; hoverRef.current = null; setHoverIdx(null) }
      const onClick = (e: MouseEvent) => {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return
        const idx = pickTower(e.clientX, e.clientY)
        if (idx !== null) {
          setSelectedIdx(prev => (prev === idx ? null : idx))
          if (onSelectTower) onSelectTower(data[idx], idx)
        } else {
          setSelectedIdx(null)
        }
      }
      container.addEventListener('pointerdown', onPointerDown)
      container.addEventListener('pointermove', onMove)
      container.addEventListener('pointerleave', onLeave)
      container.addEventListener('click', onClick)
      offMove = () => {
        container.removeEventListener('pointerdown', onPointerDown)
        container.removeEventListener('pointermove', onMove)
        container.removeEventListener('pointerleave', onLeave)
        container.removeEventListener('click', onClick)
      }
    }

    const cancelTick = addTick((elapsed, dt) => {
      const cur = hoverRef.current
      const sel = selectedRef.current
      const paused = pauseRef.current

      for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i]
        const target = b.userData.targetH as number
        const u = (b.userData.u as number) + dt * 1.8
        b.userData.u = u
        const eased = easeOutElastic(Math.min(1, Math.max(0, u)))
        const y = Math.max(0.001, target * eased)
        b.scale.y = y
        b.position.y = y / 2

        const isHot = cur === i || sel === i
        const sway = paused ? 1 : 1 + Math.sin(elapsed * 1.5 + i * 1.5) * 0.006
        b.scale.x = sway * (isHot ? 1.09 : 1)
        b.scale.z = sway * (isHot ? 1.09 : 1)

        roofs[i].position.y = y + 0.035
        roofStrips[i].position.y = y + 0.075
        beacons[i].position.y = y + 0.12
        beaconGlows[i].position.y = y + 0.13

        const beaconMat = beacons[i].material as THREE.MeshStandardMaterial
        beaconMat.emissiveIntensity = paused ? 2.0 + (isHot ? 1.5 : 0) : 2.0 + Math.sin(elapsed * 2.5 + i) * 1.0 + (isHot ? 1.5 : 0)

        const mat = b.material as THREE.MeshStandardMaterial
        const goal = isHot ? (b.userData.baseEmissive as number) + 1.3 : (b.userData.baseEmissive as number)
        mat.emissiveIntensity += (goal - mat.emissiveIntensity) * Math.min(1, dt * 10)
      }

      if (pinnacle && buildings[tallest]) {
        const topY = buildings[tallest].position.y * 2
        pinnacle.antenna.position.y = topY + 0.27
        pinnacle.tip.position.y = topY + 0.55
        pinnacle.tipGlow.position.y = topY + 0.55
        if (!paused) pinnacle.tipGlow.scale.setScalar(0.42 + 0.09 * Math.sin(elapsed * 2.6))
      }

      if (!paused) {
        const dp = dustGeo.getAttribute('position') as THREE.BufferAttribute
        for (let i = 0; i < dustCount; i++) {
          let y = dp.getY(i) + dt * 0.12
          if (y > 4.2) y = 0.05
          dp.setY(i, y)
        }
        dp.needsUpdate = true
        dust.rotation.y = Math.sin(elapsed * 0.05) * 0.05
        rimRing.rotation.z = Math.sin(elapsed * 0.3) * 0.04
      }
    })

    return () => {
      offMove()
      offClick()
      cancelTick()
    }
  }, [data, hue, isDark])

  const shownIdx = hoverIdx ?? selectedIdx

  return (
    <div
      ref={containerRef}
      className={`stage-3d-shell overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ${className || ''}`}
      style={{
        height,
        position: 'relative',
        cursor: hoverIdx !== null ? 'pointer' : 'grab',
        touchAction: 'pan-y',
        backgroundColor: isDark ? '#0A0F22' : '#F6F1E7',
        backgroundImage: [
          `radial-gradient(120% 85% at 50% -15%, ${hue.a}47 0%, transparent 60%)`,
          `radial-gradient(75% 60% at 50% 118%, ${hue.a}40 0%, transparent 58%)`,
          `radial-gradient(55% 50% at 10% 22%, ${hue.b}38 0%, transparent 62%)`,
          `radial-gradient(55% 50% at 90% 22%, ${hue.a}33 0%, transparent 62%)`,
        ].join(', '),
      }}
    >
      {isDark && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-80"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.22) 1px, transparent 1.8px)',
            backgroundSize: '26px 26px',
          }}
        />
      )}
      {/* HUD Info Card Overlay */}
      {shownIdx !== null && data[shownIdx] && (
        <div className="absolute left-4 top-4 z-10 animate-fade-in pointer-events-none">
          <div
            className="flex flex-col gap-1 rounded-2xl border px-3.5 py-2.5 backdrop-blur-xl shadow-xl transition-all"
            style={{
              color: isDark ? '#fff' : '#1c1917',
              borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.12)',
              backgroundColor: isDark ? 'rgba(13,18,36,0.82)' : 'rgba(255,255,255,0.90)',
              boxShadow: `0 12px 30px -10px ${hue.glow}`,
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-75">{data[shownIdx].label}</span>
              {data[shownIdx].trend !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${data[shownIdx].trend! >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {data[shownIdx].trend! >= 0 ? '▲' : '▼'} {Math.abs(data[shownIdx].trend!)}%
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black tracking-tight">{data[shownIdx].value}</span>
              <span className="text-xs opacity-80">biens enregistrés</span>
            </div>
            {data[shownIdx].meta && (
              <span className="text-[11px] opacity-60 font-medium">{data[shownIdx].meta}</span>
            )}
          </div>
        </div>
      )}

      {/* Interactive Helper Hint */}
      {hint && (
        <div className="pointer-events-none absolute bottom-3 right-4 z-10">
          <span
            className="rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[1.5px] backdrop-blur-md shadow-sm"
            style={{
              color: isDark ? 'rgba(226,232,240,0.65)' : 'rgba(28,25,23,0.6)',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.6)' : 'rgba(255,255,255,0.75)',
            }}
          >
            {hint}
          </span>
        </div>
      )}
    </div>
  )
}