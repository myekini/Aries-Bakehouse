'use client';

// ============================================================================
// DEV/QA ONLY — TEMPORARY COMPARISON, NOT A PERMANENT PRODUCT FEATURE.
//
// Renders two candidate hero-image treatments for the Brownie Box page
// side-by-side (via a toggle, not literally side-by-side) so the team can
// compare them at the same scroll position before picking one. Delete this
// file and its import in ProductDetail.jsx once a version is chosen — do
// not ship the toggle to real customers.
// ============================================================================

import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

const SUSPENDED_IMG = '/uploads/qa/brownies-suspended.webp';
const ASSEMBLED_IMG = '/uploads/qa/brownies-assembled.webp';
const TRANSITION_VIDEO = '/uploads/qa/brownies-transition.mp4';

function ScrollCrossfade() {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const suspendedOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const assembledOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (reduceMotion) {
    return (
      <div className="qa-brownies-hero__stage">
        <img src={ASSEMBLED_IMG} alt="Aries 11 Brownie Box, assembled" />
      </div>
    );
  }

  return (
    <div ref={trackRef} className="qa-brownies-hero__scroll-track">
      <div className="qa-brownies-hero__pin">
        <div className="qa-brownies-hero__stage">
          <motion.img src={SUSPENDED_IMG} alt="" aria-hidden="true" style={{ opacity: suspendedOpacity }} />
          <motion.img src={ASSEMBLED_IMG} alt="Aries 11 Brownie Box, assembled" style={{ opacity: assembledOpacity }} />
        </div>
      </div>
    </div>
  );
}

function AutoplayVideo() {
  const reduceMotion = useReducedMotion();
  const [videoDone, setVideoDone] = useState(false);
  const rootRef = useRef(null);

  if (reduceMotion) {
    return (
      <div className="qa-brownies-hero__stage">
        <img src={ASSEMBLED_IMG} alt="Aries 11 Brownie Box, assembled" />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="qa-brownies-hero__stage">
      {videoDone ? (
        <img src={ASSEMBLED_IMG} alt="Aries 11 Brownie Box, assembled" />
      ) : (
        <video
          src={TRANSITION_VIDEO}
          autoPlay
          muted
          playsInline
          preload="metadata"
          controls={false}
          poster={SUSPENDED_IMG}
          onEnded={() => setVideoDone(true)}
          onError={() => setVideoDone(true)}
        />
      )}
    </div>
  );
}

export default function BrowniesHeroQA() {
  const [version, setVersion] = useState('scroll');

  return (
    <section className="qa-brownies-hero container" aria-labelledby="qa-brownies-hero-title">
      <div className="qa-brownies-hero__banner" role="note">
        <strong>QA ONLY</strong> — temporary hero-treatment comparison. Remove this section and{' '}
        <code>BrowniesHeroQA.jsx</code> once a version is chosen.
      </div>
      <div className="qa-brownies-hero__header">
        <h2 id="qa-brownies-hero-title">Brownie Box hero comparison</h2>
        <div className="qa-brownies-hero__toggle" role="group" aria-label="Choose a version to preview">
          <button
            type="button"
            className={version === 'scroll' ? 'is-active' : ''}
            aria-pressed={version === 'scroll'}
            onClick={() => setVersion('scroll')}
          >
            Scroll-Linked
          </button>
          <button
            type="button"
            className={version === 'video' ? 'is-active' : ''}
            aria-pressed={version === 'video'}
            onClick={() => setVersion('video')}
          >
            Video
          </button>
        </div>
      </div>
      {version === 'scroll' ? <ScrollCrossfade key="scroll" /> : <AutoplayVideo key="video" />}
    </section>
  );
}
