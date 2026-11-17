import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

export interface ThreeStageCtx {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  orbit: THREE.Group
}

type TickFn = (elapsed: number, dt: number) => void

export interface ThreeStageOptions {
  camPos: [number, number, number]
  lookAt?: [number, number, number]
  fov?: number
  /** Continuous idle yaw, in radians per second. */
  autoRotateSpeed?: number
  /** Gentle back-and-forth yaw added on top of the drag angle (radians). */
  swayAmplitude?: number
  /** Sway angular speed (radians per second). */
  swaySpeed?: number
  /** Clamp the drag angle around its origin. Omit for free rotation. */
  yawLimit?: number
  /** Clamp the vertical drag angle. Omit for free rotation. */
  pitchLimit?: number
  onDrag?: (dragging: boolean) => void
  /** When its `.current` is true, auto-rotation and idle sway are paused. */
  pausedRef?: React.RefObject<boolean>
}

type SphereFit = { kind: 'sphere'; radius: number; center: THREE.Vector3 }
type BoxFit = {
  kind: 'box'
  halfWidth: number
  halfHeight: number
  depth: number
  center: THREE.Vector3
}
type FitTarget = SphereFit | BoxFit

/**
 * useThreeStage — canvas lifecycle for the premium 3D chart scenes:
 * antialiased transparent renderer, damped drag-to-orbit with idle sway,
 * automatic camera fitting (so scenes never bleed out of their card),
 * ResizeObserver refit, visibility-bounded RAF, full disposal on unmount.
 */
export function useThreeStage(
  containerRef: React.RefObject<HTMLElement | null>,
  opts: ThreeStageOptions = { camPos: [0, 4.4, 7.6] }
): {
  orbitRef: React.RefObject<THREE.Group | null>
  addTick: (fn: TickFn) => () => void
  getCtx: () => ThreeStageCtx | null
  /** Fit the camera around a content sphere of `radius` centred on `center`. */
  fitTo: (radius: number, center?: THREE.Vector3) => void
  /** Fit the camera around a content box, using the card aspect ratio. */
  fitToBounds: (halfWidth: number, halfHeight: number, depth?: number, center?: THREE.Vector3) => void
} {
  const orbitRef = useRef<THREE.Group | null>(null)
  const ctxRef = useRef<ThreeStageCtx | null>(null)
  const ticksRef = useRef<TickFn[]>([])
  const fitRef = useRef<FitTarget | null>(null)
  const baseCamRef = useRef(new THREE.Vector3(...opts.camPos))
  const lookAtRef = useRef(new THREE.Vector3(...(opts.lookAt ?? [0, 0.9, 0])))

  const addTick = useCallback((fn: TickFn) => {
    ticksRef.current.push(fn)
    return () => {
      const i = ticksRef.current.indexOf(fn)
      if (i >= 0) ticksRef.current.splice(i, 1)
    }
  }, [])

  const registerFit = useCallback((fit: FitTarget) => {
    fitRef.current = fit
    const ctx = ctxRef.current
    if (ctx) applyFit(ctx.camera, fit, opts.lookAt ?? [0, 0.9, 0], baseCamRef.current, lookAtRef.current)
  }, [opts.lookAt])

  const fitTo = useCallback((radius: number, center?: THREE.Vector3) => {
    registerFit({
      kind: 'sphere',
      radius: Math.max(0.4, radius),
      center: center?.clone() ?? lookAtRef.current.clone(),
    })
  }, [registerFit])

  const fitToBounds = useCallback((halfWidth: number, halfHeight: number, depth = 1, center?: THREE.Vector3) => {
    registerFit({
      kind: 'box',
      halfWidth: Math.max(0.4, halfWidth),
      halfHeight: Math.max(0.4, halfHeight),
      depth: Math.max(0.1, depth),
      center: center?.clone() ?? lookAtRef.current.clone(),
    })
  }, [registerFit])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const lookAt = lookAtRef.current
    const baseCam = baseCamRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(opts.fov ?? 42, 1, 0.1, 120)
    camera.position.copy(baseCam)
    camera.lookAt(lookAt)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = 'pan-y'
    renderer.domElement.style.pointerEvents = 'none'
    container.appendChild(renderer.domElement)

    const orbit = new THREE.Group()
    scene.add(orbit)
    orbitRef.current = orbit
    ctxRef.current = { scene, camera, renderer, orbit }

    const ticks = ticksRef.current

    /* orbit state */
    let theta = 0
    let targetTheta = 0
    let phi = 0
    let targetPhi = 0
    let dragging = false
    let lastX = 0
    let lastY = 0
    const autoSpeed = opts.autoRotateSpeed ?? 0.12
    const swayAmplitude = opts.swayAmplitude ?? 0
    const swaySpeed = opts.swaySpeed ?? 0.35
    const yawLimit = opts.yawLimit
    const pitchLimit = opts.pitchLimit

    const fit = () => {
      const w = container.clientWidth || 1
      const h = container.clientHeight || 1
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      const saved = fitRef.current
      if (saved) applyFit(camera, saved, opts.lookAt ?? [0, 0.9, 0], baseCam, lookAt)
    }
    /* Defer the refit to the next frame: mutating the canvas inside the
       observer batch can retrigger it and trip the browser's
       "ResizeObserver loop completed with undelivered notifications" error. */
    let fitRaf = 0
    const scheduleFit = () => {
      cancelAnimationFrame(fitRaf)
      fitRaf = requestAnimationFrame(fit)
    }
    const ro = new ResizeObserver(scheduleFit)
    ro.observe(container)
    fit()

    const onPointerDown = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      container.setPointerCapture(e.pointerId)
      opts.onDrag?.(true)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      targetTheta += dx * 0.006
      if (yawLimit !== undefined) {
        targetTheta = THREE.MathUtils.clamp(targetTheta, -yawLimit, yawLimit)
      }
      targetPhi -= dy * 0.006
      if (pitchLimit !== undefined) {
        targetPhi = THREE.MathUtils.clamp(targetPhi, -pitchLimit, pitchLimit)
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      dragging = false
      try { container.releasePointerCapture(e.pointerId) } catch {}
      opts.onDrag?.(false)
    }
    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerup', onPointerUp)
    container.addEventListener('pointercancel', onPointerUp)

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = performance.now()
    const start = last
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (document.hidden) { last = performance.now(); return }
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const elapsed = (now - start) / 1000
      const paused = !!opts.pausedRef?.current
      if (!dragging && !reduce && autoSpeed && !paused) targetTheta += autoSpeed * dt
      theta += (targetTheta - theta) * Math.min(1, dt * 7)
      phi += (targetPhi - phi) * Math.min(1, dt * 7)
      const sway = reduce || paused ? 0 : Math.sin(elapsed * swaySpeed) * swayAmplitude
      orbit.rotation.y = theta + sway
      const idleX = reduce || paused ? 0 : Math.sin(elapsed * 0.42) * 0.014
      orbit.rotation.x = phi + idleX
      if (!paused) orbit.rotation.z = reduce ? 0 : Math.sin(elapsed * 0.31) * 0.008
      for (const t of ticks) t(elapsed, dt)
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(fitRaf)
      ticks.length = 0
      ro.disconnect()
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', onPointerUp)
      container.removeEventListener('pointercancel', onPointerUp)
      disposeObject3D(orbit)
      orbit.clear()
      renderer.dispose()
      renderer.domElement.remove()
      ctxRef.current = null
      orbitRef.current = null
      fitRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getCtx = useCallback(() => ctxRef.current, [])
  return { orbitRef, addTick, getCtx, fitTo, fitToBounds }
}

