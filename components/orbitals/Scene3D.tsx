'use client'

/*
 * Real 3D for the figures that need it: lobes are solid, lit teardrops of
 * revolution with a pen outline (an inverted hull), atoms are spheres, bonds are
 * rods. Drag to turn it. Labels are handwriting laid over the canvas, and fade
 * when something is in front of their atom.
 */
import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import type { Phase } from './kit'

export type V3 = [number, number, number]
export type Item =
  | { k: 'atom'; p: V3; label: string; r?: number; tag?: string; tagInk?: 'blue' | 'red' | 'green' | 'pencil' }
  | { k: 'bond'; a: V3; b: V3; w?: number; opacity?: number }
  | { k: 'lobe'; o: V3; d: V3; L: number; W: number; phase: Phase; opacity?: number }
  | { k: 'band'; a: V3; b: V3; w: number; phase: Phase; opacity: number }

export type View = { yaw: number; pitch: number; n: number }

const D = 9 // camera distance, in units
const tone: Record<Phase, { wash: string; pen: string }> = {
  in: { wash: '#a7b7d9', pen: '#2c4674' },
  out: { wash: '#ecb1a4', pen: '#c0432d' },
  hyb: { wash: '#b9d2a8', pen: '#4f7a3f' },
  empty: { wash: '#dedad2', pen: '#858078' },
}

/* ---------------------------------------------------------------- shared pieces */

let gradient: THREE.DataTexture | null = null
/** three flat steps of light, so the shading reads as marker, not plastic */
function toonRamp() {
  if (gradient) return gradient
  gradient = new THREE.DataTexture(new Uint8Array([120, 190, 255]), 3, 1, THREE.RedFormat)
  gradient.minFilter = THREE.NearestFilter
  gradient.magFilter = THREE.NearestFilter
  gradient.needsUpdate = true
  return gradient
}

const lobeCache = new Map<string, THREE.LatheGeometry>()
/** a teardrop of revolution along +y, pinched at the nucleus (y = 0), round at the far end */
function lobeGeometry(L: number, R: number, grow = 0) {
  const key = `${L.toFixed(3)}:${R.toFixed(3)}:${grow}`
  let g = lobeCache.get(key)
  if (g) return g
  const n = 28
  const raw: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    raw.push(Math.pow(Math.sin(Math.PI * t), 0.8) * (0.45 + 0.55 * t))
  }
  const peak = Math.max(...raw)
  const pts = raw.map((r, i) => new THREE.Vector2((r / peak) * R + (i > 0 && i < n ? grow : 0), (i / n) * (L + grow * 1.5) - grow * 0.5))
  g = new THREE.LatheGeometry(pts, 36)
  lobeCache.set(key, g)
  return g
}

const spheres = new Map<number, THREE.SphereGeometry>()
const sphereGeo = (r: number) => {
  const k = Math.round(r * 1000)
  if (!spheres.has(k)) spheres.set(k, new THREE.SphereGeometry(r, 32, 20))
  return spheres.get(k)!
}
const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 14)
const up = new THREE.Vector3(0, 1, 0)

type Label = { el: HTMLSpanElement; p: THREE.Vector3; mesh: THREE.Mesh; tag?: HTMLSpanElement }

function disposeAll(root: THREE.Group) {
  // geometries are cached and shared, except the π clouds, which own theirs
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      ;(o.material as THREE.Material).dispose()
      if (o.userData.own) o.geometry.dispose()
    }
  })
  root.clear()
}

