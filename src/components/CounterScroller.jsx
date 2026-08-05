'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

// Scroll-scrubbed product showcase: the media panel pins while each
// product cross-fades from its first frame to its second as you scroll,
// so the customer paces the reveal themselves (unlike the timed hero).
// To use dedicated transition footage, swap each product's `frames` pair
// for its two transition stills — same filenames, nothing else changes.
const SHOWCASE = [
  {
    id: 'brownies',
    kicker: 'Brownie Boxes',
    title: 'Fudgy squares, five flavours deep',
    copy: 'Pick a box of 4, 6, 9 or 16 and finish it in Biscoff, Oreo, coconut crunch, white or dark chocolate.',
    href: '/product/brownie-box',
    cta: 'Build a Brownie Box',
    frames: ['/uploads/hero-carousel/brownies-hold.webp', '/uploads/aries11-brownies-box-9-biscoff.webp'],
  },
  {
    id: 'pastries',
    kicker: 'Pastry Trays',
    title: 'Suya pie, fish pie, sausage rolls',
    copy: 'Golden pastries packed as a mixed tray or a full tray of your favourite, ready for the table.',
    href: '/product/mixed-pastry-tray',
    cta: 'Choose Your Pastries',
    frames: ['/uploads/aries11-pastries-mixedtray-complete.webp', '/uploads/aries11-pastries-suyapie-single.webp'],
  },
  {
    id: 'parfait',
    kicker: 'Cake Parfait',
    title: 'Soft cake, cool cream, layered up',
    copy: 'Chocolate or red velvet cake layered with cream, made to order in two sizes.',
    href: '/product/cake-parfait',
    cta: 'Choose a Parfait',
    frames: ['/uploads/aries11-caketreats-parfait-chocolate.png', '/uploads/aries11-caketreats-parfait-redvelvet.png'],
    contain: true, // studio cutouts, not photos — letterbox them on cream instead of cropping
  },
];

function ScrubbedFrame({ product, index, progress }) {
  const count = SHOWCASE.length;
  const start = index / count;
  const end = (index + 1) / count;
  const mid = (start + end) / 2;
  // Each product owns a third of the scroll. Its first frame fades in at
  // the segment start, cross-fades to the second frame across the middle,
  // and the whole pair yields to the next product at the segment end.
  const groupOpacity = useTransform(
    progress,
    [Math.max(0, start - 0.04), start + 0.02, end - 0.02, Math.min(1, end + 0.04)],
    [index === 0 ? 1 : 0, 1, 1, index === count - 1 ? 1 : 0],
  );
  const frameTwoOpacity = useTransform(progress, [mid - 0.06, mid + 0.06], [0, 1]);
  const drift = useTransform(progress, [start, end], [12, -12]);

  return (
    <motion.div
      className={`counter-scroller__frame${product.contain ? ' is-contained' : ''}`}
      style={{ opacity: groupOpacity }}
      aria-hidden="true"
    >
      <motion.img src={product.frames[0]} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" style={{ y: drift }} />
      <motion.img src={product.frames[1]} alt="" loading="lazy" decoding="async" style={{ y: drift, opacity: frameTwoOpacity }} />
    </motion.div>
  );
}

export default function CounterScroller() {
  const trackRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });

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
              <img src={product.frames[0]} alt="" loading="lazy" decoding="async" />
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
              <ScrubbedFrame key={item.id} product={item} index={index} progress={scrollYProgress} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
