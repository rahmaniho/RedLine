import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { Flip } from 'gsap/Flip';
import { photos, type Photo, type PhotoCategory } from '../data/photos';
import Detail from './Detail';
import TopNav from './TopNav';
import ContentPage from './ContentPage';
import SmartImage from './SmartImage';
import { themes, type ThemeKey } from '../data/themes';
import { toFaDigits } from '../utils/format';

gsap.registerPlugin(Observer, Flip);

/* ---- Motion constants (position-based, signed velocity) ---- */
const BASE_SPEED = 60;          // px/sec — default autoplay speed
const WHEEL_GAIN = 55;          // impulse per normalized wheel unit
const MAX_SPEED = 200;          // clamp
const IMPULSE_DECAY = 2.2;      // per second exponential decay of inputImpulse
const IMPULSE_CLAMP = 280;      // clamp accumulated impulse magnitude
const VELOCITY_SMOOTHING = 6.0; // per second smoothing toward desired velocity
const RESUME_SMOOTHING = 3.5;   // gentler smoothing after release
const VELOCITY_EPSILON = 0.5;   // snap-to-zero threshold

type InteractionState =
  | 'gallery'
  | 'hover'
  | 'opening-detail'
  | 'detail'
  | 'closing-detail';

type TransitionPhase = 'opening' | 'closing';

type Transaction = {
  id: number;
  phase: TransitionPhase;
  timeline: gsap.core.Timeline | null;
  proxy: HTMLDivElement | null;
  originElement: HTMLElement | null;
  originVisual: HTMLElement | null;
  imageId: string;
  cancelled: boolean;
};

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  if (range <= 0) return min;
  let out = (((v - min) % range) + range) % range + min;
  if (out === max) out = min;
  return out;
};

