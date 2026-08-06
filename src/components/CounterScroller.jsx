'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

// This page also runs Lenis (see SmoothScroll.jsx) for smooth-scroll. Lenis
// and framer-motion's own useScroll don't reconcile cleanly on this page —
// in production, the section's fade-out keyframes would visibly reverse and
// climb back to opacity 1 well past their intended range, leaving two
// products' images stacked on top of each other. Tracking progress
// ourselves off a plain scroll/resize listener (identical 'start start' ->
// 'end end' math) sidesteps whatever the two systems disagree about.
function useManualScrollProgress(trackRef) {
  const progress = useMotionValue(0);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    let frame = null;
    const update = () => {
      frame = null;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const raw = total > 0 ? -rect.top / total : 0;
      progress.set(Math.min(1, Math.max(0, raw)));
    };
    const onScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [trackRef, progress]);
  return progress;
}

// Scroll-scrubbed product showcase: the media panel pins while each
// product's poster frame yields to its own footage as you scroll it into
// the centre of the section, so the customer paces the reveal themselves
// (unlike the timed hero). Brownies and pastries reuse the same clips cut
// for the old 6-slide hero — they lost their slot when the hero trimmed to
// 3, so this is where that footage lives now instead of going unused.
// Parfait has no clip yet, so it cross-fades between its two stills instead.
const SHOWCASE = [
  {
    id: 'brownies',
    kicker: 'Brownie Boxes',
    title: 'Fudgy squares, five flavours deep',
    copy: 'Pick a box of 4, 6, 9 or 16 and finish it in Biscoff, Oreo, coconut crunch, white or dark chocolate.',
    href: '/product/brownie-box',
    cta: 'Build a Brownie Box',
    poster: '/uploads/hero-carousel/brownies-hold.webp',
    video: '/uploads/hero-carousel/brownies.mp4',
  },
  {
    id: 'pastries',
    kicker: 'Pastry Trays',
    title: 'Suya pie, fish pie, sausage rolls',
    copy: 'Golden pastries packed as a mixed tray or a full tray of your favourite, ready for the table.',
    href: '/product/mixed-pastry-tray',
    cta: 'Choose Your Pastries',
    poster: '/uploads/aries11-pastries-mixedtray-complete.webp',
    video: '/uploads/hero-carousel/pastries.mp4',
  },
  {
    id: 'parfait',
    kicker: 'Cake Parfait',
    title: 'Soft cake, cool cream, layered up',
    copy: 'Chocolate or red velvet cake layered with cream, made to order in two sizes.',
    href: '/product/cake-parfait',
    cta: 'Choose a Parfait',
    poster: '/uploads/aries11-caketreats-parfait-chocolate.png',
    secondFrame: '/uploads/aries11-caketreats-parfait-redvelvet.png',
    contain: true, // studio cutouts, not photos — letterbox them on cream instead of cropping
  },
];

function ScrubbedFrame({ product, index, count, progress, isActive, allowVideo }) {
  const start = index / count;
  const end = (index + 1) / count;
  const mid = (start + end) / 2;
  // Each product owns a slice of the scroll. Its poster fades in at the
  // segment start, its footage (video or second still) cross-fades across
  // the middle, and the whole pair yields to the next product at the end.
  const groupOpacity = useTransform(
    progress,
    [Math.max(0, start - 0.04), start + 0.02, end - 0.02, Math.min(1, end + 0.04)],
    [index === 0 ? 1 : 0, 1, 1, index === count - 1 ? 1 : 0],
  );
  const revealOpacity = useTransform(progress, [mid - 0.06, mid + 0.06], [0, 1]);
  const drift = useTransform(progress, [start, end], [12, -12]);
  const showVideo = Boolean(product.video) && allowVideo && isActive;

  return (
    <motion.div
      className={`counter-scroller__frame${product.contain ? ' is-contained' : ''}`}
      style={{ opacity: groupOpacity }}
      aria-hidden="true"
    >
      <motion.img src={product.poster} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" style={{ y: drift }} />
      {showVideo ? (
        <motion.video
          key={product.id}
          src={product.video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          style={{ y: drift, opacity: revealOpacity }}
        />
      ) : product.secondFrame ? (
        <motion.img src={product.secondFrame} alt="" loading="lazy" decoding="async" style={{ y: drift, opacity: revealOpacity }} />
      ) : null}
    </motion.div>
  );
}

export default function CounterScroller() {
  const trackRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const saveData = typeof navigator !== 'undefined' && Boolean(navigator.connection?.saveData);
  const scrollYProgress = useManualScrollProgress(trackRef);

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = Math.min(SHOWCASE.length - 1, Math.floor(value * SHOWCASE.length));
    setActive((current) => (current === next ? current : next));
  });

  if (reduceMotion) {
    return (
      <section className="container counter-scroller counter-scroller--static" aria-labelledby="counter-scroller-title">
        <div className="home-section__header">
          <div>
            <p className="home-section__kicker">More from the counter</p>
            <h2 id="counter-scroller-title">Worth the notice</h2>
          </div>
        </div>
        <div className="counter-scroller__static-grid">
          {SHOWCASE.map((product) => (
            <Link key={product.id} to={product.href} className="counter-scroller__static-card">
              <img src={product.poster} alt="" loading="lazy" decoding="async" />
              <strong>{product.kicker}</strong>
              <span>{product.copy}</span>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  const product = SHOWCASE[active];

  return (
    <section ref={trackRef} className="counter-scroller" aria-labelledby="counter-scroller-title">
      <div className="counter-scroller__viewport">
        <div className="container counter-scroller__inner">
          <div className="counter-scroller__copy">
            <p className="home-section__kicker">More from the counter</p>
            <h2 id="counter-scroller-title">Worth the notice</h2>
            <div className="counter-scroller__panel" aria-live="polite">
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <span className="counter-scroller__kicker">{product.kicker}</span>
                <h3>{product.title}</h3>
                <p>{product.copy}</p>
                <Link to={product.href} className="btn btn-primary">{product.cta}</Link>
              </motion.div>
            </div>
            <div className="counter-scroller__steps" aria-hidden="true">
              {SHOWCASE.map((item, index) => (
                <span key={item.id} className={index === active ? 'is-active' : ''} />
              ))}
            </div>
          </div>
          <div className="counter-scroller__media">
            {SHOWCASE.map((item, index) => (
              <ScrubbedFrame
                key={item.id}
                product={item}
                index={index}
                count={SHOWCASE.length}
                progress={scrollYProgress}
                isActive={index === active}
                allowVideo={!saveData}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
