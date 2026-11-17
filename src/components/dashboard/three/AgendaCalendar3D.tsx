import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { useThreeStage, makeGlowTexture, makeLabelSprite, disposeObject3D } from './useThreeStage'
import type { StageHue } from '../Stage'

export interface AgendaCalendarEvent {
  id: string
  title: string
  type?: string
  start: Date
  end?: Date
  agentNames?: string[]
}

export interface AgendaCalendar3DProps {
  events: AgendaCalendarEvent[]
  isDark: boolean
  height?: number
  className?: string
  hue?: StageHue
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function AgendaCalendar3D({ events, isDark, height = 360, className, hue }: AgendaCalendar3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { orbitRef, addTick, getCtx, fitToBounds } = useThreeStage(containerRef, {
    camPos: [0, 9, 13],
    lookAt: [0, 0, 0],
    fov: 40,
    autoRotateSpeed: 0,
    swayAmplitude: 0.18,
    swaySpeed: 0.42,
  })

  const accent = hue ?? (isDark
    ? { a: '#F43F5E', b: '#6D28D9', line: '#F43F5E', glow: 'rgba(244,63,94,0.50)' }
    : { a: '#FB923C', b: '#C2410C', line: '#F97316', glow: 'rgba(249,115,22,0.45)' })

  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [focusIdx, setFocusIdx] = useState<number | null>(null)
  const hoverRef = useRef<number | null>(null)
  const focusRef = useRef<number | null>(null)

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
    const ink = dark ? 'rgba(226,232,240,0.95)' : 'rgba(28,25,23,0.88)'

    const key = new THREE.DirectionalLight(0xffffff, dark ? 1.6 : 1.9)
    key.position.set(5, 10, 6)
    orbit.add(key)
    const rim = new THREE.PointLight(new THREE.Color(accent.a), dark ? 140 : 60, 48, 2)
    rim.position.set(-6, 4, -5)
    orbit.add(rim)
    const fill = new THREE.PointLight(new THREE.Color(accent.b), dark ? 90 : 40, 48, 2)
    fill.position.set(6, 3, 5)
    orbit.add(fill)
    const accentLight = new THREE.PointLight(new THREE.Color(accent.a), dark ? 70 : 30, 40, 2)
    accentLight.position.set(0, 6, 0)
    orbit.add(accentLight)
    orbit.add(new THREE.AmbientLight(0xffffff, dark ? 0.65 : 0.95))

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 26),
      new THREE.MeshBasicMaterial({
        map: glowTex, transparent: true, opacity: dark ? 0.12 : 0.2,
        depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(accent.a),
      })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.6
    orbit.add(floor)

