import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, TextPlugin)
}

export { gsap, ScrollTrigger, TextPlugin }

export function fadeInUp(element: Element | string, delay = 0) {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.7, delay, ease: 'power3.out' }
  )
}

export function staggerFadeIn(elements: Element[] | string, stagger = 0.1) {
  return gsap.fromTo(
    elements,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.6, stagger, ease: 'power2.out' }
  )
}

export function scaleIn(element: Element | string, delay = 0) {
  return gsap.fromTo(
    element,
    { opacity: 0, scale: 0.85 },
    { opacity: 1, scale: 1, duration: 0.5, delay, ease: 'back.out(1.4)' }
  )
}
