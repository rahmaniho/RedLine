import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { withBasePath } from '../utils/format';

const KARENSOFT_URL = 'https://www.karen-soft.ir';
const DESIGNED_BY_FA = 'طراحی و توسعه:';

const MARK = 'images/karensoft/mark.png';
const WORD_FA = 'images/karensoft/wordmark-fa.png';
const WORD_EN = 'images/karensoft/wordmark-en.png';

const PIXELS = [
  { x: -27, y: 4, s: 4, d: 0 },
  { x: -22, y: 10, s: 3, d: 0.5 },
  { x: -31, y: 12, s: 3, d: 1 },
  { x: -19, y: 16, s: 2.5, d: 1.5 },
] as const;

/**
 * A light band that sweeps continuously across a wordmark image.
 * The band is masked by the image itself, so only the letters light up.
 */
function TextShine({ src, delay }: { src: string; delay: string }) {
  const url = `url("${withBasePath(src)}")`;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
    >
      <span
        className="ks-text-shine absolute inset-y-0 left-0 w-1/2"
        style={{ animationDelay: delay }}
      />
    </span>
  );
}

/**
 * Animated "Designed & Developed by KarenSoft | کارن سافت" footer credit.
 */
export default function KarenSoftCredit() {
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setEntered(true);
      return;
    }
    const el = anchorRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setEntered(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const motionOn = !reduceMotion;
  const labelWords = DESIGNED_BY_FA.split(' ');

  return (
    <a
      ref={anchorRef}
      href={KARENSOFT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${DESIGNED_BY_FA} کارن سافت | KarenSoft — www.karen-soft.ir`}
      title="کارن سافت | KarenSoft — www.karen-soft.ir"
      className="ks-credit group inline-flex flex-col items-center gap-2 sm:flex-row sm:gap-3 no-underline"
    >
      {/* Label: words rise in staggered, then a flowing gradient runs through them */}
      <span className="inline-flex gap-1 text-xs font-semibold fa-track">
        {labelWords.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="ks-label-gradient inline-block"
            style={
              motionOn
                ? {
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'translateY(0)' : 'translateY(12px)',
                    filter: entered ? 'blur(0px)' : 'blur(4px)',
                    transition:
                      'opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1), transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), filter 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                    transitionDelay: `${0.1 + i * 0.12}s`,
                    animationDelay: `${i * 0.15}s`,
                  }
                : undefined
            }
          >
            {word}
          </span>
        ))}
      </span>

      {/* Card with rotating gradient border */}
      <span
        className="relative inline-flex overflow-hidden rounded-2xl p-[1.5px] transition-all duration-500 group-hover:shadow-[0_0_30px_-4px_rgba(34,211,238,0.6)]"
        style={
          motionOn
            ? {
                opacity: entered ? 1 : 0,
                transform: entered ? 'scale(1)' : 'scale(0.92)',
                transition:
                  'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.15s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.15s, box-shadow 0.5s ease',
              }
            : undefined
        }
      >
        <span
          aria-hidden="true"
          className="ks-ring pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[260%] -translate-x-1/2 -translate-y-1/2"
        />

        <span
          dir="ltr"
          className="relative flex items-center gap-3 overflow-hidden rounded-[14px] bg-white py-2 pl-2.5 pr-3.5"
        >
          {/* Card light sweep */}
          <span
            aria-hidden="true"
            className="ks-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-sky-100/80 to-transparent"
          />

          {/* ── Logo with animated surroundings ── */}
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            {motionOn && (
              <>
                {/* Pulsing ripples */}
                <span
                  aria-hidden="true"
                  className="ks-ripple absolute inset-1 rounded-full border border-sky-400/70"
                />
                <span
                  aria-hidden="true"
                  className="ks-ripple absolute inset-1 rounded-full border border-blue-500/60"
                  style={{ animationDelay: '1.2s' }}
                />
              </>
            )}

            {/* Rotating gradient ring */}
            <span aria-hidden="true" className="ks-logo-ring absolute inset-0 rounded-full" />

            {/* Orbiting glow dot */}
            {motionOn && (
              <span aria-hidden="true" className="ks-orbit absolute inset-0">
                <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.85)]" />
              </span>
            )}

            {/* Soft inner glow */}
            <span
              aria-hidden="true"
              className="absolute inset-[5px] rounded-full bg-gradient-to-br from-sky-50 to-white"
            />

            {/* KS mark */}
            <span
              className={`ks-mark-wrap relative block h-9 w-9 ${entered ? 'ks-entered' : ''}`}
              style={
                motionOn && !entered
                  ? { opacity: 0, transform: 'scale(0.3) rotate(-180deg)' }
                  : undefined
              }
            >
              {motionOn &&
                PIXELS.map((p, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="ks-pixel absolute rounded-[1px] bg-blue-600"
                    style={
                      {
                        width: p.s,
                        height: p.s,
                        left: '50%',
                        top: '50%',
                        '--px': `${p.x}px`,
                        '--py': `${p.y}px`,
                        animationDelay: `${p.d}s`,
                      } as CSSProperties
                    }
                  />
                ))}
              <img
                src={withBasePath(MARK)}
                alt=""
                width={256}
                height={256}
                loading="lazy"
                className={`relative h-full w-full object-contain ${motionOn ? 'ks-float' : ''}`}
              />
            </span>
          </span>

          <span
            aria-hidden="true"
            className="h-9 w-px bg-gradient-to-b from-transparent via-sky-300 to-transparent"
          />

          {/* ── Wordmarks: reveal, then continuous light sweep across the letters ── */}
          <span className="flex flex-col items-center gap-1">
            <span
              className="relative block"
              style={
                motionOn
                  ? {
                      opacity: entered ? 1 : 0,
                      clipPath: entered ? 'inset(0 0% 0 0%)' : 'inset(0 0 0 100%)',
                      transition:
                        'opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.35s, clip-path 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.35s',
                    }
                  : undefined
              }
            >
              <img
                src={withBasePath(WORD_FA)}
                alt="کارن سافت"
                width={383}
                height={96}
                loading="lazy"
                className="block h-6 w-auto"
              />
              {motionOn && <TextShine src={WORD_FA} delay="1.4s" />}
            </span>

            <span
              className="relative block"
              style={
                motionOn
                  ? {
                      opacity: entered ? 1 : 0,
                      clipPath: entered ? 'inset(0 0% 0 0%)' : 'inset(0 100% 0 0)',
                      transition:
                        'opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.55s, clip-path 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.55s',
                    }
                  : undefined
              }
            >
              <img
                src={withBasePath(WORD_EN)}
                alt="KarenSoft"
                width={410}
                height={48}
                loading="lazy"
                className="block h-[11px] w-auto"
              />
              {motionOn && <TextShine src={WORD_EN} delay="1.9s" />}
            </span>
          </span>
        </span>
      </span>
    </a>
  );
}