    const boardTilt = Math.PI / 2.35
    const board = new THREE.Group()
    board.rotation.x = boardTilt
    orbit.add(board)

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const startOffset = (firstOfMonth.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

    const spacing = 1.35

    /* tripod stand */
    const legMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accent.b),
      emissive: new THREE.Color(accent.a),
      emissiveIntensity: dark ? 1.1 : 0.7,
      metalness: 0.72,
      roughness: 0.24,
    })
    const legGeo = new THREE.CylinderGeometry(0.045, 0.09, 2.1, 12)
    const corners = [[-3, -2.2], [3, -2.2], [0, 2.6]]
    corners.forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat)
      leg.position.set(x * 0.32, -1.05, z * 0.32)
      leg.rotation.x = (z > 0 ? -0.22 : 0.18)
      leg.rotation.z = (x > 0 ? -0.16 : x < 0 ? 0.16 : 0)
      board.add(leg)
    })
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.3, 0.16, 48),
      legMat
    )
    base.position.set(0, -2.12, 0)
    board.add(base)
    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.05, 8, 64),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accent.a), transparent: true,
        opacity: dark ? 0.7 : 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
      })
    )
    baseRing.rotation.x = Math.PI / 2
    baseRing.position.set(0, -2.04, 0)
    board.add(baseRing)

    const tileGeo = new RoundedBoxGeometry(1.05, 0.16, 1.05, 4, 0.12)
    const todayKey = dayKey(now)

    const eventsByDay = new Map<string, AgendaCalendarEvent[]>()
    events.forEach(e => {
      const k = dayKey(e.start)
      if (!eventsByDay.has(k)) eventsByDay.set(k, [])
      eventsByDay.get(k)!.push(e)
    })

    const tiles: THREE.Mesh[] = []
    const tileData: { date: Date | null; events: AgendaCalendarEvent[] }[] = []

    for (let i = 0; i < totalCells; i++) {
      const col = i % 7
      const row = Math.floor(i / 7)
      const dayNum = i - startOffset + 1
      const inMonth = dayNum >= 1 && dayNum <= daysInMonth
      const date = inMonth ? new Date(year, month, dayNum) : null
      const k = date ? dayKey(date) : null
      const dayEvents = (k && eventsByDay.get(k)) || []

      const x = (col - 3) * spacing
      const z = (row - (totalCells / 7 - 1) / 2) * spacing

      const isToday = k === todayKey
      const hasEvents = dayEvents.length > 0

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(isToday ? accent.a : (hasEvents ? accent.b : (dark ? '#1e293b' : '#f8fafc'))),
        emissive: new THREE.Color(hasEvents ? accent.a : (isToday ? accent.b : accent.a)),
        emissiveIntensity: hasEvents ? (dark ? 2.2 : 1.5) : (isToday ? (dark ? 1.6 : 1.0) : (dark ? 0.25 : 0.12)),
        metalness: 0.55,
        roughness: 0.18,
        transparent: true,
        opacity: inMonth ? 0.95 : 0.4,
      })
      const tile = new THREE.Mesh(tileGeo, mat)
      tile.position.set(x, 0, z)
      tile.userData = { idx: i, inMonth, isToday, hasEvents }
      board.add(tile)
      tiles.push(tile)

      if (inMonth && date) {
        const numLabel = makeLabelSprite(String(dayNum), ink, 52, 900)
        numLabel.scale.multiplyScalar(0.62)
        numLabel.position.set(x, 0.24, z + 0.05)
        board.add(numLabel)
      }

      if (row === 0) {
        const wd = makeLabelSprite(WEEKDAYS[col], accent.line, 40, 800)
        wd.scale.multiplyScalar(0.62)
        wd.position.set(x, 0.24, z - spacing * 0.95)
        board.add(wd)
      }

      if (hasEvents) {
        const count = Math.min(dayEvents.length, 4)
        for (let e = 0; e < count; e++) {
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshStandardMaterial({
              color: new THREE.Color(accent.a),
              emissive: new THREE.Color(accent.a),
              emissiveIntensity: dark ? 2.2 : 1.4,
              metalness: 0.4,
              roughness: 0.2,
            })
          )
          dot.position.set(x + (e - (count - 1) / 2) * 0.26, 0.18, z - 0.32)
          board.add(dot)

          const glow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTex, color: new THREE.Color(accent.a), transparent: true,
            opacity: dark ? 0.75 : 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
          }))
          glow.scale.setScalar(0.45)
          glow.position.copy(dot.position)
          glow.position.y += 0.05
          board.add(glow)
        }
      }

      if (isToday) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.62, 0.035, 8, 48),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(accent.a), transparent: true,
            opacity: dark ? 0.85 : 0.7, depthWrite: false, blending: THREE.AdditiveBlending,
          })
        )
        ring.rotation.x = Math.PI / 2
        ring.position.set(x, 0.12, z)
        board.add(ring)
      }

      tileData.push({ date, events: dayEvents })
    }

    const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    const title = makeLabelSprite(monthName.toUpperCase(), ink, 52, 800)
    title.scale.multiplyScalar(0.9)
    title.position.set(0, 0.35, (totalCells / 7 - 1) * spacing / 2 + 1.6)
    board.add(title)

    const dustCount = 40
    const dustGeo = new THREE.BufferGeometry()
    const dustPos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 12
      dustPos[i * 3 + 1] = Math.random() * 4
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 12
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.06, map: glowTex, transparent: true, opacity: dark ? 0.35 : 0.5,
        depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(accent.a),
      })
    )
    orbit.add(dust)

    const rows = totalCells / 7
    fitToBounds(
      (7 * spacing) / 2 + 0.6,
      (rows * spacing) / 2 + 1.2,
      2.2,
      new THREE.Vector3(0, 0, 0)
    )

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
        board.updateMatrixWorld()
        const hits = raycaster.intersectObjects(tiles, false)
        const idx = hits.length > 0 ? (hits[0].object.userData.idx as number) : null
        const inM = idx !== null ? tileData[idx]?.date !== null : false
        const newIdx = inM ? idx : null
        if (newIdx !== hoverRef.current) {
          hoverRef.current = newIdx
          setHoverIdx(newIdx)
        }
      }
      const onLeave = () => { hoverRef.current = null; setHoverIdx(null) }
      const onClick = () => {
        const h = hoverRef.current
        if (h === null) { setFocusIdx(null); return }
        setFocusIdx(prev => (prev === h ? null : h))
      }
      container.addEventListener('pointermove', onMove)
      container.addEventListener('pointerleave', onLeave)
      container.addEventListener('click', onClick)
      offMove = () => {
        container.removeEventListener('pointermove', onMove)
        container.removeEventListener('pointerleave', onLeave)
      }
      offClick = () => container.removeEventListener('click', onClick)
    }

    const cancelTick = addTick((elapsed, dt) => {
      const pulse = 1 + Math.sin(elapsed * 1.1) * 0.028
      board.scale.setScalar(pulse)

      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i]
        const data = tileData[i]
        if (!data.date) continue
        const hot = hoverRef.current === i
        const focused = focusRef.current === i
        const mat = tile.material as THREE.MeshStandardMaterial
        const goalEmissive = focused ? 2.4 : hot ? 1.8 : (data.events.length ? (dark ? 1.4 : 0.9) : (tile.userData.isToday ? (dark ? 0.9 : 0.5) : 0))
        mat.emissiveIntensity += (goalEmissive - mat.emissiveIntensity) * Math.min(1, dt * 10)
        const scaleGoal = focused ? 1.12 : hot ? 1.06 : 1
        tile.scale.x += (scaleGoal - tile.scale.x) * Math.min(1, dt * 12)
        tile.scale.z += (scaleGoal - tile.scale.z) * Math.min(1, dt * 12)
        tile.position.y = focused || hot ? 0.12 : 0
      }

      const dp = dustGeo.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < dustCount; i++) {
        let y = dp.getY(i) + dt * 0.18
        if (y > 4) y = 0
        dp.setY(i, y)
      }
      dp.needsUpdate = true
      dust.rotation.y = Math.sin(elapsed * 0.1) * 0.12
    })

    return () => {
      offMove()
      offClick()
      cancelTick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, isDark])

  const shownIdx = hoverIdx ?? focusIdx
  const shownData = shownIdx !== null ? (() => {
    const i = shownIdx
    const startOffset = ((new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) + 6) % 7
    const dayNum = i - startOffset + 1
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    if (dayNum < 1 || dayNum > daysInMonth) return null
    const date = new Date(new Date().getFullYear(), new Date().getMonth(), dayNum)
    const evs = events.filter(e => dayKey(e.start) === dayKey(date))
    return { date, events: evs }
  })() : null

  return (
    <div
      ref={containerRef}
      className={`stage-3d-shell overflow-hidden rounded-2xl flex items-center justify-center mx-auto ${className || ''}`}
      style={{ height, position: 'relative', cursor: hoverIdx !== null || focusIdx !== null ? 'pointer' : 'grab', touchAction: 'pan-y' }}
    >
      {shownData && (
        <div className="pointer-events-none absolute left-3 top-2 z-10 max-w-[70%]">
          <span
            className="inline-flex flex-col rounded-xl border px-2.5 py-1.5 text-[11px] font-bold backdrop-blur-md"
            style={{
              color: isDark ? '#fff' : '#1c1917',
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.10)',
              backgroundColor: isDark ? 'rgba(10,14,30,0.78)' : 'rgba(255,255,255,0.86)',
              boxShadow: `0 8px 22px -12px ${accent.glow}`,
            }}
          >
            <span>{shownData.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            {shownData.events.length > 0 && (
              <span className="mt-0.5 text-[9.5px] font-semibold opacity-80">
                {shownData.events.length} rendez-vous · {shownData.events.map(e => e.title).slice(0, 2).join(', ')}
              </span>
            )}
            {shownData.events.length === 0 && (
              <span className="mt-0.5 text-[9.5px] font-semibold opacity-60">Aucun rendez-vous</span>
            )}
          </span>
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
          {focusIdx !== null ? 'cliquer pour relâcher' : 'glisser · survoler · cliquer un jour'}
        </span>
      </div>
    </div>
  )
}
