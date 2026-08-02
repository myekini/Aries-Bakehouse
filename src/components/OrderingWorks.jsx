'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const STEP_MS = 2800;

const ORDER_STEPS = [
  {
    title: 'Choose your treat',
    copy: 'Browse the menu and pick a loaf, platter, pastry tray, brownie box, or cake treat.',
  },
  {
    title: 'Set the details',
    copy: 'Choose the available topping, size, quantity, date, and delivery or pickup option.',
  },
  {
    title: 'Checkout securely',
    copy: 'Pay online with Paystack. WhatsApp remains available only when you need support.',
  },
];

export default function OrderingWorks() {
  const rootRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const step = ORDER_STEPS[active];

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || paused || !inView) return undefined;

    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % ORDER_STEPS.length);
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [active, inView, paused, reduceMotion]);

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
  }

  function handleTabKeyDown(event, index) {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % ORDER_STEPS.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + ORDER_STEPS.length) % ORDER_STEPS.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = ORDER_STEPS.length - 1;
    setActive(next);
    document.getElementById(`ordering-tab-${next}`)?.focus();
  }

  return (
    <section ref={rootRef} className="ordering-works" aria-labelledby="ordering-title">
      <div className="container ordering-works__inner">
        <div className="ordering-works__intro">
          <p className="home-section__kicker">Simple from start to finish</p>
          <h2 id="ordering-title">How ordering works</h2>
          <p>Three clear decisions, then the kitchen takes over.</p>
        </div>

        <div
          className="ordering-works__panel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={handleBlur}
        >
          <div className="ordering-works__tabs" role="tablist" aria-label="Ordering steps">
            {ORDER_STEPS.map((item, index) => (
              <button
                key={item.title}
                id={`ordering-tab-${index}`}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-controls="ordering-step-panel"
                tabIndex={index === active ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{item.title}</strong>
              </button>
            ))}
          </div>

          <div
            id="ordering-step-panel"
            className="ordering-works__active"
            role="tabpanel"
            aria-labelledby={`ordering-tab-${active}`}
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={step.title}
                initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : -8 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
              >
                <span className="ordering-works__count">Step {active + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="ordering-works__progress" aria-hidden="true">
            {ORDER_STEPS.map((item, index) => (
              <span key={item.title} className={index <= active ? 'is-active' : ''} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
