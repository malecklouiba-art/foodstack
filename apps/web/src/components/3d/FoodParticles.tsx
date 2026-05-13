'use client'

import { useEffect, useRef } from 'react'
import { createFoodParticles } from '@/lib/animations/three-scene'

interface FoodParticlesProps {
  className?: string
}

export function FoodParticles({ className }: FoodParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const scene = createFoodParticles(canvasRef.current)
    return () => scene.dispose()
  }, [])

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} />
}
