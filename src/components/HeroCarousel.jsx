'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

const SLIDE_MS = 4600;

const HERO_SLIDES = [
  {
    eyebrow: 'Aries 11 Bakehouse',
    title: 'Freshly Made Treats for Every',
    accent: 'Craving',
    copy: 'Fresh banana bread, pastries, brownies, cake treats and small-chops platters, made to order in Abeokuta.',
    image: '/uploads/aries11-brand-collection-hero.webp',
    objectPosition: 'center',
    alt: 'Mixed Aries 11 Bakehouse product collection',
    href: '/menu',
    cta: 'Explore the Menu',
  },
  {
    eyebrow: 'Small Chops',
    title: 'Party trays that arrive ready to',
    accent: 'Share',
    copy: 'Golden small-chops platters packed for meetings, birthdays, and low-stress hosting.',
    image: '/uploads/aries11-smallchops-platter-large.webp',
    video: '/uploads/hero-carousel/small-chops.mp4',
    objectPosition: 'center 58%',
    alt: 'Aries 11 small chops platter',
    href: '/menu/small-chops',
    cta: 'Order Small Chops',
  },
];

export default function HeroCarousel() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [videoHolding, setVideoHolding] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);
  const slide = HERO_SLIDES[active];
  const canPlayVideo = Boolean(slide.video && !reduceMotion && !videoHolding);

  useEffect(() => {
    setVideoHolding(false);
    setVideoReady(false);
  }, [active]);

  useEffect(() => {
    if (slide.video && !reduceMotion && !videoHolding) return undefined;
    const timer = setTimeout(() => {
      setActive((index) => (index + 1) % HERO_SLIDES.length);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canPlayVideo) return undefined;

    // React does not render `muted` as a real HTML attribute, but browser
    // autoplay policies check the attribute — set it on the element directly.
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');

    video.currentTime = 0;
    const play = () => {
      setVideoReady(true);
      video.play().catch(() => setVideoHolding(true));
    };
    const ended = () => setActive((index) => (index + 1) % HERO_SLIDES.length);
    const failed = () => setVideoHolding(true);

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      play();
    } else {
      video.addEventListener('canplay', play, { once: true });
    }
    video.addEventListener('ended', ended);
    video.addEventListener('error', failed);

    return () => {
      video.removeEventListener('canplay', play);
      video.removeEventListener('ended', ended);
      video.removeEventListener('error', failed);
    };
  }, [canPlayVideo, active]);

  return (
    <section className="home-hero" aria-label="Featured Aries 11 products">
      <div className="home-hero__media" aria-hidden="true">
        <motion.div
          key={active}
          className={`home-hero__slide${canPlayVideo ? ' has-video' : ''}${canPlayVideo && videoReady ? ' is-video-ready' : ''}`}
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.34, ease: 'easeOut' }}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            sizes="100vw"
            priority={active === 0}
            loading={active === 0 ? undefined : 'lazy'}
            className="home-hero__asset home-hero__image"
            style={{ objectPosition: slide.objectPosition || 'center' }}
          />
          {canPlayVideo && (
            <video
              ref={videoRef}
              src={slide.video}
              muted
              playsInline
              preload="metadata"
              controls={false}
              poster={slide.image}
              className={`home-hero__asset home-hero__video${videoReady ? ' is-ready' : ''}`}
              style={{ objectPosition: slide.objectPosition || 'center' }}
            />
          )}
        </motion.div>
      </div>

      <div className="home-hero__scrim" aria-hidden="true" />
      <div className="container home-hero__content">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: 'easeOut' }}
          >
            <div className="home-hero__eyebrow">{slide.eyebrow}</div>
            <h1 className="home-hero__title">
              {slide.title}{' '}
              <span>{slide.accent}</span>
            </h1>
            <p className="home-hero__copy">{slide.copy}</p>
            <div className="home-hero__actions">
              <Link to={slide.href} className="btn home-hero__cta">{slide.cta}</Link>
              <div className="home-hero__meta">24-hour preorder · Abeokuta</div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="home-hero__dots" aria-label="Hero slide status">
          {HERO_SLIDES.map((item, index) => (
            <button
              key={item.eyebrow}
              type="button"
              aria-label={`Show ${item.eyebrow}`}
              aria-current={index === active}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
