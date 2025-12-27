import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './App.css'

function App() {
  const [started, setStarted] = useState(false)
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

    const material = new THREE.PointsMaterial({
      color: '#111111',
      size: 2.4,
      transparent: true,
      opacity: 0.9,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    let dissolveProgress = 0
    const clock = new THREE.Clock()

    const animate = () => {
      const delta = clock.getDelta()
      dissolveProgress = Math.min(dissolveProgress + delta * 0.6, 1)
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
      }

      geometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    window.addEventListener('resize', updateViewport)

    return () => {
      window.removeEventListener('resize', updateViewport)
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

  return (
    <main className={`app ${started ? 'is-dissolving' : ''}`}>
      <div className="frame">
        <h1 className="title">
          my app by <span className="title-name">Chris Carella</span>
        </h1>
        <div className="accent" aria-hidden="true" />
        <button
          className="start-button"
          type="button"
          onClick={() => setStarted(true)}
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