/** `S` is px per unit, at the width the figure is designed for */
function build(items: Item[], root: THREE.Group, overlay: HTMLDivElement, S: number) {
  disposeAll(root)
  overlay.replaceChildren()
  const labels: Label[] = []
  const ramp = toonRamp()
  const v = (p: V3) => new THREE.Vector3(...p)

  for (const it of items) {
    if (it.k === 'lobe') {
      const L = it.L / S
      const R = (it.W * 0.8) / S
      const op = it.opacity ?? 1
      const g = new THREE.Group()
      const body = new THREE.Mesh(lobeGeometry(L, R), new THREE.MeshToonMaterial({ color: tone[it.phase].wash, gradientMap: ramp, transparent: op < 1, opacity: op }))
      body.userData.solid = true
      const hull = new THREE.Mesh(lobeGeometry(L, R, 0.018), new THREE.MeshBasicMaterial({ color: tone[it.phase].pen, side: THREE.BackSide, transparent: op < 1, opacity: op }))
      g.add(hull, body)
      g.position.copy(v(it.o))
      g.quaternion.setFromUnitVectors(up, v(it.d).normalize())
      root.add(g)
    } else if (it.k === 'atom') {
      const r = (it.r ?? 15) / S
      const g = new THREE.Group()
      const ball = new THREE.Mesh(sphereGeo(r), new THREE.MeshToonMaterial({ color: '#fdfcf8', gradientMap: ramp }))
      ball.userData.solid = true
      const hull = new THREE.Mesh(sphereGeo(r + 0.016), new THREE.MeshBasicMaterial({ color: '#1f1e1c', side: THREE.BackSide }))
      g.add(hull, ball)
      g.position.copy(v(it.p))
      root.add(g)
      const el = document.createElement('span')
      el.className = 'orb-3d-label'
      el.textContent = it.label
      el.style.fontSize = `${Math.round(r * S * 1.2)}px`
      overlay.appendChild(el)
      let tag: HTMLSpanElement | undefined
      if (it.tag) {
        tag = document.createElement('span')
        tag.className = `orb-3d-tag orb-ink--${it.tagInk ?? 'pencil'}`
        tag.textContent = it.tag
        overlay.appendChild(tag)
      }
      labels.push({ el, p: v(it.p), mesh: ball, tag })
    } else if (it.k === 'bond') {
      const op = it.opacity ?? 1
      const m = new THREE.Mesh(rodGeo, new THREE.MeshBasicMaterial({ color: '#1f1e1c', transparent: op < 1, opacity: op }))
      const a = v(it.a)
      const d = v(it.b).sub(a)
      const r = (it.w ?? 2.2) * 0.0095
      m.position.copy(a).addScaledVector(d, 0.5)
      m.quaternion.setFromUnitVectors(up, d.clone().normalize())
      m.scale.set(r, d.length(), r)
      root.add(m)
    } else {
      // a π cloud joining two lobes: a soft, see-through sausage
      if (it.opacity < 0.01) continue
      const a = v(it.a)
      const b = v(it.b)
      const m = new THREE.Mesh(
        new THREE.CapsuleGeometry(it.w / S / 2, Math.max(0.001, a.distanceTo(b)), 8, 20),
        new THREE.MeshBasicMaterial({ color: tone[it.phase].pen, transparent: true, opacity: it.opacity * 0.7, depthWrite: false }),
      )
      m.position.copy(a).lerp(b, 0.5)
      m.quaternion.setFromUnitVectors(up, new THREE.Vector3().subVectors(b, a).normalize())
      m.renderOrder = 2
      m.userData.own = true
      root.add(m)
    }
  }
  return labels
}

/* ---------------------------------------------------------------- the component */

