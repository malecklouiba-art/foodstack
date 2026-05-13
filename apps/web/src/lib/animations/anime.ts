import { animate, createTimeline } from 'animejs'

export { animate, createTimeline }

export function pulseAnimation(targets: string | Element) {
  return animate(targets, {
    scale: [1, 1.05, 1],
    duration: 600,
    ease: 'inOutSine',
  })
}

export function slideInLeft(targets: string | Element, delay = 0) {
  return animate(targets, {
    translateX: [-60, 0],
    opacity: [0, 1],
    duration: 700,
    delay,
    ease: 'outExpo',
  })
}

export function cartBounce(targets: string | Element) {
  return animate(targets, {
    translateY: [0, -12, 0, -6, 0],
    duration: 800,
    ease: 'outBounce',
  })
}

export function numberCount(
  targets: string | Element,
  from: number,
  to: number,
  duration = 1000,
  onUpdate?: (value: number) => void
) {
  const obj = { value: from }
  return animate(obj, {
    value: to,
    duration,
    ease: 'outQuad',
    onUpdate: () => onUpdate?.(Math.round(obj.value)),
  })
}
