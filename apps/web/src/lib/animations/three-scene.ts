import * as THREE from 'three'

export { THREE }

export function createFoodParticles(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
  camera.position.z = 5

  const geometry = new THREE.BufferGeometry()
  const count = 200
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 12
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: 0xff6b35,
    size: 0.06,
    transparent: true,
    opacity: 0.75,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  let frameId: number

  function animate() {
    frameId = requestAnimationFrame(animate)
    points.rotation.y += 0.001
    points.rotation.x += 0.0005
    renderer.render(scene, camera)
  }

  animate()

  function resize() {
    camera.aspect = canvas.clientWidth / canvas.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  }

  window.addEventListener('resize', resize)

  return {
    dispose() {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    },
  }
}
