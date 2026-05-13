'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })

interface SplineSceneProps {
  sceneUrl: string
  className?: string
  fallback?: React.ReactNode
}

export function SplineScene({ sceneUrl, className, fallback }: SplineSceneProps) {
  return (
    <Suspense fallback={fallback ?? <div className="h-full w-full animate-pulse bg-gray-100 rounded-xl" />}>
      <Spline scene={sceneUrl} className={className} />
    </Suspense>
  )
}