export default function Gallery() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const motionRef = useRef({
    positionX: 0,
    copyWidth: 0,
    currentVelocity: BASE_SPEED,
    targetVelocity: BASE_SPEED,
    inputImpulse: 0,
    suppressed: false,
    resumeMode: false,
    mode: 'running' as 'running' | 'stopped',
  });

  const requestMotionStop = () => {
    const m = motionRef.current;
    m.suppressed = true;
    m.targetVelocity = 0;
    m.inputImpulse = 0;
    m.resumeMode = false;
  };
  const requestMotionResume = () => {
    const m = motionRef.current;
    m.suppressed = false;
    m.targetVelocity = BASE_SPEED;
    m.resumeMode = true;
  };

  const stateRef = useRef<InteractionState>('gallery');
  const dragDistanceRef = useRef(0);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  /* ---------- Hover ---------- */
  const hoverLayerRef = useRef<HTMLDivElement>(null);
  const hoverItemRef = useRef<HTMLElement | null>(null);
  const hoverPhotoRef = useRef<Photo | null>(null);
  const hoverProxyRef = useRef<HTMLDivElement | null>(null);
  const hoverSuppressedItemRef = useRef<HTMLElement | null>(null);
  const closeHandoffActiveRef = useRef(false);

  type HoverLeaveSession = {
    id: number;
    ownedVisual: HTMLElement;
    ownedProxy: HTMLDivElement;
    ownedItem: HTMLElement;
    timeline: gsap.core.Timeline | null;
    finalized: boolean;
  };
  const hoverLeaveSessionRef = useRef<HoverLeaveSession | null>(null);
  const hoverLeaveCounter = useRef(0);

  /* ---------- Detail ---------- */
  const detailImageBoxRef = useRef<HTMLDivElement>(null);
  const detailRootRef = useRef<HTMLDivElement>(null);
  const detailOverlayRef = useRef<HTMLDivElement>(null);
  const originItemRef = useRef<HTMLElement | null>(null);
  const originVisualRef = useRef<HTMLElement | null>(null);
  const activePhotoRef = useRef<Photo | null>(null);
  const transactionRef = useRef<Transaction | null>(null);
  const transactionCounter = useRef(0);
  const closeBackResolverRef = useRef<(() => void) | null>(null);

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [resolvedDetailSrc, setResolvedDetailSrc] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [textReady, setTextReady] = useState(false);

  /* ---------- Content page ---------- */
  const [contentOpen, setContentOpen] = useState(false);
  const [scrollTarget, setScrollTarget] = useState<'top' | 'studio' | 'services' | 'contact' | null>(null);

  /* ---------- Theme & filter ---------- */
  const [theme, setTheme] = useState<ThemeKey>('rose');
  const [filter, setFilter] = useState<'All' | PhotoCategory>('All');

  const visiblePhotos = useMemo(
    () => (filter === 'All' ? photos : photos.filter((p) => p.category === filter)),
    [filter],
  );

  /* Three copies ensure seamless infinite wrapping even on 2K/4K/ultrawide screens when filtered. */
  const items = useMemo(() => {
    const arr: Array<{ photo: Photo; copy: number }> = [];
    [0, 1, 2].forEach((copy) => {
      visiblePhotos.forEach((p) => arr.push({ photo: p, copy }));
    });
    return arr;
  }, [visiblePhotos]);

  const V = themes[theme];

  /* Update browser theme-color meta dynamically with selected theme */
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = V.bg;
  }, [V.bg]);

  /* =======================================================================
     Layout — measure one copy's width
     ======================================================================= */
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const els = track.querySelectorAll<HTMLElement>('[data-clone-index="0"]');
      if (!els.length) return;
      let copyWidth = 0;
      els.forEach((el) => {
        copyWidth += el.offsetWidth;
      });
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || '0');
      copyWidth += gap * els.length;
      if (copyWidth <= 0) return;

      motionRef.current.copyWidth = copyWidth;
      motionRef.current.positionX = wrap(0, copyWidth, motionRef.current.positionX);
      gsap.set(track, { x: -motionRef.current.positionX });
    };

    const ctx = gsap.context(() => {
      motionRef.current.positionX = 0;
      measure();
    }, rootRef);

    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      ctx.revert();
    };
  }, [filter, visiblePhotos.length]);

  /* Reset stale hover proxies when category filter changes */
  useEffect(() => {
    if (stateRef.current === 'hover') {
      const prevProxy = hoverProxyRef.current;
      const prevVisual = hoverItemRef.current?.querySelector<HTMLElement>('.gallery-visual');
      if (prevProxy && prevProxy.isConnected) {
        gsap.killTweensOf(prevProxy);
        prevProxy.remove();
      }
      if (prevVisual && prevVisual.isConnected) {
        gsap.killTweensOf(prevVisual);
        gsap.set(prevVisual, { autoAlpha: 1, scale: 1, clearProps: 'boxShadow' });
      }
      hoverProxyRef.current = null;
      hoverItemRef.current = null;
      hoverPhotoRef.current = null;
      stateRef.current = 'gallery';
      requestMotionResume();
    }
  }, [filter]);

  /* =======================================================================
     Ticker — single writer for track.x
     ======================================================================= */
  useEffect(() => {
    const tick = (_time: number, deltaMs: number) => {
      const m = motionRef.current;
      if (m.copyWidth <= 0) return;

      const dt = Math.min(0.1, Math.max(0, deltaMs / 1000));
      if (dt <= 0) return;

      if (m.inputImpulse !== 0) {
        const decay = Math.exp(-IMPULSE_DECAY * dt);
        m.inputImpulse *= decay;
        if (Math.abs(m.inputImpulse) < 0.01) m.inputImpulse = 0;
      }

      let desired = m.suppressed ? 0 : m.targetVelocity + m.inputImpulse;
      if (desired > MAX_SPEED) desired = MAX_SPEED;
      if (desired < -MAX_SPEED) desired = -MAX_SPEED;

      if (m.mode === 'stopped') {
        if (Math.abs(desired) > VELOCITY_EPSILON) {
          m.mode = 'running';
        } else {
          m.currentVelocity = 0;
          return;
        }
      }

      const k = m.resumeMode ? RESUME_SMOOTHING : VELOCITY_SMOOTHING;
      const alpha = 1 - Math.exp(-k * dt);
      m.currentVelocity += (desired - m.currentVelocity) * alpha;

      if (m.resumeMode && Math.abs(desired - m.currentVelocity) < 0.5) {
        m.resumeMode = false;
      }

      if (m.suppressed && Math.abs(m.currentVelocity) <= VELOCITY_EPSILON) {
        m.currentVelocity = 0;
        m.mode = 'stopped';
        return;
      }

      m.positionX += m.currentVelocity * dt;
      m.positionX = wrap(0, m.copyWidth, m.positionX);

      const track = trackRef.current;
      if (track) gsap.set(track, { x: -m.positionX });
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  /* =======================================================================
     Observer — wheel / touch / pointer drag
     ======================================================================= */
  useEffect(() => {
    if (contentOpen || detailVisible) return;
    const target = rootRef.current;
    if (!target) return;

    const obs = Observer.create({
      target,
      type: 'wheel,touch,pointer',
      ignore: 'header, button, a, input, textarea, [data-ignore-observer]',
      dragMinimum: 4,
      onPress: (self) => {
        dragDistanceRef.current = 0;
        pointerDownPosRef.current = { x: self.x ?? 0, y: self.y ?? 0 };
      },
      onChange: (self) => {
        if (pointerDownPosRef.current && self.isDragging) {
          const dx = (self.x ?? 0) - pointerDownPosRef.current.x;
          const dy = (self.y ?? 0) - pointerDownPosRef.current.y;
          dragDistanceRef.current = Math.hypot(dx, dy);
        }
        const m = motionRef.current;
        if (m.suppressed && !self.isDragging) return;
        const delta = (self.deltaY || 0) - (self.deltaX || 0);
        if (delta === 0) return;
        let normalized = delta / 60;
        if (normalized > 4) normalized = 4;
        if (normalized < -4) normalized = -4;
        m.inputImpulse += normalized * WHEEL_GAIN;
        if (m.inputImpulse > IMPULSE_CLAMP) m.inputImpulse = IMPULSE_CLAMP;
        if (m.inputImpulse < -IMPULSE_CLAMP) m.inputImpulse = -IMPULSE_CLAMP;
      },
      onRelease: () => {
        pointerDownPosRef.current = null;
      },
    });
    return () => obs.kill();
  }, [contentOpen, detailVisible]);

  /* =======================================================================
     Hover helpers
     ======================================================================= */
  const preloadImage = (src: string) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    });

  const getItemResolvedSrc = (item: HTMLElement, fallbackPhoto: Photo): string => {
    const img = item.querySelector<HTMLImageElement>('img');
    if (img && img.complete && img.naturalWidth > 0 && (img.currentSrc || img.src)) {
      return img.currentSrc || img.src;
    }
    return img?.src || fallbackPhoto.src;
  };

  const makeProxyDiv = (
    rect: DOMRect,
    src: string,
    radius: string,
    withShadow: boolean,
  ) => {
    const proxy = document.createElement('div');
    proxy.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border-radius: ${radius};
      overflow: hidden;
      background: #e8e2d6;
      pointer-events: none;
      will-change: transform, border-radius;
      transform-origin: center center;
      ${withShadow ? 'box-shadow: 0 30px 60px -20px rgba(0,0,0,0.28);' : ''}
    `;
    const img = document.createElement('img');
    img.referrerPolicy = 'no-referrer';
    img.src = src;
    img.draggable = false;
    img.style.cssText =
      'width:100%;height:100%;object-fit:cover;object-position:center;display:block;user-select:none;';
    proxy.appendChild(img);
    return proxy;
  };

  /** Clone the rendered <img> so the proxy paints instantly (no decode flash). */
  const makeClonedProxy = (rect: DOMRect, source: HTMLElement, radius: string) => {
    const proxy = document.createElement('div');
    proxy.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border-radius: ${radius};
      overflow: hidden;
      background: #e8e2d6;
      pointer-events: none;
      will-change: transform, border-radius;
      transform-origin: center center;
      visibility: hidden;
    `;
    const img = source.querySelector('img');
    if (img) {
      const clone = img.cloneNode(true) as HTMLImageElement;
      clone.style.cssText =
        'width:100%;height:100%;object-fit:cover;object-position:center;display:block;user-select:none;';
      clone.draggable = false;
      proxy.appendChild(clone);
    }
    return { proxy, isImageReady: !!img && img.complete && img.naturalWidth > 0 };
  };

  /** Clone with visible content (used for the closing transition). */
  const makeVisibleClone = (rect: DOMRect, source: HTMLElement, radius: string) => {
    const proxy = document.createElement('div');
    proxy.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border-radius: ${radius};
      overflow: hidden;
      background: #e8e2d6;
      pointer-events: none;
      will-change: transform;
      transform-origin: center center;
    `;
    const img = source.querySelector('img');
    if (img) {
      const clone = img.cloneNode(true) as HTMLImageElement;
      clone.style.cssText =
        'width:100%;height:100%;object-fit:cover;object-position:center;display:block;user-select:none;';
      clone.draggable = false;
      proxy.appendChild(clone);
    }
    return proxy;
  };

  /** Finalize a pending hover-leave session. */
  const finalizeHoverLeave = (session: HoverLeaveSession, animateBack: boolean) => {
    if (session.finalized) return;
    session.finalized = true;

    if (animateBack) {
      const v = session.ownedVisual;
      if (v.isConnected) {
        gsap.killTweensOf(v);
        gsap.set(v, { autoAlpha: 1, scale: 1, clearProps: 'boxShadow' });
      }
      if (session.ownedProxy && session.ownedProxy.isConnected) session.ownedProxy.remove();
    }

    if (session.timeline) {
      session.timeline.kill();
      session.timeline = null;
    }
    if (hoverLeaveSessionRef.current === session) hoverLeaveSessionRef.current = null;
  };

  /** Start the "shrink back into the card" animation. */
  const startHoverLeave = (item: HTMLElement, visual: HTMLElement, proxy: HTMLDivElement) => {
    const existing = hoverLeaveSessionRef.current;
    if (existing) finalizeHoverLeave(existing, false);

    const rect = proxy.getBoundingClientRect();
    gsap.killTweensOf(proxy);
    gsap.set(proxy, { clearProps: 'scale' });
    gsap.set(proxy, { top: rect.top, left: rect.left, width: rect.width, height: rect.height });

    const session: HoverLeaveSession = {
      id: ++hoverLeaveCounter.current,
      ownedVisual: visual,
      ownedProxy: proxy,
      ownedItem: item,
      timeline: null,
      finalized: false,
    };
    hoverLeaveSessionRef.current = session;

    const tl = gsap.timeline({
      onComplete: () => finalizeHoverLeave(session, true),
    });
    session.timeline = tl;

    const fit = Flip.fit(proxy, visual, {
      duration: 0.35,
      ease: 'power2.out',
      borderRadius: '9999px',
    });
    if (fit) tl.add(fit as gsap.core.TimelineChild, 0);
    tl.to(
      proxy,
      { boxShadow: '0 0px 0px 0px rgba(0,0,0,0)', duration: 0.35, ease: 'power2.out' },
      0,
    );
  };

  /* =======================================================================
     Hover activation
     ======================================================================= */
  const activateHover = (item: HTMLElement, p: Photo) => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) {
      return;
    }
    const layer = hoverLayerRef.current;
    if (!layer) return;

    const visual = item.querySelector<HTMLElement>('.gallery-visual');
    if (!visual) return;

    const state = stateRef.current;
    if (state === 'opening-detail' || state === 'detail' || state === 'closing-detail') {
      return;
    }

    if (state === 'hover') {
      if (hoverItemRef.current === item) return;
      if (hoverLeaveSessionRef.current) {
        finalizeHoverLeave(hoverLeaveSessionRef.current, false);
      }
      const prevProxy = hoverProxyRef.current;
      const prevVisual = hoverItemRef.current?.querySelector<HTMLElement>('.gallery-visual');
      if (prevProxy) {
        gsap.killTweensOf(prevProxy);
        if (prevProxy.isConnected) prevProxy.remove();
      }
      if (prevVisual) {
        gsap.killTweensOf(prevVisual);
        gsap.set(prevVisual, { autoAlpha: 1, scale: 1, clearProps: 'boxShadow' });
      }
      hoverProxyRef.current = null;
      hoverItemRef.current = null;
    }

    stateRef.current = 'hover';
    requestMotionStop();

    const rect = visual.getBoundingClientRect();
    const { proxy, isImageReady } = makeClonedProxy(rect, visual, '9999px');
    layer.appendChild(proxy);
    hoverProxyRef.current = proxy;

    const swap = () => {
      if (hoverProxyRef.current !== proxy) return;
      gsap.set(proxy, { autoAlpha: 1, scale: 1, boxShadow: '0 0px 0px 0px rgba(0,0,0,0)' });
      gsap.set(visual, { autoAlpha: 0 });
      gsap.to(proxy, {
        scale: 1.06,
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.30)',
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    if (isImageReady) {
      swap();
    } else {
      const img = proxy.querySelector('img');
      const after = () => requestAnimationFrame(() => swap());
      if (img) {
        if (img.complete && img.naturalWidth > 0) after();
        else if (typeof img.decode === 'function') img.decode().then(after).catch(after);
        else {
          img.onload = after;
          img.onerror = after;
        }
      } else {
        swap();
      }
    }

    hoverItemRef.current = item;
    hoverPhotoRef.current = p;
  };

  const deactivateHover = () => {
    if (stateRef.current !== 'hover') return;
    const item = hoverItemRef.current;
    const proxy = hoverProxyRef.current;
    if (!item || !proxy) return;

    const visual = item.querySelector<HTMLElement>('.gallery-visual');
    if (!visual) return;

    startHoverLeave(item, visual, proxy);

    hoverProxyRef.current = null;
    hoverItemRef.current = null;
    hoverPhotoRef.current = null;
    stateRef.current = 'gallery';
    requestMotionResume();
  };

  /* =======================================================================
     Open detail
     ======================================================================= */
  const openDetail = async (p: Photo, item: HTMLElement) => {
    if (dragDistanceRef.current > 8) {
      dragDistanceRef.current = 0;
      return;
    }

    const state = stateRef.current;
    if (state !== 'gallery' && state !== 'hover') return;

    const activeSrc = getItemResolvedSrc(item, p);

    const tx = transactionRef.current;
    if (tx) {
      tx.cancelled = true;
      if (tx.timeline) {
        tx.timeline.kill();
        tx.timeline = null;
      }
      if (tx.proxy && tx.proxy.isConnected) tx.proxy.remove();
      tx.proxy = null;
      transactionRef.current = null;
    }

    const pendingLeave = hoverLeaveSessionRef.current;
    if (pendingLeave) finalizeHoverLeave(pendingLeave, false);

    let carriedProxy: HTMLDivElement | null = null;

    if (state === 'hover' && hoverItemRef.current === item && hoverProxyRef.current) {
      carriedProxy = hoverProxyRef.current;
      gsap.killTweensOf(carriedProxy);
      const r = carriedProxy.getBoundingClientRect();
      gsap.set(carriedProxy, {
        clearProps: 'scale,transform',
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        x: 0,
        y: 0,
      });
      hoverProxyRef.current = null;
      hoverItemRef.current = null;
      hoverPhotoRef.current = null;
    } else if (state === 'hover') {
      const prevProxy = hoverProxyRef.current;
      const prevVisual = hoverItemRef.current?.querySelector<HTMLElement>('.gallery-visual');
      if (prevProxy) {
        gsap.killTweensOf(prevProxy);
        if (prevProxy.isConnected) prevProxy.remove();
      }
      if (prevVisual) {
        gsap.killTweensOf(prevVisual);
        gsap.set(prevVisual, { autoAlpha: 1, scale: 1, clearProps: 'boxShadow' });
      }
      hoverProxyRef.current = null;
      hoverItemRef.current = null;
    }

    stateRef.current = 'opening-detail';
    requestMotionStop();

    const visual = item.querySelector<HTMLElement>('.gallery-visual');
    originItemRef.current = item;
    originVisualRef.current = visual;

    const txOpen: Transaction = {
      id: ++transactionCounter.current,
      phase: 'opening',
      timeline: null,
      proxy: carriedProxy,
      originElement: item,
      originVisual: visual,
      imageId: p.id,
      cancelled: false,
    };
    transactionRef.current = txOpen;

    await Promise.all([preloadImage(activeSrc), new Promise((r) => setTimeout(r, 120))]);

    if (txOpen.cancelled || transactionRef.current !== txOpen) {
      if (carriedProxy && carriedProxy.isConnected) carriedProxy.remove();
      return;
    }

    if (visual) gsap.set(visual, { autoAlpha: 0 });

    setResolvedDetailSrc(activeSrc);
    setPhoto(p);
    setTextReady(false);
    setDetailVisible(true);

    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    if (txOpen.cancelled || transactionRef.current !== txOpen) {
      if (carriedProxy && carriedProxy.isConnected) carriedProxy.remove();
      if (visual) gsap.set(visual, { autoAlpha: 1 });
      return;
    }

    const box = detailImageBoxRef.current;
    const overlay = detailOverlayRef.current;
    if (!box || !overlay) {
      stateRef.current = 'gallery';
      requestMotionResume();
      return;
    }

    let proxy = txOpen.proxy;
    if (proxy) {
      if (proxy.parentNode !== overlay) overlay.appendChild(proxy);
    } else {
      const r = item.getBoundingClientRect();
      proxy = makeProxyDiv(r, activeSrc, '9999px', false);
      overlay.appendChild(proxy);
      txOpen.proxy = proxy;
    }

    gsap.set(box, { autoAlpha: 0 });

    const rollback = (reason: string) => {
      if (txOpen.cancelled || transactionRef.current !== txOpen) return;
      txOpen.cancelled = true;
      if (txOpen.timeline) {
        txOpen.timeline.kill();
        txOpen.timeline = null;
      }
      if (proxy && proxy.isConnected) proxy.remove();
      txOpen.proxy = null;
      if (txOpen.originVisual && txOpen.originVisual.isConnected) {
        gsap.killTweensOf(txOpen.originVisual);
        gsap.set(txOpen.originVisual, { autoAlpha: 1, scale: 1, clearProps: 'boxShadow' });
      }
      setDetailVisible(false);
      setTextReady(false);
      setPhoto(null);
      setResolvedDetailSrc(null);
      stateRef.current = 'gallery';
      requestMotionResume();
      console.warn('[Gallery] opening rollback:', reason);
    };

    try {
      const watchdog = window.setTimeout(() => {
        if (
          !txOpen.cancelled &&
          transactionRef.current === txOpen &&
          stateRef.current === 'opening-detail'
        ) {
          rollback('watchdog timeout');
        }
      }, 2500);

      const tl = gsap.timeline({
        onComplete: () => {
          window.clearTimeout(watchdog);
          if (txOpen.cancelled || transactionRef.current !== txOpen) {
            if (proxy && proxy.isConnected) proxy.remove();
            txOpen.proxy = null;
            txOpen.timeline = null;
            return;
          }
          gsap.set(box, { autoAlpha: 1 });
          if (proxy && proxy.isConnected) proxy.remove();
          txOpen.proxy = null;
          txOpen.timeline = null;
          transactionRef.current = null;
          stateRef.current = 'detail';
        },
      });
      txOpen.timeline = tl;

      const fit = Flip.fit(proxy, box, {
        duration: 0.82,
        ease: 'power3.inOut',
        borderRadius: '44px',
      });
      if (!fit) throw new Error('Flip.fit returned null');
      tl.add(fit as gsap.core.TimelineChild, 0);
      tl.call(
        () => {
          if (!txOpen.cancelled && transactionRef.current === txOpen) setTextReady(true);
        },
        undefined,
        0.42,
      );
    } catch (e) {
      rollback(`exception: ${(e as Error)?.message ?? String(e)}`);
    }
  };

  /* =======================================================================
     Close detail
     ======================================================================= */
  const closeDetail = () => {
    if (stateRef.current !== 'detail') {
      closeBackResolverRef.current?.();
      closeBackResolverRef.current = null;
      return;
    }

    const active = activePhotoRef.current;
    const item = originItemRef.current;
    const box = detailImageBoxRef.current;
    const overlay = detailOverlayRef.current;
    if (!active || !item || !item.isConnected || !box || !overlay) {
      if (originVisualRef.current && originVisualRef.current.isConnected) {
        gsap.set(originVisualRef.current, { autoAlpha: 1, scale: 1, clearProps: 'boxShadow' });
      }
      if (box) gsap.set(box, { autoAlpha: 1 });
      setDetailVisible(false);
      setTextReady(false);
      setPhoto(null);
      setResolvedDetailSrc(null);
      stateRef.current = 'gallery';
      requestMotionResume();
      closeBackResolverRef.current?.();
      closeBackResolverRef.current = null;
      return;
    }

    stateRef.current = 'closing-detail';
    setDetailVisible(false);
    setTextReady(false);

    const s = item.getBoundingClientRect();
    const c = box.getBoundingClientRect();

    if (
      !Number.isFinite(s.left) ||
      !Number.isFinite(s.top) ||
      s.width <= 0 ||
      s.height <= 0 ||
      !Number.isFinite(c.left) ||
      !Number.isFinite(c.top) ||
      c.width <= 0 ||
      c.height <= 0
    ) {
      const visual = item.querySelector<HTMLElement>('.gallery-visual');
      if (visual) gsap.set(visual, { autoAlpha: 1 });
      gsap.set(box, { autoAlpha: 1 });
      setPhoto(null);
      setResolvedDetailSrc(null);
      stateRef.current = 'gallery';
      requestMotionResume();
      closeBackResolverRef.current?.();
      closeBackResolverRef.current = null;
      return;
    }

    const visual = item.querySelector<HTMLElement>('.gallery-visual');
    const closingProxy = makeVisibleClone(c, box, '44px');
    overlay.appendChild(closingProxy);
    if (visual) gsap.set(visual, { autoAlpha: 0 });
    gsap.set(box, { autoAlpha: 0 });

    const txClose: Transaction = {
      id: ++transactionCounter.current,
      phase: 'closing',
      timeline: null,
      proxy: closingProxy,
      originElement: item,
      originVisual: visual,
      imageId: active.id,
      cancelled: false,
    };
    transactionRef.current = txClose;

    const rollback = (reason: string) => {
      if (txClose.cancelled || transactionRef.current !== txClose) return;
      txClose.cancelled = true;
      if (txClose.timeline) {
        txClose.timeline.kill();
        txClose.timeline = null;
      }
      if (closingProxy.isConnected) closingProxy.remove();
      txClose.proxy = null;
      if (visual && visual.isConnected) {
        gsap.killTweensOf(visual);
        gsap.set(visual, { autoAlpha: 1, scale: 1, clearProps: 'boxShadow' });
      }
      gsap.set(box, { autoAlpha: 1 });
      setDetailVisible(false);
      setTextReady(false);
      setPhoto(null);
      setResolvedDetailSrc(null);
      stateRef.current = 'gallery';
      requestMotionResume();
      closeBackResolverRef.current?.();
      closeBackResolverRef.current = null;
      console.warn('[Gallery] close rollback:', reason);
    };

    const watchdog = window.setTimeout(() => {
      if (
        !txClose.cancelled &&
        transactionRef.current === txClose &&
        stateRef.current === 'closing-detail'
      ) {
        rollback('watchdog timeout');
      }
    }, 2500);

    const closeTween = gsap.to(closingProxy, {
      top: s.top,
      left: s.left,
      width: s.width,
      height: s.height,
      borderRadius: '9999px',
      duration: 0.78,
      ease: 'power3.inOut',
      onComplete: () => {
        window.clearTimeout(watchdog);
        if (txClose.cancelled || transactionRef.current !== txClose) return;
        const n = item.getBoundingClientRect();
        gsap.killTweensOf(closingProxy);
        gsap.set(closingProxy, { clearProps: 'transform,scale,x,y' });
        gsap.set(closingProxy, {
          top: n.top,
          left: n.left,
          width: n.width,
          height: n.height,
          borderRadius: '9999px',
        });
        if (visual) {
          gsap.killTweensOf(visual);
          gsap.set(visual, { autoAlpha: 1, scale: 1, clearProps: 'boxShadow' });
        }

        requestAnimationFrame(() => {
          if (closingProxy.isConnected) closingProxy.remove();
          txClose.proxy = null;
          txClose.timeline = null;
          gsap.set(box, { autoAlpha: 1 });
          setPhoto(null);
          setResolvedDetailSrc(null);
          transactionRef.current = null;
          stateRef.current = 'gallery';
          requestMotionResume();
          closeBackResolverRef.current?.();
          closeBackResolverRef.current = null;
        });
      },
    });

    const closeTl = gsap.timeline();
    closeTl.add(closeTween, 0);
    txClose.timeline = closeTl;
  };

  /* Keep the active photo in a ref so close handlers always read fresh data. */
  useEffect(() => {
    activePhotoRef.current = photo;
  }, [photo]);

  /* =======================================================================
     Navigation
     ======================================================================= */
  const navigateTo = (p: 'studio' | 'services' | 'contact') => {
    if (stateRef.current === 'detail') {
      closeDetail();
    }
    setContentOpen(true);
    setScrollTarget(p);
  };

  const openServicesFromDetail = async () => {
    if (stateRef.current !== 'detail') return;
    await new Promise<void>((resolve) => {
      closeBackResolverRef.current = resolve;
      closeDetail();
    });
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    setContentOpen(true);
    setScrollTarget('services');
  };

  /* =======================================================================
     Keyboard support
     ======================================================================= */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (stateRef.current === 'detail') closeDetail();
        else if (contentOpen) setContentOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [contentOpen]);

  /* =======================================================================
     Render
     ======================================================================= */
  return (
    <div
      ref={rootRef}
      className="fixed inset-0 overflow-hidden select-none"
      style={{ touchAction: 'none', background: V.bg }}
    >
      {/* پس‌زمینهٔ رادیال */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-500"
        style={{ background: V.radial }}
      />

      <TopNav
        theme={theme}
        onThemeChange={setTheme}
        onNavigate={navigateTo}
        topText={V.topText}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* راهنمای پایین صفحه */}
      <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between px-5 md:px-8 py-5 pointer-events-none">
        <span className="text-[11px] text-white/60">اسکرول · بکشید · کلیک کنید</span>
        <span className="text-[11px] text-white/60">
          {toFaDigits(String(visiblePhotos.length).padStart(2, '0'))} /{' '}
          {toFaDigits(String(photos.length).padStart(2, '0'))} اثر
        </span>
      </div>

      {/* ریل افقی بی‌نهایت (چپ‌به‌راست برای محاسبهٔ دقیق حلقهٔ حرکتی) */}
      <div
        ref={trackRef}
        dir="ltr"
        className="absolute left-0 will-change-transform"
        style={{
          top: '50%',
          marginTop: '-170px',
          display: 'flex',
          gap: '44px',
          paddingLeft: '44px',
          zIndex: 10,
        }}
      >
        {items.map(({ photo: p, copy }, i) => (
          <div
            key={`${p.id}-${copy}-${i}`}
            data-image-id={p.id}
            data-clone-index={copy}
            onMouseEnter={(e) => {
              if (closeHandoffActiveRef.current) return;
              if (hoverSuppressedItemRef.current) {
                const el = hoverSuppressedItemRef.current;
                if (el && !el.isConnected) hoverSuppressedItemRef.current = null;
              }
              activateHover(e.currentTarget as HTMLElement, p);
            }}
            onMouseLeave={() => {
              deactivateHover();
            }}
            onClick={(e) => openDetail(p, e.currentTarget as HTMLElement)}
            className="gallery-item relative shrink-0 cursor-pointer w-[210px] h-[320px] md:w-[240px] md:h-[360px]"
          >
            <div
              className="gallery-visual absolute inset-0 transition-colors duration-500"
              style={{ borderRadius: '9999px', overflow: 'hidden', background: V.itemBg }}
            >
              <SmartImage
                src={p.src}
                fallbackSrc={p.fallbackSrc}
                fallbackTitle={p.title}
                alt={p.title}
                loading="eager"
                draggable={false}
                className="w-full h-full pointer-events-none"
                style={{ objectFit: 'cover', objectPosition: 'center', display: 'block' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* عنوان مرکزی */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center"
        style={{ zIndex: 20 }}
      >
        <div
          className="font-fa-head text-[72px] md:text-[124px] leading-[1.12] text-white"
          style={{ textShadow: '0 8px 36px rgba(0,0,0,0.16)' }}
        >
          کارن
        </div>
        <div className="mt-3 text-[12px] md:text-[13px] text-white/85">یک استودیوی عکاسی</div>
      </div>

      {/* لایهٔ هاور */}
      <div
        ref={hoverLayerRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 30 }}
      />

      {/* نمای جزئیات */}
      <Detail
        ref={detailRootRef}
        photo={photo}
        resolvedSrc={resolvedDetailSrc}
        visible={detailVisible}
        textReady={textReady}
        onBack={closeDetail}
        onOpenServices={openServicesFromDetail}
        imageBoxRef={detailImageBoxRef}
        theme={theme}
      />

      {/* لایهٔ گذار نمای جزئیات */}
      <div
        ref={detailOverlayRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 100 }}
      />

      {/* صفحهٔ محتوا */}
      <ContentPage
        open={contentOpen}
        onClose={() => setContentOpen(false)}
        onOpen={() => setContentOpen(true)}
        theme={theme}
        scrollTarget={scrollTarget}
        onScrollHandled={() => setScrollTarget(null)}
      />
    </div>
  );
}
