'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

const SLIDE_MS = 4800;
const PHOTO_HOLD_MS = 700;
const VIDEO_START_TIMEOUT_MS = 2400;
const INITIAL_VIDEO_STATE = { slide: -1, complete: false, failed: false };

const HERO_SLIDES = [
  {
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
    eyebrow: 'Banana Bread',
    title: 'Seven toppings. One loaf made for',
    accent: 'You',
    copy: 'Ripe banana loaves, baked fresh with your choice of seven toppings.',
    image: '/uploads/hero-carousel/banana-bread-hold.webp',
    video: '/uploads/hero-carousel/banana-bread.mp4',
    objectPosition: 'center 54%',
    mobileObjectPosition: 'center 42%',
    href: '/product/signature-banana-bread',
    cta: 'Configure a Loaf',
  },
  {
    eyebrow: 'Small Chops',
    title: 'Party trays that arrive ready to',
    accent: 'Share',
    copy: 'Golden small-chops platters packed for meetings, birthdays, and low-stress hosting.',
    image: '/uploads/aries11-smallchops-platter-small.webp',
    video: '/uploads/hero-carousel/small-chops.mp4',
    objectPosition: 'center 58%',
    mobileObjectPosition: 'center 43%',
    href: '/product/small-chops-platter',
    cta: 'Build a Platter',
  },
  {
    eyebrow: 'Brownies',
    title: 'Fudgy boxes, finished your',
    accent: 'Way',
    copy: 'Choose your box size and one of five rich flavours, from Biscoff to dark chocolate.',
    image: '/uploads/hero-carousel/brownies-hold.webp',
    video: '/uploads/hero-carousel/brownies.mp4',
    containMedia: true,
    objectPosition: 'center 52%',
    mobileObjectPosition: 'center 40%',
    href: '/product/brownie-box',
    cta: 'Build a Brownie Box',
  },
  {
    eyebrow: 'Pastries',
    title: 'Golden pastry trays made to',
    accent: 'Share',
    copy: 'Suya pie, fish pie and sausage rolls, packed as a mixed tray or your chosen favourite.',
    image: '/uploads/aries11-pastries-mixedtray-complete.webp',
    video: '/uploads/hero-carousel/pastries.mp4',
    containMedia: true,
    objectPosition: 'center 54%',
    mobileObjectPosition: 'center 40%',
    href: '/product/mixed-pastry-tray',
    cta: 'Choose Your Pastries',
  },
  {
    eyebrow: 'Cake Parfait',
    title: 'Soft cake, cool cream, one proper',
    accent: 'Treat',
    copy: 'Chocolate or red velvet cake layered with cream in two made-to-order sizes.',
    image: '/uploads/hero-carousel/cake-parfait.webp',
    objectPosition: 'center 56%',
    mobileObjectPosition: 'center 42%',
    href: '/product/cake-parfait',
    cta: 'Choose a Parfait',
  },
];

export default function HeroCarousel() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef(null);
  const [active, setActive] = useState(0);
  const [videoState, setVideoState] = useState(INITIAL_VIDEO_STATE);
  const [pageVisible, setPageVisible] = useState(true);
  const slide = HERO_SLIDES[active];
  const carouselRunning = pageVisible;
  const videoComplete = videoState.slide === active && videoState.complete;
  const videoFailed = videoState.slide === active && videoState.failed;
  const canPlayVideo = Boolean(slide.video && !reduceMotion && !videoComplete);

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
      setActive((index) => (index + 1) % HERO_SLIDES.length);
    }, completedVideo ? PHOTO_HOLD_MS : SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [active, canPlayVideo, carouselRunning, reduceMotion, slide.video, videoComplete, videoFailed]);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const nextSlide = HERO_SLIDES[(active + 1) % HERO_SLIDES.length];
    if (!nextSlide.video) return undefined;

    const preloader = document.createElement('video');
    preloader.preload = 'auto';
    preloader.muted = true;
    preloader.src = nextSlide.video;
    preloader.load();
    return () => preloader.pause();
  }, [active, reduceMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canPlayVideo || !carouselRunning) return undefined;

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

  return (
    <section className="home-hero" aria-label="Featured Aries 11 products">
      <div className="home-hero__media" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            className={`home-hero__slide${canPlayVideo ? ' has-video' : ''}${slide.containMedia ? ' is-contained' : ''}`}
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
                preload="auto"
                controls={false}
                poster={slide.image}
                onPlaying={() => setVideoState({ slide: active, complete: false, failed: false })}
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
              <div className="home-hero__meta">24-hour preorder · Abeokuta</div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="home-hero__dots" role="group" aria-label="Choose a featured product">
          {HERO_SLIDES.map((item, index) => (
            <button
              key={item.eyebrow}
              type="button"
              aria-label={`Show ${item.eyebrow}`}
              aria-current={index === active ? 'true' : undefined}
              onClick={() => {
                if (index === active) return;
                setVideoState(INITIAL_VIDEO_STATE);
                setActive(index);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
