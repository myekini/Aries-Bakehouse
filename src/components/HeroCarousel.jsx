'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

const SLIDE_MS = 5200;
const PHOTO_HOLD_MS = 700;
const VIDEO_START_TIMEOUT_MS = 2400;
const INITIAL_VIDEO_STATE = { slide: -1, complete: false, failed: false };

// Three slides only — brand first, then the two strongest configurable
// products. Brownies/pastries/parfait get their own scroll moment in
// CounterScroller instead of dying unseen on slides 4–6.
const HERO_SLIDES = [
  {
    label: 'The Bakehouse',
    eyebrow: 'Aries 11 Bakehouse',
    title: 'Freshly Made Treats for Every',
    accent: 'Craving',
    copy: 'Fresh banana bread, pastries, brownies, cake treats and small-chops platters, made to order in Abeokuta.',
    image: '/uploads/aries11-brand-collection-hero.webp',
    objectPosition: 'center 52%',
    mobileObjectPosition: 'center 44%',
    href: '/menu',
    cta: 'Explore the Menu',
  },
  {
    label: 'Banana Bread',
    eyebrow: 'Signature Banana Bread',
    title: 'Ripe bananas, seven finishes, one',
    accent: 'Loaf',
    copy: 'Baked fresh to order with your choice of seven toppings, from Biscoff to nuts crunch.',
    image: '/uploads/hero-carousel/banana-bread-hold.webp',
    video: '/uploads/hero-carousel/banana-bread.mp4',
    objectPosition: 'center 54%',
    mobileObjectPosition: 'center 42%',
    href: '/product/signature-banana-bread',
    cta: 'Configure a Loaf',
  },
  {
    label: 'Small Chops',
    eyebrow: 'Small Chops',
    title: 'Golden platters that carry the',
    accent: 'Party',
    copy: 'Small-chops trays packed for meetings, birthdays, and low-stress hosting.',
    image: '/uploads/aries11-smallchops-platter-small.webp',
    video: '/uploads/hero-carousel/small-chops.mp4',
    objectPosition: 'center 58%',
    mobileObjectPosition: 'center 43%',
    href: '/product/small-chops-platter',
    cta: 'Build a Platter',
  },
];

export default function HeroCarousel() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef(null);
  const [active, setActive] = useState(0);
  const [videoState, setVideoState] = useState(INITIAL_VIDEO_STATE);
  const [pageVisible, setPageVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const saveData = typeof navigator !== 'undefined' && Boolean(navigator.connection?.saveData);
  const slide = HERO_SLIDES[active];
  const carouselRunning = pageVisible && !paused;
  const videoComplete = videoState.slide === active && videoState.complete;
  const videoFailed = videoState.slide === active && videoState.failed;
  const canPlayVideo = Boolean(slide.video && !reduceMotion && !saveData && !videoComplete);

  const attachVideo = useCallback((video) => {
    videoRef.current = video;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
  }, []);

  useEffect(() => {
    const handleVisibility = () => setPageVisible(!document.hidden);
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (!carouselRunning || canPlayVideo) return undefined;
    const completedVideo = Boolean(slide.video && !reduceMotion && videoComplete && !videoFailed);
    const timer = window.setTimeout(() => {
      setVideoState(INITIAL_VIDEO_STATE);
      setVideoProgress(0);
      setActive((index) => (index + 1) % HERO_SLIDES.length);
    }, completedVideo ? PHOTO_HOLD_MS : SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [active, canPlayVideo, carouselRunning, reduceMotion, slide.video, videoComplete, videoFailed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canPlayVideo) return undefined;
    if (!carouselRunning) {
      video.pause();
      return undefined;
    }

    const play = () => {
      video.play().catch(() => {
        // Some browsers defer muted autoplay until the first interaction.
        // Keep the poster visible and retry instead of abandoning the clip.
      });
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      play();
    } else {
      video.addEventListener('loadeddata', play, { once: true });
    }
    document.addEventListener('pointerdown', play, { once: true });
    const watchdog = window.setTimeout(() => {
      if (video.paused && video.currentTime < 0.05) {
        setVideoState({ slide: active, complete: true, failed: true });
      }
    }, VIDEO_START_TIMEOUT_MS);

    return () => {
      video.removeEventListener('loadeddata', play);
      document.removeEventListener('pointerdown', play);
      window.clearTimeout(watchdog);
      video.pause();
    };
  }, [active, canPlayVideo, carouselRunning]);

  function selectSlide(index) {
    if (index === active) return;
    setVideoState(INITIAL_VIDEO_STATE);
    setVideoProgress(0);
    setActive(index);
  }

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
  }

  return (
    <section
      className="home-hero"
      aria-label="Featured Aries 11 products"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={handleBlur}
    >
      <div className="home-hero__media" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            className={`home-hero__slide${canPlayVideo ? ' has-video' : ''}`}
            style={{
              '--hero-object-position': slide.objectPosition,
              '--hero-object-position-mobile': slide.mobileObjectPosition,
            }}
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduceMotion ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            {canPlayVideo ? (
              <video
                ref={attachVideo}
                src={slide.video}
                autoPlay
                muted
                playsInline
                preload="metadata"
                controls={false}
                poster={slide.image}
                onPlaying={() => setVideoState({ slide: active, complete: false, failed: false })}
                onTimeUpdate={(event) => {
                  const { currentTime, duration } = event.currentTarget;
                  if (duration > 0) setVideoProgress(Math.min(1, currentTime / duration));
                }}
                onEnded={() => setVideoState({ slide: active, complete: true, failed: false })}
                onError={() => setVideoState({ slide: active, complete: true, failed: true })}
                className="home-hero__asset home-hero__video"
              />
            ) : (
              <Image
                src={slide.image}
                alt=""
                fill
                sizes="100vw"
                priority={active === 0}
                loading={active === 0 ? undefined : 'lazy'}
                className="home-hero__asset home-hero__image"
              />
            )}
          </motion.div>
        </AnimatePresence>
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
              <div className="home-hero__meta">Baked to order · 24-hour preorder · Abeokuta</div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="home-hero__tabs" role="group" aria-label="Choose a featured product">
          {HERO_SLIDES.map((item, index) => {
            const isActive = index === active;
            const isVideoSlide = isActive && canPlayVideo && !videoFailed;
            return (
              <button
                key={item.label}
                type="button"
                className={isActive ? 'is-active' : ''}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => selectSlide(index)}
              >
                <span className="home-hero__tab-label">{item.label}</span>
                <span className="home-hero__tab-track" aria-hidden="true">
                  {isActive && (
                    isVideoSlide ? (
                      <span
                        className="home-hero__tab-fill"
                        style={{ transform: `scaleX(${videoProgress})` }}
                      />
                    ) : videoComplete && !videoFailed ? (
                      <span className="home-hero__tab-fill" style={{ transform: 'scaleX(1)' }} />
                    ) : (
                      <span
                        key={active}
                        className={`home-hero__tab-fill is-timed${carouselRunning && !reduceMotion ? '' : ' is-paused'}`}
                        style={{ '--hero-slide-ms': `${SLIDE_MS}ms` }}
                      />
                    )
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
