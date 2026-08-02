'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getVariantRules } from '../lib/catalog.js';
import { ingredientKindFor } from '../lib/variantPresentation.js';
import SwatchPicker from './SwatchPicker.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';

const VARIANT_MS = 3200;

const FALLBACK_TOPPINGS = [
  { id: 'plain', label: 'Plain', image: '/uploads/aries11-bananabread-topping-plain.png', color: 'var(--color-caramel)' },
  { id: 'oreo', label: 'Oreo', image: '/uploads/aries11-bananabread-topping-oreo.png', color: 'var(--color-choc)' },
  { id: 'double-chocolate', label: 'Double Chocolate', image: '/uploads/aries11-bananabread-topping-doublechocolate.png', color: 'var(--color-cocoa)' },
  { id: 'coconut-flakes', label: 'Coconut Flakes', image: '/uploads/aries11-bananabread-topping-coconutflakes.png', color: 'var(--color-panel-contrast)' },
  { id: 'nuts-crunch', label: 'Nuts Crunch', image: '/uploads/aries11-bananabread-topping-nutscrunch.png', color: 'var(--color-caramel)' },
  { id: 'biscoff', label: 'Biscoff', image: '/uploads/aries11-bananabread-topping-biscoff.png', color: 'var(--color-olive)' },
  { id: 'raisins', label: 'Raisins', image: '/uploads/aries11-bananabread-topping-raisins.png', color: 'var(--color-error)' },
];

export default function SignatureLoafSpotlight({
  badge = 'Signature bake',
  title = 'One loaf, seven finishes.',
  description = 'Pick the topping that suits the moment. Every option is baked to order, with size and quantity configured on the product page.',
  ctaLabel = 'Build your loaf',
  headingId = 'signature-loaf-title',
  className = '',
}) {
  const rootRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [toppings, setToppings] = useState(FALLBACK_TOPPINGS);
  const [activeId, setActiveId] = useState(FALLBACK_TOPPINGS[0].id);
  const [displayedTopping, setDisplayedTopping] = useState(FALLBACK_TOPPINGS[0]);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const activeTopping = useMemo(
    () => toppings.find((topping) => topping.id === activeId) || toppings[0],
    [activeId, toppings],
  );

  useEffect(() => {
    let cancelled = false;

    getVariantRules('signature-banana-bread', 'banana-bread')
      .then((rules) => {
        if (cancelled || !rules?.toppings?.length) return;
        setToppings(rules.toppings);
        setActiveId((current) => (
          rules.toppings.some((topping) => topping.id === current)
            ? current
            : rules.toppings[0].id
        ));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '160px 0px', threshold: 0.15 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeTopping || activeTopping.image === displayedTopping.image) return undefined;

    let cancelled = false;
    const preview = new window.Image();
    const showPreview = () => {
      if (!cancelled) setDisplayedTopping(activeTopping);
    };

    preview.onload = showPreview;
    preview.src = activeTopping.image;
    if (preview.complete) showPreview();

    return () => {
      cancelled = true;
      preview.onload = null;
    };
  }, [activeTopping, displayedTopping.image]);

  useEffect(() => {
    if (reduceMotion || paused || !inView || toppings.length < 2) return undefined;

    const timer = window.setTimeout(() => {
      const currentIndex = toppings.findIndex((topping) => topping.id === activeId);
      setActiveId(toppings[(currentIndex + 1) % toppings.length].id);
    }, VARIANT_MS);

    return () => window.clearTimeout(timer);
  }, [activeId, inView, paused, reduceMotion, toppings]);

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
  }

  return (
    <section ref={rootRef} className={`container signature-loaf ${className}`.trim()} aria-labelledby={headingId}>
      <div className="signature-loaf__inner">
        <div
          className="signature-loaf__media"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.img
              key={displayedTopping.image}
              src={displayedTopping.image}
              alt={`${displayedTopping.label} Aries 11 banana bread`}
              loading="lazy"
              decoding="async"
              initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: reduceMotion ? 1 : 0, scale: 1.01 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: 'easeOut' }}
            />
          </AnimatePresence>
          <div className="signature-loaf__variant-label">
            <span>Current topping</span>
            <strong>{displayedTopping.label}</strong>
          </div>
        </div>

        <div
          className="signature-loaf__body"
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={handleBlur}
        >
          <Badge variant="caramel">{badge}</Badge>
          <h2 id={headingId} className="signature-loaf__title">{title}</h2>
          <p className="signature-loaf__description">{description}</p>
          <div className="signature-loaf__picker">
            <SwatchPicker
              options={toppings.map(({ id, label, color }) => ({
                id,
                label,
                color,
                ingredient: ingredientKindFor(id),
              }))}
              value={activeTopping.id}
              onChange={setActiveId}
              ariaLabel="Choose a banana bread topping to preview"
            />
          </div>
          <dl className="signature-loaf__details">
            <div>
              <dt>Choice</dt>
              <dd>Seven toppings</dd>
            </div>
            <div>
              <dt>Timing</dt>
              <dd>24-hour preorder</dd>
            </div>
          </dl>
          <Button asChild>
            <Link to="/product/signature-banana-bread">{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
