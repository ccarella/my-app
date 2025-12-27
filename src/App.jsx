import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './App.css'

function App() {
  const [started, setStarted] = useState(false)
  const [isDissolving, setIsDissolving] = useState(false)
  const stageRef = useRef(null)
  const animationRef = useRef(null)
  const rendererRef = useRef(null)

  useEffect(() => {
    if (!started || !stageRef.current) {
      return undefined
    }

    const stage = stageRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 2000)
    camera.position.z = 400

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    rendererRef.current = renderer
    stage.appendChild(renderer.domElement)

    const updateViewport = () => {
      const { innerWidth: width, innerHeight: height } = window
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    updateViewport()

    const getViewportBounds = () => {
      const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
      const width = height * camera.aspect
      return { width, height }
    }

    const { width: worldWidth, height: worldHeight } = getViewportBounds()
    const spacing = 18
    const columns = Math.floor(worldWidth / spacing)
    const rows = Math.floor(worldHeight / spacing)
    const particleCount = Math.max(columns * rows, 600)

    const positions = new Float32Array(particleCount * 3)
    const initialPositions = new Float32Array(particleCount * 3)
    const targetPositions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    let index = 0
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        if (index >= particleCount) break
        const x = (col - columns / 2) * spacing
        const y = (row - rows / 2) * spacing
        const i3 = index * 3
        initialPositions[i3] = x
        initialPositions[i3 + 1] = y
        initialPositions[i3 + 2] = 0
        targetPositions[i3] = THREE.MathUtils.randFloatSpread(worldWidth)
        targetPositions[i3 + 1] = THREE.MathUtils.randFloatSpread(worldHeight)
        targetPositions[i3 + 2] = THREE.MathUtils.randFloatSpread(200)
        velocities[i3] = THREE.MathUtils.randFloatSpread(0.6)
        velocities[i3 + 1] = THREE.MathUtils.randFloatSpread(0.6)
        velocities[i3 + 2] = THREE.MathUtils.randFloatSpread(0.3)
        positions[i3] = initialPositions[i3]
        positions[i3 + 1] = initialPositions[i3 + 1]
        positions[i3 + 2] = initialPositions[i3 + 2]
        index += 1
      }
    }

    for (let i = index; i < particleCount; i += 1) {
      const i3 = i * 3
      initialPositions[i3] = THREE.MathUtils.randFloatSpread(worldWidth)
      initialPositions[i3 + 1] = THREE.MathUtils.randFloatSpread(worldHeight)
      initialPositions[i3 + 2] = 0
      targetPositions[i3] = THREE.MathUtils.randFloatSpread(worldWidth)
      targetPositions[i3 + 1] = THREE.MathUtils.randFloatSpread(worldHeight)
      targetPositions[i3 + 2] = THREE.MathUtils.randFloatSpread(200)
      velocities[i3] = THREE.MathUtils.randFloatSpread(0.6)
      velocities[i3 + 1] = THREE.MathUtils.randFloatSpread(0.6)
      velocities[i3 + 2] = THREE.MathUtils.randFloatSpread(0.3)
      positions[i3] = initialPositions[i3]
      positions[i3 + 1] = initialPositions[i3 + 1]
      positions[i3 + 2] = initialPositions[i3 + 2]
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const colors = new Float32Array(particleCount * 3)
    const color = new THREE.Color()
    const randomizeColors = () => {
      for (let i = 0; i < particleCount; i += 1) {
        color.setHSL(Math.random(), 0.75, 0.6)
        const i3 = i * 3
        colors[i3] = color.r
        colors[i3 + 1] = color.g
        colors[i3 + 2] = color.b
      }
      geometry.attributes.color.needsUpdate = true
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    randomizeColors()

    const material = new THREE.PointsMaterial({
      size: 2.4,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    let dissolveProgress = 0
    let dissolveTarget = 1
    const clock = new THREE.Clock()
    const behaviorTargets = new Float32Array(particleCount * 3)
    let behaviorActive = false
    let behaviorEndsAt = 0
    const behaviorDuration = 2400

    const applyBehavior = (behavior, center) => {
      const bounds = getViewportBounds()
      const size = Math.min(bounds.width, bounds.height)

      if (behavior === 'swarm') {
        for (let i = 0; i < particleCount; i += 1) {
          const i3 = i * 3
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * size * 0.18
          behaviorTargets[i3] = center.x + Math.cos(angle) * radius
          behaviorTargets[i3 + 1] = center.y + Math.sin(angle) * radius
          behaviorTargets[i3 + 2] = THREE.MathUtils.randFloatSpread(120)
        }
      }

      if (behavior === 'circle') {
        const radius = size * 0.28
        for (let i = 0; i < particleCount; i += 1) {
          const i3 = i * 3
          const angle = (i / particleCount) * Math.PI * 2
          behaviorTargets[i3] = center.x + Math.cos(angle) * radius
          behaviorTargets[i3 + 1] = center.y + Math.sin(angle) * radius
          behaviorTargets[i3 + 2] = THREE.MathUtils.randFloatSpread(80)
        }
      }

      if (behavior === 'line') {
        const angle = Math.random() * Math.PI
        const length = size * 0.7
        const dx = Math.cos(angle) * length
        const dy = Math.sin(angle) * length
        for (let i = 0; i < particleCount; i += 1) {
          const i3 = i * 3
          const t = i / (particleCount - 1) - 0.5
          behaviorTargets[i3] = center.x + dx * t
          behaviorTargets[i3 + 1] = center.y + dy * t
          behaviorTargets[i3 + 2] = THREE.MathUtils.randFloatSpread(60)
        }
      }

      if (behavior === 'triangle') {
        const radius = size * 0.28
        const vertices = Array.from({ length: 3 }, (_, i) => {
          const angle = (i / 3) * Math.PI * 2 - Math.PI / 2
          return {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius,
          }
        })
        for (let i = 0; i < particleCount; i += 1) {
          const i3 = i * 3
          const t = i / particleCount
          const edge = Math.floor(t * 3)
          const edgeT = (t * 3) % 1
          const start = vertices[edge]
          const end = vertices[(edge + 1) % 3]
          behaviorTargets[i3] = THREE.MathUtils.lerp(start.x, end.x, edgeT)
          behaviorTargets[i3 + 1] = THREE.MathUtils.lerp(start.y, end.y, edgeT)
          behaviorTargets[i3 + 2] = THREE.MathUtils.randFloatSpread(40)
        }
      }

      behaviorActive = true
      behaviorEndsAt = performance.now() + behaviorDuration
    }

    const screenToWorld = (x, y) => {
      const { innerWidth, innerHeight } = window
      const ndc = new THREE.Vector3(
        (x / innerWidth) * 2 - 1,
        -(y / innerHeight) * 2 + 1,
        0.5
      )
      ndc.unproject(camera)
      const direction = ndc.sub(camera.position).normalize()
      const distance = -camera.position.z / direction.z
      return camera.position.clone().add(direction.multiplyScalar(distance))
    }

    const triggerRandomBehavior = (event) => {
      if (dissolveProgress < 1) {
        return
      }
      const behaviors = ['swarm', 'circle', 'line', 'triangle']
      const behavior = behaviors[Math.floor(Math.random() * behaviors.length)]
      const position = screenToWorld(event.clientX, event.clientY)
      applyBehavior(behavior, position)
    }

    let lastTapAt = 0
    const handlePointerDown = (event) => {
      const now = performance.now()
      if (now - lastTapAt < 320) {
        dissolveTarget = 0
        behaviorActive = false
        setIsDissolving(false)
        setStarted(false)
        lastTapAt = 0
        return
      }
      lastTapAt = now
      if (dissolveProgress >= 1) {
        randomizeColors()
        triggerRandomBehavior(event)
      }
    }

    const animate = () => {
      const delta = clock.getDelta()
      if (dissolveTarget === 1) {
        dissolveProgress = Math.min(dissolveProgress + delta * 0.6, 1)
      } else {
        dissolveProgress = Math.max(dissolveProgress - delta * 0.7, 0)
      }
      const ease = dissolveProgress * (2 - dissolveProgress)

      for (let i = 0; i < particleCount; i += 1) {
        const i3 = i * 3
        if (dissolveProgress < 1) {
          positions[i3] =
            initialPositions[i3] + (targetPositions[i3] - initialPositions[i3]) * ease
          positions[i3 + 1] =
            initialPositions[i3 + 1] +
            (targetPositions[i3 + 1] - initialPositions[i3 + 1]) * ease
          positions[i3 + 2] =
            initialPositions[i3 + 2] +
            (targetPositions[i3 + 2] - initialPositions[i3 + 2]) * ease
        } else if (behaviorActive) {
          positions[i3] += (behaviorTargets[i3] - positions[i3]) * 0.07
          positions[i3 + 1] += (behaviorTargets[i3 + 1] - positions[i3 + 1]) * 0.07
          positions[i3 + 2] += (behaviorTargets[i3 + 2] - positions[i3 + 2]) * 0.07
        } else {
          positions[i3] += velocities[i3]
          positions[i3 + 1] += velocities[i3 + 1]
          positions[i3 + 2] += velocities[i3 + 2]
        }
      }

      if (dissolveProgress >= 1) {
        const bounds = getViewportBounds()
        const halfWidth = bounds.width / 2
        const halfHeight = bounds.height / 2

        for (let i = 0; i < particleCount; i += 1) {
          const i3 = i * 3
          if (positions[i3] > halfWidth) positions[i3] = -halfWidth
          if (positions[i3] < -halfWidth) positions[i3] = halfWidth
          if (positions[i3 + 1] > halfHeight) positions[i3 + 1] = -halfHeight
          if (positions[i3 + 1] < -halfHeight) positions[i3 + 1] = halfHeight
        }

        if (behaviorActive && performance.now() > behaviorEndsAt) {
          behaviorActive = false
        }
      }

      geometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    window.addEventListener('resize', updateViewport)
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('pointerdown', handlePointerDown)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      scene.clear()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [started])

  const handleStart = () => {
    setStarted(true)
    setIsDissolving(true)
  }

  return (
    <main className={`app ${isDissolving ? 'is-dissolving' : ''}`}>
      <div className="frame">
        <h1 className="title">
          my app by <span className="title-name">Chris Carella</span>
        </h1>
        <div className="accent" aria-hidden="true" />
        <button
          className="start-button"
          type="button"
          onClick={handleStart}
          disabled={started}
        >
          START
        </button>
      </div>
      <div className="particle-stage" ref={stageRef} aria-hidden="true" />
    </main>
  )
}

export default App
