import { useEffect, useRef, useState, type FormEvent } from 'react';
import { themes, type ThemeKey } from '../data/themes';
import type { PhotoCategory } from '../data/photos';
import Icon from './Icon';
import KarenSoftCredit from './KarenSoftCredit';
import SmartImage from './SmartImage';

type Props = {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  theme: ThemeKey;
  scrollTarget: 'top' | 'studio' | 'services' | 'contact' | null;
  onScrollHandled: () => void;
};

const HANDLE_PEEK = 26;
const CONTENT_BASE = '#ffffff';
const CONTENT_INK = '#141210';
const CONTENT_MUTED = '#857d75';
const CONTENT_BORDER = 'rgba(20,18,16,0.09)';

const CUSTOM_FORM_ENDPOINT = (import.meta.env.VITE_FORM_ENDPOINT as string | undefined)?.trim() || '';
const LOCAL_STORAGE_KEY = 'karan_studio_inquiries';

const SERVICES: Array<{
  id: PhotoCategory;
  k: string;
  d: string;
  m: readonly string[];
  p: string;
}> = [
  {
    id: 'Portrait',
    k: 'تک‌چهره و پرتره',
    d: 'نشست‌های خلوتِ فردی، دونفره و پرتره‌های ادیتوریال برای هنرمندان، طراحان و نشریات مستقل.',
    m: ['۹۰ دقیقه عکاسی بی‌شتاب', 'بیش از ۲۵ قابِ ویرایش‌شده', 'نگاتیو قطعِ متوسط + دیجیتال'],
    p: 'از ۴۵۰ یورو',
  },
  {
    id: 'Wedding',
    k: 'آیینِ پیوند و عروسی',
    d: 'روایتِ مستند و شاعرانهٔ روزِ پیوند؛ از خلوتِ صبحگاهی و عقدهای صمیمی تا ضیافت‌های شبانه.',
    m: ['۶ تا ۱۰ ساعت حضورِ پیوسته', 'گالری اختصاصی آنلاین', 'امکانِ سفارشِ آلبومِ چاپِ دستی'],
    p: 'از ۱٬۸۰۰ یورو',
  },
  {
    id: 'Travel',
    k: 'سفرنامه و مقصد',
    d: 'هم‌سفری در شهرها و طبیعتِ دوردست برای ثبتِ داستان‌های عاشقانه، مستندِ سفر و پرونده‌های تجسمی.',
    m: ['پوششِ نیم‌روز یا تمام‌روز', 'مکان‌یابی و بازبینیِ نور پیش از عکاسی', 'تحویلِ نسخهٔ چاپیِ گزیده'],
    p: 'از ۶۵۰ یورو',
  },
];

const PROCESS = [
  {
    n: '۰۱',
    l: 'هم‌سویی و شناخت',
    d: 'گفت‌وگویی صمیمانه برای شنیدنِ قصهٔ شما، شناختِ سلیقه‌تان و انتخابِ بهترین ساعتِ نور و مکان.',
  },
  {
    n: '۰۲',
    l: 'ثبتِ بی‌شتاب',
    d: 'عکاسی در فضایی آرام و به دور از ژست‌های تصنعی؛ با تلفیقِ گرمای نگاتیو و دقتِ دوربین دیجیتال.',
  },
  {
    n: '۰۳',
    l: 'پالایش و پیشکش',
    d: 'تصحیحِ رنگِ دانهبه‌دانهٔ قاب‌ها و تقدیمِ مجموعه در یک گالری خصوصی با کیفیتِ چاپِ نمایشگاهی.',
  },
] as const;

const TEAM = [
  {
    n: 'میلا هانسن',
    r: 'عکاسِ ارشد و مدیر هنری',
    b: 'دلبستهٔ نورِ پنجره‌های شمالی و پرتره‌هایی که در سکوت شکل می‌گیرند.',
  },
  {
    n: 'یوناس رید',
    r: 'عکاسِ مستند و تهیه‌کننده',
    b: 'راویِ سفرها، معماریِ بومی و لحظه‌های پیش‌بینی‌نشده در حاشیهٔ مراسم.',
  },
];

const NOTES = [
  {
    q: '«حضورِ میلا و یوناس در جمعِ کوچکِ ما چنان آرام و نامرئی بود که فراموش کردیم دوربینی در کار است؛ اما وقتی قاب‌ها رسیدند، تک‌تکِ لبخندها و اشک‌های آن عصر زنده شده بود.»',
    a: 'النا و مارتین — پروانس',
  },
  {
    q: '«برای نخستین بار در برابرِ دوربین احساسِ بیگانگی نکردم. آن‌ها عجله‌ای برای شاتر زدن نداشتند؛ صبر کردند تا چهرهٔ واقعی‌ام از پسِ خستگیِ روز پیدا شود.»',
    a: 'سورن لیند — طراح و بنیان‌گذارِ خانهٔ پوشاک هالدن',
  },
] as const;

