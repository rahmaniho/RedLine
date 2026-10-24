import { forwardRef, useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import type { Photo } from '../data/photos';
import { categoryLabels } from '../data/photos';
import type { ThemeKey } from '../data/themes';
import { themes } from '../data/themes';
import { toFaDigits } from '../utils/format';
import Icon from './Icon';
import SmartImage from './SmartImage';

type Props = {
  photo: Photo | null;
  resolvedSrc?: string | null;
  visible: boolean;
  textReady: boolean;
  onBack: () => void;
  onOpenServices: () => void;
  imageBoxRef: RefObject<HTMLDivElement | null>;
  theme: ThemeKey;
};

const Detail = forwardRef<HTMLDivElement, Props>(function Detail(
  { photo, resolvedSrc, visible, textReady, onBack, onOpenServices, imageBoxRef, theme },
  ref,
) {
  const textRef = useRef<HTMLDivElement>(null);
  const V = themes[theme];

  useEffect(() => {
    if (!textReady || !textRef.current) return;
    const els = textRef.current.querySelectorAll<HTMLElement>('[data-anim]');
    gsap.fromTo(
      els,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.06 },
    );
  }, [textReady, photo?.id]);

  useEffect(() => {
    if (!textReady && textRef.current) {
      const els = textRef.current.querySelectorAll<HTMLElement>('[data-anim]');
      gsap.set(els, { opacity: 0, y: 14 });
    }
  }, [textReady]);

  const isPortrait = photo?.orientation !== 'landscape';

  const coverage =
    photo?.category === 'Wedding'
      ? 'مراسم کامل روز'
      : photo?.category === 'Portrait'
        ? 'جلسهٔ پرتره'
        : photo?.category === 'Travel'
          ? 'سفر نیم‌روز'
          : 'عکاسی در محل';

  const accent = V.bg;
  const INK = '#ffffff';
  const MUTED = 'rgba(255,255,255,0.72)';
  const BORDER = 'rgba(255,255,255,0.18)';

  return (
    <div
      ref={ref}
      className="fixed inset-0 overflow-y-auto md:overflow-hidden"
      style={{
        zIndex: 80,
        visibility: visible ? 'visible' : 'hidden',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.25s ease',
        background: V.radial,
      }}
      aria-hidden={!visible}
    >
      {/* نوار بالای نمای جزئیات */}
      <div className="sticky md:absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 md:px-8 py-5 md:py-6 pointer-events-none">
        <div className="flex items-baseline gap-3 leading-none">
          <span
            className="font-logo-b text-[26px]"
            style={{ lineHeight: 1, color: '#fff' }}
          >
            کارن
          </span>
          <span className="text-[11px] text-white/60" style={{ lineHeight: 1 }}>
            نمای جزئیات
          </span>
        </div>
        <span className="text-[11px] text-white/65">
          {photo ? `شمارهٔ ${toFaDigits(photo.id.replace('photo-', ''))}` : ''}
        </span>
      </div>

      {/* محتوای اصلی نمای جزئیات */}
      <div className="relative min-h-[calc(100%-68px)] md:h-full w-full flex flex-col md:flex-row items-center justify-center px-6 pb-10 pt-2 md:py-0 md:px-16 gap-8 md:gap-16">
        <div
          ref={imageBoxRef}
          className={`relative shrink-0 w-full max-w-[320px] h-[42vh] md:max-w-[780px] ${
            isPortrait ? 'md:w-[38vw] md:h-[78vh]' : 'md:w-[52vw] md:h-[62vh]'
          }`}
          style={{
            borderRadius: '44px',
            overflow: 'hidden',
            background: V.itemBg,
            boxShadow: '0 40px 80px -30px rgba(0,0,0,0.35)',
          }}
        >
          {photo && (
            <SmartImage
              src={resolvedSrc || photo.src}
              fallbackSrc={photo.fallbackSrc}
              fallbackTitle={photo.title}
              alt={photo.title}
              draggable={false}
              className="w-full h-full pointer-events-none"
              style={{ objectFit: 'cover', objectPosition: 'center', display: 'block' }}
            />
          )}
        </div>

        <div ref={textRef} className="w-full flex-1 max-w-md text-right" style={{ color: INK }}>
          <div
            data-anim
            className="inline-flex items-center gap-2.5 mb-5 md:mb-6 px-4 h-[32px] rounded-full"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: `1px solid ${BORDER}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="block w-1.5 h-1.5 rounded-full" style={{ background: '#fff' }} />
            <span className="text-[11px] text-white/90">
              {photo ? `${categoryLabels[photo.category]} · ${toFaDigits(photo.year)}` : ''}
            </span>
          </div>

          <h1
            data-anim
            className="font-fa-head text-[36px] md:text-[52px] leading-[1.25] mb-4"
            style={{ color: INK }}
          >
            {photo?.title}
          </h1>

          <p
            data-anim
            className="text-[15px] leading-[2] mb-6"
            style={{ color: INK, opacity: 0.86 }}
          >
            {photo?.description}
          </p>

          {/* برچسب‌های اثر */}
          {photo?.tags && photo.tags.length > 0 && (
            <div data-anim className="flex flex-wrap gap-2 mb-6">
              {photo.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-3 h-[26px] inline-flex items-center rounded-full text-white/80"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div data-anim className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-7">
            <div
              className="rounded-3xl px-4 py-3.5"
              style={{ background: 'rgba(255,255,255,0.09)', border: `1px solid ${BORDER}` }}
            >
              <div className="text-[10px] text-white/55 mb-1">دامنهٔ پوشش</div>
              <div className="text-[13px]" style={{ color: INK }}>
                {coverage}
              </div>
            </div>
            <div
              className="rounded-3xl px-4 py-3.5"
              style={{ background: 'rgba(255,255,255,0.09)', border: `1px solid ${BORDER}` }}
            >
              <div className="text-[10px] text-white/55 mb-1">قالب</div>
              <div className="text-[13px]" style={{ color: INK }}>
                نگاتیو + دیجیتال
              </div>
            </div>
            {photo?.client && (
              <div
                className="col-span-2 sm:col-span-1 rounded-3xl px-4 py-3.5"
                style={{ background: 'rgba(255,255,255,0.09)', border: `1px solid ${BORDER}` }}
              >
                <div className="text-[10px] text-white/55 mb-1">سفارش‌دهنده</div>
                <div className="text-[13px]" style={{ color: INK }}>
                  {photo.client}
                </div>
              </div>
            )}
          </div>

          {/* دکمهٔ خدمات */}
          <div data-anim className="mb-5">
            <button
              type="button"
              onClick={onOpenServices}
              className="group inline-flex items-center gap-3 h-[48px] pr-6 pl-2.5 rounded-full text-[12px] font-medium whitespace-nowrap cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: '#ffffff', color: accent }}
            >
              مشاهدهٔ خدمات و تعرفه‌ها
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:-translate-x-0.5"
                style={{ background: accent, color: '#fff' }}
              >
                <Icon name="arrow-left" className="text-[14px]" />
              </span>
            </button>
          </div>

          {/* بازگشت */}
          <div data-anim>
            <button
              type="button"
              onClick={onBack}
              className="group inline-flex items-center gap-2 text-[12px] whitespace-nowrap cursor-pointer transition-opacity hover:opacity-100"
              style={{ color: MUTED }}
            >
              <Icon
                name="arrow-right"
                className="text-[14px] transition-transform group-hover:translate-x-0.5"
              />
              بازگشت به گالری
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Detail;
