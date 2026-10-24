import { categories, categoryLabels, photos, type Photo, type PhotoCategory } from '../data/photos';
import { themes, type ThemeKey } from '../data/themes';
import { toFaDigits } from '../utils/format';
import Icon from './Icon';
import SmartImage from './SmartImage';

type Props = {
  open: boolean;
  onClose: () => void;
  filter: 'All' | PhotoCategory;
  onFilterChange: (c: 'All' | PhotoCategory) => void;
  onSelectPhoto: (photo: Photo) => void;
  theme: ThemeKey;
};

export default function ContactSheetModal({
  open,
  onClose,
  filter,
  onFilterChange,
  onSelectPhoto,
  theme,
}: Props) {
  const V = themes[theme];
  const list = filter === 'All' ? photos : photos.filter((p) => p.category === filter);

  return (
    <div
      data-ignore-observer
      className="fixed inset-0 z-[90] overflow-y-auto transition-all duration-400"
      style={{
        opacity: open ? 1 : 0,
        visibility: open ? 'visible' : 'hidden',
        pointerEvents: open ? 'auto' : 'none',
        background: 'rgba(18, 17, 16, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        color: '#f7f4ef',
      }}
      aria-hidden={!open}
    >
      {/* نوار بالا */}
      <div
        className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 px-6 md:px-14 py-5"
        style={{
          background: 'rgba(18, 17, 16, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        <div className="flex items-baseline gap-3">
          <span className="font-logo-b text-[24px] text-white leading-none">کارن</span>
          <span className="text-[11px] text-white/55">برگهٔ کنتاکت · فهرستِ کاملِ قاب‌ها</span>
        </div>

        {/* فیلتر دسته‌ها */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => {
            const isActive = filter === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onFilterChange(c)}
                className="cursor-pointer h-[32px] px-4 rounded-full text-[11px] transition-all"
                style={{
                  background: isActive ? V.bg : 'rgba(255,255,255,0.07)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.72)',
                  border: `1px solid ${isActive ? V.bg : 'rgba(255,255,255,0.14)'}`,
                }}
              >
                {categoryLabels[c]}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer inline-flex items-center gap-2 h-[34px] px-4 rounded-full text-[11px] text-white/85 hover:text-white hover:bg-white/10 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.16)' }}
        >
          <Icon name="close" className="text-[14px]" />
          بستنِ آرشیو
        </button>
      </div>

      {/* شبکهٔ کنتاکت‌شیت تاریک‌خانه */}
      <div className="max-w-[1320px] mx-auto px-6 md:px-14 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10 pb-6 border-b border-white/10">
          <div>
            <div className="text-[11px] mb-2" style={{ color: V.bg }}>
              آرشیوِ گزیدهٔ استودیو
            </div>
            <h2 className="font-fa-head text-[28px] md:text-[38px] text-white leading-[1.3]">
              ورق‌زدنِ آرام میانِ قاب‌ها
            </h2>
          </div>
          <div className="text-[12px] text-white/55">
            نمایشِ {toFaDigits(list.length)} اثر از {toFaDigits(photos.length)} نگاتیو و قابِ منتخب
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {list.map((p) => {
            const num = toFaDigits(p.id.replace('photo-', ''));
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPhoto(p)}
                className="group text-right cursor-pointer flex flex-col focus:outline-none"
              >
                {/* نوار شمارهٔ فریم به سبک کنتاکت‌شیت آنالوگ */}
                <div className="flex items-center justify-between text-[10px] text-white/45 mb-2 px-1">
                  <span>فریم {num}</span>
                  <span>{toFaDigits(p.year)}</span>
                </div>

                <div
                  className="relative w-full aspect-[3/4] overflow-hidden rounded-[26px] mb-3 transition-transform duration-500 group-hover:-translate-y-1"
                  style={{
                    background: '#252220',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <SmartImage
                    src={p.src}
                    fallbackSrc={p.fallbackSrc}
                    fallbackTitle={p.title}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0) 60%)',
                    }}
                  >
                    <span className="text-[11px] text-white/90 inline-flex items-center gap-1.5">
                      مشاهدهٔ داستانِ قاب
                      <Icon name="arrow-left" className="text-[12px]" />
                    </span>
                  </div>
                </div>

                <div className="px-1">
                  <div className="font-fa-head text-[17px] text-white/95 group-hover:text-white transition-colors">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    {categoryLabels[p.category]} · {p.location}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