const FAQS = [
  {
    q: 'آیا تمامِ پروژه‌ها با فیلم آنالوگ عکاسی می‌شوند؟',
    a: 'بخشِ مهمی از هویتِ بصریِ استودیو کارن بر پایهٔ نگاتیوهای قطعِ متوسط (۱۲۰) و ۳۵ میلی‌متری شکل گرفته است؛ بااین‌حال، برای اطمینانِ کامل در لحظاتِ تکرارناپذیر و نورهای دشوارِ شبانه، عکاسیِ دیجیتالِ هم‌تراز نیز در کنارِ آنالوگ انجام می‌شود تا یکدستی و امنیتِ روایت حفظ گردد.',
  },
  {
    q: 'برای عکاسی در شهرها یا کشورهای دیگر چگونه هماهنگ می‌شوید؟',
    a: 'ما در کپن‌هاگ مستقر هستیم اما بیش از نیمی از سال را برای ثبتِ پیوندها و پروژه‌های ادیتوریال در سراسر اروپا، خاورمیانه و دیگر نقاطِ جهان در سفریم. هزینه‌های رفت‌وآمد پیش از نهایی‌شدنِ قرارداد، کاملاً شفاف و یکجا برآورد می‌شود.',
  },
  {
    q: 'تکمیل و تحویلِ نهاییِ عکس‌ها چقدر زمان می‌برد؟',
    a: 'برای نشست‌های پرتره و سفرنامه، گالریِ نهایی ظرفِ ۲ هفته آماده می‌شود. در پروژه‌های کاملِ پیوند و عروسی، گزیده‌ای از قاب‌های نخستین در هفتهٔ اول و مجموعهٔ کامل پس از ظهور، اسکنِ نگاتیوها و پالایشِ رنگ، طیِ ۴ تا ۶ هفته پیشکش خواهد شد.',
  },
  {
    q: 'آیا امکانِ سفارشِ چاپِ دستی و آلبومِ کالکتور وجود دارد؟',
    a: 'بله؛ ما با یک کارگاهِ صحافیِ سنتی همکاری می‌کنیم و می‌توانیم برگزیدهٔ عکس‌های شما را بر کاغذهای پنبه‌ایِ بدونِ اسید (Archival Fine Art Paper) در قالبِ جعبهٔ کلکسیونی یا کتابِ نفیسِ پارچه‌کوب آماده کنیم.',
  },
] as const;

const STUDIO_SLIDES = [
  {
    src: 'https://readdy.ai/api/search-image?query=A%20quiet%20editorial%20portrait%20of%20a%20photographer%20holding%20an%20analog%20medium%20format%20camera%20in%20a%20soft%20naturally%20lit%20Scandinavian%20studio%2C%20warm%20off-white%20walls%2C%20wooden%20floor%2C%20minimal%20props%2C%20film%20grain%2C%20natural%20window%20light%20from%20the%20side%2C%20muted%20warm%20color%20palette%2C%20calm%20contemplative%20mood%2C%20refined%20editorial%20photography%20aesthetic%2C%20medium%20focal%20length%2C%20soft%20shadows&width=1200&height=1400&seq=lumen-studio-portrait-1&orientation=portrait',
    fallbackSrc:
      'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=1000&q=80',
    alt: 'میلا هانسن در آتلیهٔ عکاسی کارن',
  },
  {
    src: 'https://readdy.ai/api/search-image?query=A%20calm%20editorial%20portrait%20of%20a%20male%20photographer%20and%20producer%20reviewing%20contact%20sheets%20on%20a%20wooden%20studio%20table%20in%20a%20Scandinavian%20photography%20studio%2C%20soft%20natural%20window%20light%2C%20warm%20off-white%20walls%2C%20muted%20earth%20tones%2C%20film%20grain%2C%20contemplative%20refined%20editorial%20photography%20mood%2C%20medium%20focal%20length%2C%20soft%20shadows&width=1200&height=1400&seq=lumen-studio-portrait-2&orientation=portrait',
    fallbackSrc:
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1000&q=80',
    alt: 'یوناس رید در حال بررسی برگه‌های کنتاکت در آتلیهٔ کارن',
  },
];

