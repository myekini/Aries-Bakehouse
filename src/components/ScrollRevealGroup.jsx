'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollRevealGroup({ children, className, selector = '[data-reveal-item]', style }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const items = gsap.utils.toArray(root.querySelectorAll(selector));
    if (items.length === 0) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(items, { autoAlpha: 1, y: 0, clearProps: 'transform,opacity,visibility' });
      return undefined;
    }

    const tween = gsap.fromTo(
      items,
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.25,
        ease: 'power2.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: root,
          start: 'top 82%',
          once: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [selector]);

  return (
    <div ref={rootRef} className={className} style={style}>
      {children}
    </div>
  );
}