/* Camera fitting: keep the content box (or sphere) fully in frame at the
   current aspect ratio, with a little breathing room. The camera direction
   is preserved from the initial position. */
function applyFit(
  camera: THREE.PerspectiveCamera,
  fit: FitTarget,
  lookAtTuple: [number, number, number],
  baseCam?: THREE.Vector3,
  baseLookAt?: THREE.Vector3
) {
  const lookAt = baseLookAt?.clone() ?? new THREE.Vector3(...lookAtTuple)
  const origin = baseCam?.clone() ?? camera.position.clone()
  const dir = origin.clone().sub(lookAt)
  if (dir.lengthSq() < 1e-6) dir.set(0, 1, 1)
  dir.normalize()

  const vFov = THREE.MathUtils.degToRad(camera.fov)
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(camera.aspect, 0.001))
  const tanV = Math.max(0.08, Math.tan(vFov / 2))
  const tanH = Math.max(0.08, Math.tan(hFov / 2))

  let distance: number
  if (fit.kind === 'sphere') {
    const limit = Math.min(vFov, hFov) / 2
    distance = (fit.radius * 1.12) / Math.max(0.08, Math.sin(limit))
  } else {
    /* Account for the camera tilt: the box depth projects onto the vertical
       screen axis, so it contributes to the height budget. */
    const verticalExtent = fit.halfHeight + fit.depth * 0.3
    distance = Math.max(verticalExtent / tanV, fit.halfWidth / tanH) * 1.1
  }

  camera.position.copy(fit.center).addScaledVector(dir, distance)
  camera.lookAt(fit.center)
  camera.near = Math.max(0.1, distance * 0.05)
  camera.far = Math.max(50, distance * 4)
  camera.updateProjectionMatrix()
}

/* ------------------------------------------------------------------ */
/* Texture helpers — soft glow discs and crisp label sprites           */
/* ------------------------------------------------------------------ */

export function makeGlowTexture(size = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.32)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

export function makeLabelSprite(
  text: string,
  color: string,
  fontPx = 46,
  weight = 800,
  shadowColor = 'rgba(0,0,0,0.45)',
  shadowBlur = 6
): THREE.Sprite {
  const c = document.createElement('canvas')
  const ratio = 3
  const width = Math.max(72, Math.min(560, Math.round(text.length * fontPx * 0.66)))
  const height = Math.round(fontPx * 1.9)
  c.width = width * ratio
  c.height = height * ratio
  const ctx = c.getContext('2d')!
  ctx.scale(ratio, ratio)
  ctx.font = `${weight} ${fontPx}px Inter, "Segoe UI", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = shadowColor
  ctx.shadowBlur = shadowBlur
  ctx.fillStyle = color
  ctx.fillText(text, width / 2, height / 2 + 2)
  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 4
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(width / 120, height / 120, 1)
  return sprite
}

export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const mat = (mesh as unknown as { material?: THREE.Material | THREE.Material[] }).material
    if (mat) {
      const mats = Array.isArray(mat) ? mat : [mat]
      for (const m of mats) {
        const anyMat = m as THREE.Material & { map?: THREE.Texture | null }
        if (anyMat.map) anyMat.map.dispose()
        m.dispose()
      }
    }
  })
}
