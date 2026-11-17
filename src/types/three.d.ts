/* Minimal ambient typings for the three.js APIs used by CrumpledPaper3D
   and the premium Stage 3D chart scenes (RevenueBars3D, PipelineOrbit3D).
   Kept local (instead of @types/three) so this CRA + TS 4.9 setup never
   parses incompatible upstream .d.ts files again. */
declare module 'three' {
  export const ACESFilmicToneMapping: number
  export const AdditiveBlending: number
  export const NormalBlending: number
  export const SRGBColorSpace: number
  export const DoubleSide: number
  export const FrontSide: number

  export const MathUtils: {
    degToRad(deg: number): number
    clamp(value: number, min: number, max: number): number
    lerp(x: number, y: number, t: number): number
  }

  export class Vector2 {
    constructor(x?: number, y?: number)
    x: number
    y: number
    set(x: number, y: number): this
    clone(): Vector2
    copy(v: Vector2): this
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number)
    x: number
    y: number
    z: number
    set(x: number, y: number, z: number): this
    setScalar(scalar: number): this
    fromBufferAttribute(attribute: BufferAttribute, index: number): this
    clone(): Vector3
    copy(v: Vector3): this
    add(v: Vector3): this
    sub(v: Vector3): this
    addScaledVector(v: Vector3, scale: number): this
    length(): number
    lengthSq(): number
    normalize(): this
    applyQuaternion(q: Quaternion): this
    multiplyScalar(scalar: number): this
    lerp(v: Vector3, alpha: number): this
    distanceTo(v: Vector3): number
  }

  export class Quaternion {
    x: number
    y: number
    z: number
    w: number
    copy(q: Quaternion): this
    invert(): this
    setFromEuler(e: Vector3): this
  }
  export class Color {
    constructor(color?: number | string | Color)
    r: number
    g: number
    b: number
    set(color: number | string | Color): this
    copy(color: Color): this
    clone(): Color
    multiplyScalar(scalar: number): this
    lerp(color: Color, alpha: number): this
    getHexString(): string
  }

  export class BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean)
    readonly count: number
    needsUpdate: boolean
    getX(index: number): number
    getY(index: number): number
    getZ(index: number): number
    setX(index: number, x: number): void
    setY(index: number, y: number): void
    setZ(index: number, z: number): void
    setXYZ(index: number, x: number, y: number, z: number): void
  }

  export class Float32BufferAttribute extends BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number)
  }

  export class BufferGeometry {
    index: { count: number } | null
    getAttribute(name: string): BufferAttribute
    setAttribute(name: string, attribute: BufferAttribute): void
    setFromPoints(points: Vector3[] | Vector2[]): this
    setIndex(index: number[]): this
    setDrawRange(start: number, count: number): this
    computeVertexNormals(): void
    dispose(): void
    morphAttributes: { [name: string]: BufferAttribute[] }
  }

  export class CatmullRomCurve3 {
    constructor(points?: Vector3[], closed?: boolean, curveType?: string, tension?: number)
    getPoint(t: number, target?: Vector3): Vector3
    getPointAt(u: number, target?: Vector3): Vector3
    getPoints(divisions?: number): Vector3[]
  }

  export class LatheGeometry extends BufferGeometry {
    constructor(points: Vector2[], segments?: number, phiStart?: number, phiLength?: number)
  }

  export class TubeGeometry extends BufferGeometry {
    constructor(
      path: CatmullRomCurve3,
      tubularSegments?: number,
      radius?: number,
      radialSegments?: number,
      closed?: boolean
    )
  }

  export class IcosahedronGeometry extends BufferGeometry {
    constructor(radius?: number, detail?: number)
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number)
  }

  export class BoxGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, depth?: number, widthSegments?: number, heightSegments?: number, depthSegments?: number)
  }

  export class OctahedronGeometry extends BufferGeometry {
    constructor(radius?: number, detail?: number)
  }

  export class SphereGeometry extends BufferGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number)
  }

  export class CylinderGeometry extends BufferGeometry {
    constructor(radiusTop?: number, radiusBottom?: number, height?: number, radialSegments?: number, heightSegments?: number, openEnded?: boolean)
  }

  export class TorusGeometry extends BufferGeometry {
    constructor(radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number, arc?: number)
  }

  export class RingGeometry extends BufferGeometry {
    constructor(innerRadius?: number, outerRadius?: number, thetaSegments?: number, phiSegments?: number, thetaStart?: number, thetaLength?: number)
  }

  export class GridHelper extends Object3D {
    constructor(size?: number, divisions?: number, colorCenterLine?: number | string, colorGrid?: number | string)
    material: Material | Material[]
    position: Vector3
  }

  export class Object3D {
    visible: boolean
    children: Object3D[]
    position: Vector3
    rotation: Vector3
    quaternion: Quaternion
    scale: Vector3
    renderOrder: number
    userData: Record<string, any>
    lookAt(target: Vector3): void
    lookAt(x: number, y: number, z: number): void
    traverse(callback: (object: Object3D) => void): void
    add(...objects: Object3D[]): this
    remove(...objects: Object3D[]): this
    clear(): this
    clone(): this
    getWorldPosition(target?: Vector3): Vector3
    updateMatrixWorld(): void
  }

  export class Scene extends Object3D {}

  export class PerspectiveCamera extends Object3D {
    constructor(
      fov?: number,
      aspect?: number | { width?: number; height?: number },
      near?: number,
      far?: number
    )
    aspect: number
    fov: number
    near: number
    far: number
    updateProjectionMatrix(): void
  }

  export class Light extends Object3D {
    intensity: number
    color: Color
  }

  export class DirectionalLight extends Light {
    constructor(color?: number | Color | string, intensity?: number)
  }

  export class AmbientLight extends Light {
    constructor(color?: number | Color | string, intensity?: number)
  }

  export class HemisphereLight extends Light {
    constructor(skyColor?: number | Color | string, groundColor?: number | Color | string, intensity?: number)
  }

  export class PointLight extends Light {
    constructor(color?: number | Color | string, intensity?: number, distance?: number, decay?: number)
  }

  export class Material {
    transparent: boolean
    opacity: number
    depthWrite: boolean
    alphaTest: number
    blending: number
    side: number
    dispose(): void
    clone(): this
  }

  export interface MeshStandardMaterialParameters {
    color?: number | Color | string
    emissive?: number | Color | string
    emissiveIntensity?: number
    metalness?: number
    roughness?: number
    flatShading?: boolean
    vertexColors?: boolean
    map?: Texture | null
    emissiveMap?: Texture | null
    transparent?: boolean
    opacity?: number
    depthWrite?: boolean
    blending?: number
    side?: number
  }

  export class MeshStandardMaterial extends Material {
    constructor(parameters?: MeshStandardMaterialParameters)
    color: Color
    emissive: Color
    emissiveIntensity: number
    metalness: number
    roughness: number
    map: Texture | null
  }

  export interface MeshPhysicalMaterialParameters extends MeshStandardMaterialParameters {
    clearcoat?: number
    clearcoatRoughness?: number
  }

  export class MeshPhysicalMaterial extends MeshStandardMaterial {
    constructor(parameters?: MeshPhysicalMaterialParameters)
  }

  export interface MeshBasicMaterialParameters {
    color?: number | Color | string
    map?: Texture | null
    transparent?: boolean
    opacity?: number
    depthWrite?: boolean
    depthTest?: boolean
    blending?: number
    wireframe?: boolean
    side?: number
    vertexColors?: boolean
    toneMapped?: boolean
  }

  export class MeshBasicMaterial extends Material {
    constructor(parameters?: MeshBasicMaterialParameters)
    color: Color
    map: Texture | null
    wireframe: boolean
  }

  export interface SpriteMaterialParameters {
    map?: Texture | null
    color?: number | Color | string
    transparent?: boolean
    opacity?: number
    depthWrite?: boolean
    depthTest?: boolean
    alphaTest?: number
    blending?: number
    rotation?: number
    sizeAttenuation?: boolean
  }

  export class SpriteMaterial extends Material {
    constructor(parameters?: SpriteMaterialParameters)
    map: Texture | null
    color: Color
  }

  export interface LineBasicMaterialParameters {
    color?: number | Color | string
    transparent?: boolean
    opacity?: number
    depthWrite?: boolean
    depthTest?: boolean
    blending?: number
    linewidth?: number
  }

  export class LineBasicMaterial extends Material {
    constructor(parameters?: LineBasicMaterialParameters)
    color: Color
  }

  export interface PointsMaterialParameters {
    map?: Texture | null
    color?: number | Color | string
    size?: number
    sizeAttenuation?: boolean
    transparent?: boolean
    opacity?: number
    depthWrite?: boolean
    depthTest?: boolean
    blending?: number
    vertexColors?: boolean
  }

  export class PointsMaterial extends Material {
    constructor(parameters?: PointsMaterialParameters)
    map: Texture | null
    color: Color
    size: number
  }

  export class Line extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material)
    geometry: BufferGeometry
    material: Material
  }

  export class Points extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material)
    geometry: BufferGeometry
    material: Material
  }

  export class Mesh extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material | Material[])
    geometry: BufferGeometry
    material: Material | Material[]
    morphTargetInfluences: number[]
    readonly isMesh: boolean
  }

  export class Group extends Object3D {
    children: Object3D[]
  }

  export class Sprite extends Object3D {
    constructor(material?: SpriteMaterial)
    material: SpriteMaterial
  }

  export class Texture {
    colorSpace: number
    anisotropy: number
    needsUpdate: boolean
    dispose(): void
  }

  export class CanvasTexture extends Texture {
    constructor(canvas: HTMLCanvasElement)
  }

  export class Raycaster {
    constructor()
    setFromCamera(coords: Vector2, camera: PerspectiveCamera): void
    intersectObjects(objects: Object3D[], recursive?: boolean): { object: Object3D; distance?: number }[]
  }

  export interface WebGLRendererParameters {
    antialias?: boolean
    alpha?: boolean
    powerPreference?: string
  }

  export class WebGLRenderer {
    constructor(parameters?: WebGLRendererParameters)
    domElement: HTMLCanvasElement
    toneMapping: number
    toneMappingExposure: number
    outputColorSpace: number
    setPixelRatio(value: number): void
    setClearColor(color: number | Color | string, alpha?: number): void
    setSize(width: number, height: number, updateStyle?: boolean): void
    render(scene: Scene, camera: PerspectiveCamera): void
    dispose(): void
  }

  export class Clock {
    elapsedTime: number
    getDelta(): number
  }
}

declare module 'three/examples/jsm/geometries/RoundedBoxGeometry.js' {
  import type { BufferGeometry } from 'three'
  export class RoundedBoxGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, depth?: number, segments?: number, radius?: number)
  }
}
