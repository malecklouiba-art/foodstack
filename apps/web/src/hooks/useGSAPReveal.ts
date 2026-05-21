'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/animations/gsap';

interface RevealOptions {
  stagger?: number;
  duration?: number;
  y?: number;
  delay?: number;
}

export function useGSAPReveal<T extends HTMLElement = HTMLDivElement>(
  selector: string,
  options: RevealOptions = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const ctx = gsap.context(() => {
      gsap.from(selector, {
        opacity: 0,
        y: options.y ?? 30,
        stagger: options.stagger ?? 0.08,
        duration: options.duration ?? 0.5,
        delay: options.delay ?? 0,
        ease: 'power3.out',
        clearProps: 'all',
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return ref;
}
