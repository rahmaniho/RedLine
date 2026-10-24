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
  currentIndex: number;
  totalCount: number;
  visible: boolean;
  textReady: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenServices: () => void;
  imageBoxRef: RefObject<HTMLDivElement | null>;
  theme: ThemeKey;
};

const Detail = forwardRef<HTMLDivElement, Props>(function Detail(
  {
    photo,
    resolvedSrc,
    currentIndex,
    totalCount,
    visible,
    textReady,
    onBack,
    onPrev,
    onNext,
    onOpenServices,
    imageBoxRef,
    theme,
  },
  ref,
) {
  const textRef = useRef<HTMLDivElement>(null);
  const V = themes[theme];

  useEffect(() => {
    if (!textReady || !textRef.current) return;
    const els = textRef.current.querySelectorAll<HTMLElement>('[data-anim]');
    gsap.fromTo(
      els,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.055 },
    );
  }, [textReady, photo?.id]);

  useEffect(() => {
    if (!textReady && textRef.current) {
      const els = textRef.current.querySelectorAll<HTMLElement>('[data-anim]');
      gsap.set(els, { opacity: 0, y: 12 });
    }
  }, [textReady]);

  const isPortrait = photo?.orientation !== 'landscape';

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
      <div className="sticky md:absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 md:px-8 py-5 md:py-6">
        <div className="flex items-baseline gap-3 leading-none pointer-events-none">
          <span
            className="font-logo-b text-[26px]"
            style={{ lineHeight: 1, color: '#fff' }}
          >
            کارن
          </span>
          <span className="text-[11px] text-white/60" style={{ lineHeight: 1 }}>
            تأملی در قاب
          </span>
        </div>

        {/* ناوبری بین قاب‌ها + شمارهٔ اثر */}
        <div className="flex items-center gap-3">
          {totalCount > 1 && (
            <div
              className="inline-flex items-center gap-1 p-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: `1px solid ${BORDER}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <button
                type="button"
                onClick={onPrev}
                title="قابِ پیشین (کلید راست)"
                aria-label="قابِ پیشین"
                className="cursor-pointer w-7 h-7 rounded-full flex items-center justify-center text-white/85 hover:bg-white/15 hover:text-white transition-colors"
              >
                <Icon name="arrow-right" className="text-[13px]" />
              </button>
              <span className="text-[11px] text-white/80 px-2 select-none">
                {toFaDigits(String(currentIndex + 1).padStart(2, '0'))} از{' '}
                {toFaDigits(String(totalCount).padStart(2, '0'))}
              </span>
              <button
                type="button"
                onClick={onNext}
                title="قابِ بعدی (کلید چپ)"
                aria-label="قابِ بعدی"
                className="cursor-pointer w-7 h-7 rounded-full flex items-center justify-center text-white/85 hover:bg-white/15 hover:text-white transition-colors"
              >
                <Icon name="arrow-left" className="text-[13px]" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onBack}
            title="بازگشت به گالری (Esc)"
            aria-label="بازگشت به گالری"
            className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:bg-white/15 hover:text-white transition-colors"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${BORDER}`,
            }}
          >
            <Icon name="close" className="text-[15px]" />
          </button>
        </div>
      </div>

      {/* محتوای اصلی نمای جزئیات */}
      <div className="relative min-h-[calc(100%-72px)] md:h-full w-full flex flex-col md:flex-row items-center justify-center px-6 pb-10 pt-2 md:py-0 md:px-16 gap-8 md:gap-14">
        <div
          ref={imageBoxRef}
          className={`relative shrink-0 w-full max-w-[320px] h-[42vh] md:max-w-[760px] ${
            isPortrait ? 'md:w-[36vw] md:h-[76vh]' : 'md:w-[50vw] md:h-[62vh]'
          }`}
          style={{
            borderRadius: '44px',
            overflow: 'hidden',
            background: V.itemBg,
            boxShadow: '0 40px 80px -30px rgba(0,0,0,0.38)',
          }}
        >
          {photo && (
            <SmartImage
              src={resolvedSrc || photo.src}
              fallbackSrc={photo.fallbackSrc}
              fallbackTitle={photo.title}
              alt={photo.title}
              draggable={false}
              className="w-full h-full pointer-events-none transition-opacity duration-300"
              style={{ objectFit: 'cover', objectPosition: 'center', display: 'block' }}
            />
          )}
        </div>

        <div ref={textRef} className="w-full flex-1 max-w-lg text-right" style={{ color: INK }}>
          <div
            data-anim
            className="inline-flex items-center gap-2.5 mb-5 px-4 h-[32px] rounded-full"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: `1px solid ${BORDER}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="block w-1.5 h-1.5 rounded-full" style={{ background: '#fff' }} />
            <span className="text-[11px] text-white/90">
              {photo
                ? `${categoryLabels[photo.category]} · ${toFaDigits(photo.year)} · فریم ${toFaDigits(photo.id.replace('photo-', ''))}`
                : ''}
            </span>
          </div>

          <h1
            data-anim
            className="font-fa-head text-[34px] md:text-[50px] leading-[1.28] mb-4"
            style={{ color: INK }}
          >
            {photo?.title}
          </h1>

          <p
            data-anim
            className="text-[15px] md:text-[16px] leading-[2.05] mb-6"
            style={{ color: INK, opacity: 0.88 }}
          >
            {photo?.description}
          </p>

          {/* برچسب‌های اثر */}
          {photo?.tags && photo.tags.length > 0 && (
            <div data-anim className="flex flex-wrap gap-2 mb-6">
              {photo.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-3 h-[26px] inline-flex items-center rounded-full text-white/85"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* شناسنامهٔ فنی و مکانی اثر */}
          <div data-anim className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-7">
            <div
              className="rounded-3xl px-4 py-3.5"
              style={{ background: 'rgba(255,255,255,0.09)', border: `1px solid ${BORDER}` }}
            >
              <div className="text-[10px] text-white/55 mb-1">جایگاهِ ثبت</div>
              <div className="text-[13px]" style={{ color: INK }}>
                {photo?.location}
              </div>
            </div>
            <div
              className="rounded-3xl px-4 py-3.5"
              style={{ background: 'rgba(255,255,255,0.09)', border: `1px solid ${BORDER}` }}
            >
              <div className="text-[10px] text-white/55 mb-1">دوربین و نگاتیو</div>
              <div className="text-[13px]" style={{ color: INK }}>
                {photo?.filmStock}
              </div>
            </div>
            <div
              className="rounded-3xl px-4 py-3.5"
              style={{ background: 'rgba(255,255,255,0.09)', border: `1px solid ${BORDER}` }}
            >
              <div className="text-[10px] text-white/55 mb-1">بسترِ اثر</div>
              <div className="text-[13px]" style={{ color: INK }}>
                {photo?.client || 'مجموعهٔ استودیو'}
              </div>
            </div>
          </div>

          {/* دکمهٔ خدمات + بازگشت */}
          <div data-anim className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={onOpenServices}
              className="group inline-flex items-center gap-3 h-[48px] pr-6 pl-2.5 rounded-full text-[12px] font-medium whitespace-nowrap cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: '#ffffff', color: accent }}
            >
              آشنایی با بسته‌ها و تعرفه‌ها
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:-translate-x-0.5"
                style={{ background: accent, color: '#fff' }}
              >
                <Icon name="arrow-left" className="text-[14px]" />
              </span>
            </button>

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
              بازگشت به ریلِ گالری
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Detail;
