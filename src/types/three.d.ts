/* Minimal ambient typings for the three.js APIs used by CrumpledPaper3D.
   Kept local (instead of @types/three) so this CRA + TS 4.9 setup never
   parses incompatible upstream .d.ts files again. */
declare module 'three' {
  export const ACESFilmicToneMapping: number

  export class Vector3 {
    x: number
    y: number
    z: number
    set(x: number, y: number, z: number): this
    fromBufferAttribute(attribute: BufferAttribute, index: number): this
    normalize(): this
    multiplyScalar(scalar: number): this
  }

  export class BufferAttribute {
    readonly count: number
    needsUpdate: boolean
    setXYZ(index: number, x: number, y: number, z: number): void
  }

  export class Float32BufferAttribute extends BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number)
  }

  export class BufferGeometry {
    getAttribute(name: string): BufferAttribute
    setAttribute(name: string, attribute: BufferAttribute): void
    computeVertexNormals(): void
    dispose(): void
    morphAttributes: { [name: string]: BufferAttribute[] }
  }

  export class IcosahedronGeometry extends BufferGeometry {
    constructor(radius?: number, detail?: number)
  }

  export class Object3D {
    visible: boolean
    traverse(callback: (object: Object3D) => void): void
  }

  export class Scene extends Object3D {
    add(...objects: Object3D[]): this
  }

  export class PerspectiveCamera extends Object3D {
    constructor(fov?: number, aspect?: number, near?: number, far?: number)
    aspect: number
    position: Vector3
    lookAt(x: number, y: number, z: number): void
    updateProjectionMatrix(): void
  }

  export class Light extends Object3D {
    position: Vector3
  }

  export class DirectionalLight extends Light {
    constructor(color?: number, intensity?: number)
  }

  export class AmbientLight extends Light {
    constructor(color?: number, intensity?: number)
  }

  export class Material {
    transparent: boolean
    opacity: number
    depthWrite: boolean
    dispose(): void
  }

  export class Group extends Object3D {
    rotation: Vector3
    position: Vector3
    scale: Vector3
    add(...objects: Object3D[]): this
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number)
  }

  export class Texture {
    colorSpace: number
    needsUpdate: boolean
    dispose(): void
  }

  export class CanvasTexture extends Texture {
    constructor(canvas: HTMLCanvasElement)
  }

  export const SRGBColorSpace: number

  export interface MeshStandardMaterialParameters {
    color?: number
    roughness?: number
    metalness?: number
    flatShading?: boolean
    vertexColors?: boolean
    map?: Texture
    transparent?: boolean
    opacity?: number
    depthWrite?: boolean
  }

  export class MeshStandardMaterial extends Material {
    constructor(parameters?: MeshStandardMaterialParameters)
    map?: Texture
  }

  export class Mesh extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material | Material[])
    geometry: BufferGeometry
    material: Material | Material[]
    rotation: Vector3
    position: Vector3
    scale: Vector3
    morphTargetInfluences: number[]
    readonly isMesh: boolean
  }

  export interface WebGLRendererParameters {
    antialias?: boolean
    alpha?: boolean
  }

  export class WebGLRenderer {
    constructor(parameters?: WebGLRendererParameters)
    domElement: HTMLCanvasElement
    toneMapping: number
    toneMappingExposure: number
    setPixelRatio(value: number): void
    setClearColor(color: number, alpha: number): void
    setSize(width: number, height: number, updateStyle?: boolean): void
    render(scene: Scene, camera: PerspectiveCamera): void
    dispose(): void
  }

  export class Clock {
    elapsedTime: number
    getDelta(): number
  }
}
