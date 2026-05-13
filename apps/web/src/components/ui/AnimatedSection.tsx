'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/animations/gsap'

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  animation?: 'fadeInUp' | 'scaleIn' | 'slideLeft'
  delay?: number
}

export function AnimatedSection({
  children,
  className,
  animation = 'fadeInUp',
  delay = 0,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const el = ref.current

    const fromVars: gsap.TweenVars =
      animation === 'scaleIn'
        ? { opacity: 0, scale: 0.9 }
        : animation === 'slideLeft'
          ? { opacity: 0, x: -50 }
          : { opacity: 0, y: 40 }

    const toVars: gsap.TweenVars = {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration: 0.7,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    }

    gsap.fromTo(el, fromVars, toVars)

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [animation, delay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