export default function ContentPage({
  open,
  onClose,
  onOpen,
  theme,
  scrollTarget,
  onScrollHandled,
}: Props) {
  const V = themes[theme];
  const accent = V.bg;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<'studio' | 'services' | 'contact'>('studio');

  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const [interest, setInterest] = useState<PhotoCategory>('Portrait');
  const [studioSlide, setStudioSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const INTEREST_LABELS: Record<PhotoCategory, string> = {
    Portrait: 'تک‌چهره و پرتره',
    Wedding: 'آیینِ پیوند و عروسی',
    Travel: 'سفرنامه و مقصد',
  };

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setStudioSlide((s) => (s + 1) % STUDIO_SLIDES.length);
    }, 5500);
    return () => clearInterval(id);
  }, [open]);

  const translateY = open ? `-${HANDLE_PEEK}px` : `calc(100vh - ${HANDLE_PEEK}px)`;

  useEffect(() => {
    if (!open || !scrollTarget) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const t = setTimeout(() => {
      if (scrollTarget === 'top') {
        scroller.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = scroller.querySelector<HTMLElement>(`#${scrollTarget}`);
        if (el) scroller.scrollTo({ top: Math.max(0, el.offsetTop - 84), behavior: 'smooth' });
      }
      onScrollHandled();
    }, 650);
    return () => clearTimeout(t);
  }, [open, scrollTarget, onScrollHandled]);

  useEffect(() => {
    if (!open) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => {
      const y = scroller.scrollTop + 160;
      const ids: Array<'studio' | 'services' | 'contact'> = ['studio', 'services', 'contact'];
      let current: 'studio' | 'services' | 'contact' = 'studio';
      for (const id of ids) {
        const el = scroller.querySelector<HTMLElement>(`#${id}`);
        if (el && el.offsetTop <= y) current = id;
      }
      setActiveSection(current);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [open]);

  const scrollToSection = (id: 'studio' | 'services' | 'contact') => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const el = scroller.querySelector<HTMLElement>(`#${id}`);
    if (el) scroller.scrollTo({ top: Math.max(0, el.offsetTop - 84), behavior: 'smooth' });
  };

  const selectServiceAndScroll = (category: PhotoCategory) => {
    setInterest(category);
    scrollToSection('contact');
  };

  const scrollToTop = () => {
    scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmitInquiry = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const honey = (fd.get('company_alt') || '').toString().trim();
    if (honey) {
      setFormStatus('success');
      formEl.reset();
      setInterest('Portrait');
      return;
    }
    fd.delete('company_alt');

    const name = (fd.get('name') || '').toString().trim();
    const email = (fd.get('email') || '').toString().trim();
    const message = (fd.get('message') || '').toString().trim();

    if (!name || !email) {
      setFormStatus('error');
      setFormError('لطفاً نامِ خود و نشانیِ ایمیل را بنویسید تا امکانِ پاسخ‌گویی فراهم باشد.');
      return;
    }

    if (message.length > 600) {
      setFormStatus('error');
      setFormError('لطفاً شرحِ پروژه را در حدودِ ۶۰۰ نویسه خلاصه بفرمایید.');
      return;
    }

    setFormStatus('sending');
    setFormError('');

    const payload = {
      id: `inq-${Date.now()}`,
      name,
      email,
      interest,
      preferredDate: (fd.get('preferred_date') || '').toString(),
      location: (fd.get('location') || '').toString().trim(),
      budget: (fd.get('budget') || '').toString().trim(),
      message,
      submittedAt: new Date().toISOString(),
    };

    try {
      if (CUSTOM_FORM_ENDPOINT) {
        const body = new URLSearchParams();
        fd.forEach((v, k) => body.append(k, v.toString()));
        const res = await fetch(CUSTOM_FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });
        if (!res.ok) {
          throw new Error('ارسال به سرور با خطا مواجه شد.');
        }
      } else {
        await new Promise((r) => setTimeout(r, 550));
      }

      try {
        const prevRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const prev = prevRaw ? (JSON.parse(prevRaw) as unknown[]) : [];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([payload, ...prev].slice(0, 50)));
      } catch {
        // Ignore storage quota / privacy mode restrictions
      }

      setFormStatus('success');
      formEl.reset();
      setInterest('Portrait');
    } catch {
      setFormStatus('error');
      setFormError('اختلالی در ارسالِ پیام پیش آمد؛ لطفاً دمی دیگر دوباره بیازمایید.');
    }
  };

  const NAV = [
    { id: 'studio' as const, label: 'استودیو' },
    { id: 'services' as const, label: 'خدمات' },
    { id: 'contact' as const, label: 'گفت‌وگو' },
  ];

  return (
    <div className="fixed inset-0 z-[95]" style={{ pointerEvents: 'none' }} aria-hidden={!open}>
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          height: `calc(100vh + ${HANDLE_PEEK}px)`,
          transform: `translateY(${translateY})`,
          transition: open
            ? 'transform 0.85s cubic-bezier(0.7, 0, 0.15, 1)'
            : 'transform 0.72s cubic-bezier(0.7, 0, 0.15, 1)',
          willChange: 'transform',
        }}
      >
        {/* دستگیرهٔ کشویی */}
        <button
          type="button"
          onClick={open ? onClose : onOpen}
          aria-label={open ? 'بازگشت به گالری' : 'ورود به دفترِ استودیو'}
          title={open ? 'بازگشت به گالری' : 'ورق‌زدنِ دفترِ استودیو و خدمات'}
          className="lumen-handle-tab absolute top-0 left-1/2 flex items-center justify-center cursor-pointer"
          style={{
            transform: 'translateX(-50%)',
            width: '136px',
            height: `${HANDLE_PEEK + 14}px`,
            background: CONTENT_BASE,
            borderTopLeftRadius: '999px',
            borderTopRightRadius: '999px',
            boxShadow: '0 -6px 24px -6px rgba(30,25,20,0.16)',
            pointerEvents: 'auto',
          }}
        >
          <span
            className="absolute top-[7px] left-1/2 -translate-x-1/2 block rounded-full transition-all duration-500"
            style={{
              width: '28px',
              height: '2px',
              background: open ? '#c8bfb6' : accent,
              opacity: open ? 0.7 : 0.9,
            }}
          />
          <span
            className="absolute left-1/2 flex items-center justify-center transition-transform duration-500"
            style={{
              top: '13px',
              width: '16px',
              height: '16px',
              transform: open
                ? 'translateX(-50%) rotate(180deg)'
                : 'translateX(-50%) rotate(0deg)',
            }}
          >
            <Icon name="arrow-up-s" style={{ fontSize: '16px', color: CONTENT_MUTED }} />
          </span>
        </button>

        {/* بدنهٔ اسکرول‌شونده */}
        <div
          ref={scrollerRef}
          className="absolute left-0 right-0 overflow-y-auto"
          style={{
            top: `${HANDLE_PEEK}px`,
            height: '100vh',
            background: CONTENT_BASE,
            color: CONTENT_INK,
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          {/* سربرگ چسبان */}
          <div
            className="sticky top-0 z-20 px-6 md:px-14 py-4 md:py-5"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderBottom: `1px solid ${CONTENT_BORDER}`,
            }}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={scrollToTop}
                className="flex items-baseline gap-3 leading-none cursor-pointer"
              >
                <span
                  className="font-logo-b text-[26px]"
                  style={{ lineHeight: 1, color: CONTENT_INK }}
                >
                  کارن
                </span>
                <span className="text-[11px] text-[#8a827b] leading-none">آتلیهٔ عکاسی</span>
              </button>

              <nav className="hidden md:flex items-center gap-10">
                {NAV.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className="cursor-pointer text-[13px] whitespace-nowrap leading-none transition-colors fa-track-wide"
                      style={{
                        color: isActive ? accent : CONTENT_INK,
                        opacity: isActive ? 1 : 0.58,
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer flex items-center gap-2 text-[12px] whitespace-nowrap transition-colors hover:opacity-70"
                style={{ color: CONTENT_INK }}
              >
                <Icon name="arrow-down" className="text-[15px]" />
                بازگشت به گالری
              </button>
            </div>

            {/* نوار سریع موبایل */}
            <nav className="flex md:hidden items-center gap-2 mt-3 pt-3 border-t border-black/5">
              {NAV.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className="cursor-pointer text-[11px] px-3.5 h-[28px] rounded-full transition-colors"
                    style={{
                      background: isActive ? `${accent}18` : 'transparent',
                      color: isActive ? accent : CONTENT_INK,
                      opacity: isActive ? 1 : 0.65,
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ─────────── ۰۱ استودیو ─────────── */}
          <section id="studio" className="max-w-[1180px] mx-auto px-6 md:px-14 pt-16 md:pt-20 pb-20 md:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-medium mb-6" style={{ color: accent }}>
                    ۰۱ / آتلیه و نگاهِ ما
                  </div>
                  <h2
                    className="font-fa-head leading-[1.35] mb-8"
                    style={{ fontSize: 'clamp(36px, 4.4vw, 60px)', color: CONTENT_INK }}
                  >
                    مستقل؛
                    <br />
                    از سرِ انتخاب.
                  </h2>
                  <p
                    className="mb-5"
                    style={{ fontSize: '16px', lineHeight: 2.05, color: CONTENT_INK, opacity: 0.88 }}
                  >
                    «کارن» آتلیه‌ای مستقل برای عکاسیِ هنری و مستند است؛ جایی در تلاقیِ سکوتِ تک‌چهره،
                    صمیمیتِ آیینِ پیوند و کشفِ بی‌شتابِ سفر. ما در پیِ کارگردانیِ لحظه‌ها و ژست‌های
                    ساختگی نیستیم؛ چشم‌به‌راهِ دَمی می‌مانیم که تصویر، خود لب به سخن بگشاید.
                  </p>
                  <p
                    className="mb-10"
                    style={{ fontSize: '16px', lineHeight: 2.05, color: CONTENT_INK, opacity: 0.74 }}
                  >
                    شمارِ پروژه‌های هر فصل را دانسته محدود نگه می‌داریم تا از نخستین هم‌صحبتی تا
                    پالایشِ واپسین نگاتیو، همهٔ مسیر را بی‌واسطه، آرام و در پیوندی نزدیک همراهِ شما
                    بمانیم.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {[
                    ['استقرار', 'کپن‌هاگ، دانمارک'],
                    ['گسترهٔ سفر', 'اروپا، خاورمیانه و سراسر جهان'],
                    ['نشستِ حضوری', 'با هماهنگیِ پیشین'],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="inline-flex items-center gap-3 px-4 h-[40px] rounded-full transition-colors"
                      style={{ background: 'transparent', border: `1px solid ${CONTENT_BORDER}` }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${accent}12`;
                        e.currentTarget.style.borderColor = `${accent}55`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = CONTENT_BORDER;
                      }}
                    >
                      <span className="text-[11px] text-[#8a827b]">{k}</span>
                      <span className="text-[13px]" style={{ color: CONTENT_INK }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* اسلایدر پرتره تیم استودیو */}
              <div className="lg:col-span-6">
                <div
                  className="relative w-full overflow-hidden"
                  style={{ height: '440px', borderRadius: '48px', background: '#ecd8c9' }}
                >
                  {STUDIO_SLIDES.map((sl, i) => (
                    <SmartImage
                      key={sl.src}
                      src={sl.src}
                      fallbackSrc={sl.fallbackSrc}
                      fallbackTitle={sl.alt}
                      alt={sl.alt}
                      className="absolute inset-0 w-full h-full transition-opacity duration-[900ms] ease-out"
                      style={{
                        objectFit: 'cover',
                        objectPosition: 'center',
                        opacity: studioSlide === i ? 1 : 0,
                      }}
                    />
                  ))}
                  <div className="absolute bottom-5 right-6 flex items-center gap-2 z-10">
                    {STUDIO_SLIDES.map((_, i) => {
                      const isActive = studioSlide === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          aria-label={`نمایش تصویر ${i + 1}`}
                          onClick={() => setStudioSlide(i)}
                          className="cursor-pointer rounded-full transition-all"
                          style={{
                            width: isActive ? 22 : 8,
                            height: 8,
                            background: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* اعضای تیم */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 px-2">
                  {TEAM.map((p, i) => {
                    const isActive = studioSlide === i;
                    return (
                      <button
                        key={p.n}
                        type="button"
                        onClick={() => setStudioSlide(i)}
                        className="text-right cursor-pointer transition-opacity"
                        style={{ opacity: isActive ? 1 : 0.55 }}
                      >
                        <div className="text-[15px] font-medium mb-1" style={{ color: CONTENT_INK }}>
                          {p.n}
                        </div>
                        <div
                          className="text-[12px] mb-1.5"
                          style={{ color: isActive ? accent : CONTENT_MUTED }}
                        >
                          {p.r}
                        </div>
                        <div className="text-[12px] leading-[1.8] text-[#7c746c]">{p.b}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* مانیفستِ هنری استودیو */}
            <div
              className="mt-20 p-8 md:p-12 rounded-[40px]"
              style={{
                background: `${accent}09`,
                border: `1px solid ${accent}1f`,
              }}
            >
              <div className="text-[11px] mb-4" style={{ color: accent }}>
                بوطیقای تصویر در کارن
              </div>
              <blockquote
                className="font-fa-head text-[22px] md:text-[30px] leading-[1.75] m-0"
                style={{ color: CONTENT_INK }}
              >
                «ما به عکس‌هایی دل بسته‌ایم که صدای نفس‌کشیدنِ لحظه در آن‌ها شنیده می‌شود؛ قاب‌هایی
                دور از هیاهو، که سال‌ها بعد نیز همان گرمای نخستین نگاه را در تار و پودِ دانهٔ فیلم
                زنده نگه می‌دارند.»
              </blockquote>
            </div>
          </section>

          {/* ─────────── ۰۲ خدمات ─────────── */}
          <section id="services" className="max-w-[1180px] mx-auto px-6 md:px-14 pt-10 md:pt-14 pb-20 md:pb-24">
            <div className="mb-12">
              <div className="text-[11px] font-medium mb-6" style={{ color: accent }}>
                ۰۲ / قلمروِ روایت و تعرفه‌ها
              </div>
              <h2
                className="font-fa-head leading-[1.35] mb-6"
                style={{ fontSize: 'clamp(36px, 4.4vw, 60px)', color: CONTENT_INK }}
              >
                سه دریچه به روایتِ تصویر.
              </h2>
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: 2,
                  color: CONTENT_INK,
                  opacity: 0.8,
                  maxWidth: '660px',
                }}
              >
                هر پروژه آهنگی یگانه دارد؛ از خلوتِ یک تک‌چهره در روشناییِ صبح تا شکوهِ آیینِ پیوند و
                سفرهای دوردست، با زمان‌بندیِ روشن و برآوردِ شفاف.
              </p>
            </div>

            <div
              className="overflow-hidden"
              style={{ borderRadius: '40px', border: `1px solid ${CONTENT_BORDER}` }}
            >
              {SERVICES.map((s, idx) => (
                <div
                  key={s.k}
                  onClick={() => selectServiceAndScroll(s.id)}
                  className="cursor-pointer transition-colors hover:bg-black/[0.018]"
                  style={{ borderTop: idx === 0 ? 'none' : `1px solid ${CONTENT_BORDER}` }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center px-6 md:px-10 py-8 md:py-9">
                    <div className="md:col-span-4 flex items-center gap-5">
                      <span
                        className="inline-flex items-center justify-center rounded-full text-[11px] shrink-0"
                        style={{
                          width: 44,
                          height: 44,
                          background: '#fff',
                          border: `1px solid ${CONTENT_BORDER}`,
                          color: accent,
                        }}
                      >
                        {`۰${idx + 1}`}
                      </span>
                      <div
                        className="font-fa-head text-[26px] md:text-[31px] leading-[1.35]"
                        style={{ color: CONTENT_INK }}
                      >
                        {s.k}
                      </div>
                    </div>
                    <div className="md:col-span-5">
                      <p
                        style={{
                          fontSize: '15px',
                          lineHeight: 1.95,
                          color: CONTENT_INK,
                          opacity: 0.84,
                          marginBottom: 12,
                        }}
                      >
                        {s.d}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {s.m.map((li) => (
                          <span
                            key={li}
                            className="text-[11px] px-3 h-[28px] inline-flex items-center rounded-full"
                            style={{
                              background: '#fff',
                              color: CONTENT_MUTED,
                              border: `1px solid ${CONTENT_BORDER}`,
                            }}
                          >
                            {li}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-3 md:text-left">
                      <div className="text-[10px] text-[#8a827b] mb-1">پایهٔ سرمایه‌گذاری</div>
                      <div className="font-fa-head text-[22px]" style={{ color: accent }}>
                        {s.p}
                      </div>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#8a827b]">
                        <span>انتخابِ این روایت</span>
                        <Icon name="arrow-left" className="text-[12px]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* فرایند کار */}
            <div className="mt-20">
              <div className="text-[12px] font-medium mb-8" style={{ color: CONTENT_MUTED }}>
                آیینِ همکاریِ ما
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PROCESS.map((p) => (
                  <div key={p.n} className="flex items-start gap-4">
                    <span
                      className="inline-flex items-center justify-center rounded-full text-[11px] shrink-0"
                      style={{ width: 38, height: 38, background: `${accent}15`, color: accent }}
                    >
                      {p.n}
                    </span>
                    <div className="pt-1">
                      <div className="text-[15px] font-medium mb-1.5" style={{ color: CONTENT_INK }}>
                        {p.l}
                      </div>
                      <div
                        className="text-[13px]"
                        style={{ color: CONTENT_INK, opacity: 0.7, lineHeight: 1.95 }}
                      >
                        {p.d}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* واگویهٔ همراهان */}
            <div className="mt-24">
              <div className="text-[12px] font-medium mb-8" style={{ color: CONTENT_MUTED }}>
                واگویهٔ همراهان
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {NOTES.map((item) => (
                  <div
                    key={item.a}
                    className="rounded-[34px] p-7 md:p-9 flex flex-col justify-between"
                    style={{
                      background: '#faf8f5',
                      border: `1px solid ${CONTENT_BORDER}`,
                    }}
                  >
                    <p
                      className="text-[15px] leading-[2.05] mb-6"
                      style={{ color: CONTENT_INK, opacity: 0.86 }}
                    >
                      {item.q}
                    </p>
                    <div className="text-[12px]" style={{ color: accent }}>
                      {item.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* پرسش‌های پرتکرار */}
            <div className="mt-24">
              <div className="text-[12px] font-medium mb-6" style={{ color: CONTENT_MUTED }}>
                پرسش‌های آشنا
              </div>
              <div
                className="rounded-[34px] overflow-hidden"
                style={{ border: `1px solid ${CONTENT_BORDER}` }}
              >
                {FAQS.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div
                      key={faq.q}
                      style={{ borderTop: i === 0 ? 'none' : `1px solid ${CONTENT_BORDER}` }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        className="w-full px-6 md:px-9 py-5 text-right flex items-center justify-between gap-4 cursor-pointer hover:bg-black/[0.015] transition-colors"
                      >
                        <span className="text-[15px] font-medium" style={{ color: CONTENT_INK }}>
                          {faq.q}
                        </span>
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300"
                          style={{
                            background: isOpen ? `${accent}18` : 'rgba(20,18,16,0.04)',
                            color: isOpen ? accent : CONTENT_MUTED,
                            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                          }}
                        >
                          <Icon name="plus" className="text-[16px]" />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-6 md:px-9 pb-6 text-[14px] leading-[2.05] text-[#5c554e]">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ─────────── ۰۳ گفت‌وگو و تماس ─────────── */}
          <section id="contact" className="max-w-[1180px] mx-auto px-6 md:px-14 pt-12 md:pt-16 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-medium mb-6" style={{ color: accent }}>
                    ۰۳ / هم‌صحبتی و رزروِ تقویم
                  </div>
                  <h2
                    className="font-fa-head leading-[1.35] mb-8"
                    style={{ fontSize: 'clamp(36px, 4.4vw, 58px)', color: CONTENT_INK }}
                  >
                    قصهٔ بعدی را
                    <br />
                    با هم
                    <br />
                    قاب بگیریم.
                  </h2>
                  <p
                    className="mb-10"
                    style={{ fontSize: '16px', lineHeight: 2.05, color: CONTENT_INK, opacity: 0.82 }}
                  >
                    از حال‌وهوایی که در سر دارید برایمان بنویسید؛ تقویمِ روزهای آزاد و پیشنهادی دقیق
                    متناسب با داستانِ شما برایتان ارسال خواهیم کرد.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-[11px] text-[#8a827b] mb-2">نشانیِ آتلیه</div>
                    <div className="text-[14px]" style={{ color: CONTENT_INK }}>
                      کپن‌هاگ، دانمارک
                    </div>
                    <div className="text-[14px]" style={{ color: CONTENT_INK, opacity: 0.7 }}>
                      پذیرای پروژه‌ها در سراسر جهان
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#8a827b] mb-2">راه‌های ارتباط</div>
                    <a
                      href="mailto:hello@karan.studio"
                      dir="ltr"
                      className="inline-block text-[14px] cursor-pointer hover:opacity-60 transition-opacity"
                      style={{ color: CONTENT_INK }}
                    >
                      hello@karan.studio
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noreferrer"
                      className="block text-[14px] cursor-pointer hover:opacity-60 transition-opacity mt-1"
                      style={{ color: CONTENT_INK }}
                    >
                      صفحهٔ اینستاگرامِ استودیو
                    </a>
                  </div>
                  <div className="pt-4 text-[12px]" style={{ color: CONTENT_MUTED }}>
                    پاسخ‌گوییِ شخصی در کمتر از دو روزِ کاری.
                  </div>
                </div>
              </div>

              {/* فرم داخل پنل بزرگ گرد */}
              <div className="lg:col-span-7">
                <div
                  className="p-6 md:p-10"
                  style={{
                    borderRadius: '44px',
                    background: `${accent}0a`,
                    border: `1px solid ${accent}1f`,
                  }}
                >
                  <form id="karan-inquiry" onSubmit={onSubmitInquiry} className="space-y-6">
                    <input
                      type="text"
                      name="company_alt"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="lumen-honey"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FieldInput
                        label="نامِ شما"
                        name="name"
                        placeholder="مثلاً ارغوان رادمهر"
                        required
                      />
                      <FieldInput
                        label="نشانیِ ایمیل"
                        name="email"
                        type="email"
                        placeholder="name@domain.com"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div>
                      <FieldLabel>موضوعِ روایتِ شما چیست؟</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {(['Portrait', 'Wedding', 'Travel'] as const).map((k) => {
                          const isActive = interest === k;
                          return (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                setInterest(k);
                                if (formStatus === 'success') setFormStatus('idle');
                              }}
                              className="cursor-pointer text-[12px] whitespace-nowrap px-5 h-[40px] rounded-full transition-all"
                              style={{
                                background: isActive ? accent : '#fff',
                                color: isActive ? '#fff' : CONTENT_INK,
                                border: `1px solid ${isActive ? accent : CONTENT_BORDER}`,
                              }}
                            >
                              {INTEREST_LABELS[k]}
                            </button>
                          );
                        })}
                      </div>
                      <input type="hidden" name="interest" value={interest} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FieldInput label="زمانِ پیشنهادی" name="preferred_date" type="date" lang="fa" />
                      <FieldInput
                        label="شهر یا مکانِ برگزاری"
                        name="location"
                        placeholder="مثلاً تهران، پاریس، توسکانی"
                      />
                    </div>

                    <FieldInput
                      label="برآوردِ بودجهٔ مدنظر"
                      name="budget"
                      placeholder="مثلاً ۱٬۵۰۰ تا ۳٬۰۰۰ یورو"
                    />

                    <div>
                      <FieldLabel>داستان و حال‌وهوای مدنظرتان</FieldLabel>
                      <textarea
                        name="message"
                        rows={3}
                        maxLength={600}
                        placeholder="کمی از فضا، نورِ دلخواه، مکان یا احساسی که دوست دارید در عکس‌ها بماند برایمان بنویسید…"
                        className="w-full outline-none px-5 py-4 text-[15px] resize-none rounded-3xl transition-all focus:bg-white"
                        style={{
                          color: CONTENT_INK,
                          background: '#fff',
                          border: `1px solid ${CONTENT_BORDER}`,
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <button
                        type="submit"
                        disabled={formStatus === 'sending'}
                        className="group inline-flex items-center gap-3 h-[50px] pr-6 pl-2.5 rounded-full text-[12px] font-medium whitespace-nowrap cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-60"
                        style={{ background: accent, color: '#fff' }}
                      >
                        {formStatus === 'sending' ? 'در حالِ ارسالِ پیام…' : 'فرستادنِ پیام و استعلامِ تقویم'}
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:-translate-x-0.5"
                          style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}
                        >
                          <Icon name="arrow-left" className="text-[14px]" />
                        </span>
                      </button>

                      {formStatus === 'success' && (
                        <span
                          className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                          style={{ color: accent }}
                        >
                          <Icon name="check" className="text-[15px]" />
                          پیامتان با مهر دریافت شد — به‌زودی پاسخِ شما را می‌فرستیم.
                        </span>
                      )}
                      {formStatus === 'error' && (
                        <span className="text-[12px]" style={{ color: '#b83a3a' }}>
                          {formError}
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* ─────────── فوتر ─────────── */}
          <footer
            style={{
              background: accent,
              color: '#fff',
              borderTopLeftRadius: '64px',
              borderTopRightRadius: '64px',
              marginTop: '40px',
            }}
          >
            <div className="max-w-[1180px] mx-auto px-6 md:px-14 pt-20 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
                <div className="md:col-span-6">
                  <div className="font-logo-b text-[64px] md:text-[88px] leading-none">
                    کارن
                  </div>
                  <div className="mt-4 text-[13px]" style={{ opacity: 0.88 }}>
                    روایتِ آرامِ نور، چهره و سفر
                  </div>
                  <div className="mt-1.5 text-[12px]" style={{ opacity: 0.76 }}>
                    آتلیهٔ مستقلِ عکاسی آنالوگ و دیجیتال · کپن‌هاگ و سراسر جهان
                  </div>
                </div>

                <div className="md:col-span-3">
                  <div className="text-[11px] mb-3" style={{ opacity: 0.75 }}>
                    مکاتبه و پیوند
                  </div>
                  <a
                    href="mailto:hello@karan.studio"
                    dir="ltr"
                    className="inline-block text-[14px] cursor-pointer hover:opacity-70 transition-opacity"
                  >
                    hello@karan.studio
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[14px] cursor-pointer hover:opacity-70 transition-opacity mt-1"
                  >
                    اینستاگرام
                  </a>
                </div>

                <div className="md:col-span-3 md:text-left">
                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="inline-flex items-center gap-3 h-[44px] px-5 rounded-full text-[12px] whitespace-nowrap cursor-pointer group transition-all hover:scale-[1.03]"
                    style={{
                      background: 'rgba(255,255,255,0.14)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.25)',
                    }}
                  >
                    بازگشت به سرآغاز
                    <Icon
                      name="arrow-up"
                      className="text-[14px] transition-transform group-hover:-translate-y-0.5"
                    />
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/20 flex flex-col lg:flex-row items-center justify-between gap-5 text-[11px]">
                <span className="text-white/75">© ۲۰۲۶ آتلیهٔ عکاسی کارن — تمامی حقوق محفوظ است</span>
                <KarenSoftCredit />
                <span className="text-white/75">تک‌چهره · آیینِ پیوند · سفرنامه</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-[#8a827b] mb-3">{children}</div>;
}

function FieldInput({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  lang,
  dir,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  lang?: string;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div>
      <FieldLabel>
        {label}
        {required ? ' *' : ''}
      </FieldLabel>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        lang={lang}
        dir={dir}
        className="w-full outline-none px-5 h-[52px] text-[15px] rounded-full transition-all focus:ring-2 focus:ring-black/10"
        style={{
          color: CONTENT_INK,
          background: '#fff',
          border: `1px solid ${CONTENT_BORDER}`,
          textAlign: dir === 'ltr' ? 'left' : undefined,
        }}
      />
    </div>
  );
}