export default function Scene3D({
  items,
  width = 560,
  height = 300,
  view,
  spin = true,
  label,
  onGrab,
  children,
  scale: S = 104,
}: {
  items: Item[]
  width?: number
  height?: number
  /** change `n` to fly the camera to a new yaw and pitch */
  view: View
  spin?: boolean
  label: string
  onGrab?: () => void
  children?: ReactNode
  /** px per unit: smaller fits a longer molecule */
  scale?: number
}) {
  const reduce = useReducedMotion()
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const three = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    root: THREE.Group
    labels: Label[]
    dirty: boolean
  } | null>(null)
  const cam = useRef({ yaw: view.yaw, pitch: view.pitch })
  const fly = useRef<{ from: { yaw: number; pitch: number }; dy: number; dp: number; t0: number } | null>(null)
  const grabbed = useRef(false)
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null)
  const spinRef = useRef(spin)
  spinRef.current = spin && !reduce
  const itemsRef = useRef(items)
  itemsRef.current = items

  // the renderer lives as long as the figure does
  useEffect(() => {
    const cv = canvas.current!
    const el = wrap.current!
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true })
    } catch {
      return // no WebGL: the caption and controls still work
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    const scene = new THREE.Scene()
    const fov = (2 * Math.atan(height / S / 2 / D) * 180) / Math.PI
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100)
    camera.position.set(0, 0, D)
    scene.add(new THREE.AmbientLight('#ffffff', 1.6))
    const sun = new THREE.DirectionalLight('#ffffff', 2.4)
    sun.position.set(-3, 5, 6)
    scene.add(sun)
    const root = new THREE.Group()
    scene.add(root)
    three.current = { renderer, scene, camera, root, labels: build(itemsRef.current, root, overlay.current!, S), dirty: true }

    const resize = () => {
      const w = el.clientWidth
      renderer.setSize(w, (w * height) / width, false)
      if (three.current) three.current.dirty = true
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    let visible = false
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && three.current) three.current.dirty = true
    })
    io.observe(el)

    const ray = new THREE.Raycaster()
    const tmp = new THREE.Vector3()
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = three.current
      if (!t || !visible) return
      const f = fly.current
      if (f) {
        const k = Math.min(1, (now - f.t0) / 750)
        const e = 1 - Math.pow(1 - k, 3)
        cam.current = { yaw: f.from.yaw + f.dy * e, pitch: f.from.pitch + f.dp * e }
        if (k >= 1) fly.current = null
        t.dirty = true
      } else if (spinRef.current && !grabbed.current) {
        cam.current.yaw += dt * 0.35
        t.dirty = true
      }
      if (!t.dirty) return
      t.dirty = false
      t.root.rotation.set(cam.current.pitch, cam.current.yaw, 0, 'XYZ')
      t.root.updateMatrixWorld(true)
      t.renderer.render(t.scene, t.camera)

      // lay the handwriting over the atoms
      const w = el.clientWidth
      const h = (w * height) / width
      const k = w / width
      const tagX: number[] = []
      for (const l of t.labels) {
        const world = l.p.clone().applyMatrix4(t.root.matrixWorld)
        tmp.copy(world).project(t.camera)
        const x = (tmp.x * 0.5 + 0.5) * w
        const y = (-tmp.y * 0.5 + 0.5) * h
        l.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -52%) scale(${Math.max(k, 0.7)})`
        // behind a lobe or another atom? then the label fades back
        ray.set(t.camera.position, world.clone().sub(t.camera.position).normalize())
        const hit = ray.intersectObjects(t.root.children, true).find((i) => i.object.userData.solid)
        const blocked = hit && hit.object !== l.mesh && hit.distance < t.camera.position.distanceTo(world) - 0.12
        l.el.style.opacity = blocked ? '0.15' : '1'
        if (l.tag) {
          const clash = tagX.some((p) => Math.abs(p - x) < 34 * k)
          l.tag.style.opacity = clash ? '0' : '1'
          if (!clash) tagX.push(x)
          l.tag.style.transform = `translate(${x}px, ${h - 22 * k}px) translate(-50%, -50%)`
        }
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      disposeAll(root)
      renderer.dispose()
      three.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, S])

  // rebuild the scene whenever the molecule changes
  useEffect(() => {
    const t = three.current
    if (!t || !overlay.current) return
    t.labels = build(items, t.root, overlay.current, S)
    t.dirty = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  // fly to a new view
  useEffect(() => {
    const from = { ...cam.current }
    if (reduce) {
      cam.current = { yaw: view.yaw, pitch: view.pitch }
      if (three.current) three.current.dirty = true
      return
    }
    let dy = (view.yaw - from.yaw) % (Math.PI * 2)
    if (dy > Math.PI) dy -= Math.PI * 2
    if (dy < -Math.PI) dy += Math.PI * 2
    fly.current = { from, dy, dp: view.pitch - from.pitch, t0: performance.now() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.n])

  return (
    <div
      ref={wrap}
      className="orb-3d"
      style={{ aspectRatio: `${width} / ${height}` }}
      role="img"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { x: e.clientX, y: e.clientY, ...cam.current }
        grabbed.current = true
        fly.current = null
        onGrab?.()
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        cam.current = {
          yaw: d.yaw + (e.clientX - d.x) * 0.012,
          pitch: Math.max(-1.3, Math.min(1.3, d.pitch + (e.clientY - d.y) * 0.012)),
        }
        if (three.current) three.current.dirty = true
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <canvas ref={canvas} className="orb-3d-canvas" />
      <div ref={overlay} className="orb-3d-overlay" aria-hidden />
      {children && (
        <svg viewBox={`0 0 ${width} ${height}`} className="orb-3d-svg" aria-hidden>
          {children}
        </svg>
      )}
    </div>
  )
}
