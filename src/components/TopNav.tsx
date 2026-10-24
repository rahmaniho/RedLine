import { useEffect, useRef, useState } from 'react';
import type { ThemeKey } from '../data/themes';
import { themes } from '../data/themes';
import { categories, categoryLabels, type PhotoCategory } from '../data/photos';
import Icon from './Icon';

type Props = {
  theme: ThemeKey;
  onThemeChange: (t: ThemeKey) => void;
  onNavigate: (p: 'studio' | 'services' | 'contact') => void;
  topText: string;
  filter: 'All' | PhotoCategory;
  onFilterChange: (c: 'All' | PhotoCategory) => void;
};

const NAV_ITEMS: Array<{ id: 'studio' | 'services' | 'contact'; label: string }> = [
  { id: 'studio', label: 'استودیو' },
  { id: 'services', label: 'خدمات' },
  { id: 'contact', label: 'تماس' },
];

export default function TopNav({
  theme,
  onThemeChange,
  onNavigate,
  topText,
  filter,
  onFilterChange,
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const filterWrapRef = useRef<HTMLDivElement>(null);
  const mobileWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen && !mobileMenuOpen) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (filterOpen && filterWrapRef.current && !filterWrapRef.current.contains(target)) {
        setFilterOpen(false);
      }
      if (mobileMenuOpen && mobileWrapRef.current && !mobileWrapRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [filterOpen, mobileMenuOpen]);

  return (
    <header className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="relative flex items-center justify-between px-5 py-5 md:px-8 md:py-6">
        {/* ── برند (سمت راست در چیدمان راست‌به‌چپ) ── */}
        <button
          type="button"
          onClick={() => {
            if (filter !== 'All') onFilterChange('All');
          }}
          className="pointer-events-auto flex items-baseline gap-3 leading-none cursor-pointer text-right"
          aria-label="استودیو کارن"
        >
          <span
            className="font-logo-b text-[26px] text-white"
            style={{ lineHeight: 1 }}
          >
            کارن
          </span>
          <span
            className="text-[11px] text-white/75"
            style={{ color: topText, lineHeight: 1 }}
          >
            استودیو
          </span>
        </button>

        {/* ── منوی میانی (دسکتاپ) ── */}
        <nav className="pointer-events-auto absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-10">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="whitespace-nowrap cursor-pointer text-[13px] text-white/80 hover:text-white transition-colors leading-none fa-track-wide"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* ── فیلتر + پوسته + منوی موبایل (سمت چپ در چیدمان راست‌به‌چپ) ── */}
        <div className="pointer-events-auto flex items-center gap-3 md:gap-4">
          {/* کنترل فیلتر شیشه‌ای */}
          <div ref={filterWrapRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setFilterOpen((v) => !v);
                setMobileMenuOpen(false);
              }}
              className="cursor-pointer flex items-center gap-1.5 h-[32px] pr-3.5 pl-2.5 rounded-full whitespace-nowrap transition-all duration-200 hover:bg-white/15"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.22)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow:
                  '0 1px 12px -4px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
              aria-label="فیلتر گالری"
              aria-expanded={filterOpen}
            >
              <span className="text-[11px] text-white/90 leading-none">
                {categoryLabels[filter]}
              </span>
              <Icon
                name="arrow-down-s"
                className={`text-white/65 text-[14px] transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* پاپ‌آور شیشه‌ای فیلتر */}
            <div
              className="absolute left-0 mt-2 overflow-hidden"
              style={{
                minWidth: '148px',
                borderRadius: '16px',
                background: 'rgba(28,28,32,0.48)',
                border: '1px solid rgba(255,255,255,0.22)',
                backdropFilter: 'blur(28px) saturate(180%)',
                WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                boxShadow:
                  '0 12px 40px -8px rgba(0,0,0,0.32), 0 2px 8px -2px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.18)',
                transformOrigin: 'top left',
                transform: filterOpen ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(-4px)',
                opacity: filterOpen ? 1 : 0,
                pointerEvents: filterOpen ? 'auto' : 'none',
                transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1), opacity 0.16s ease',
              }}
            >
              <ul className="py-[6px]">
                {categories.map((c) => {
                  const isActive = filter === c;
                  return (
                    <li key={c}>
                      <button
                        type="button"
                        onClick={() => {
                          onFilterChange(c);
                          setFilterOpen(false);
                        }}
                        className="w-full text-right px-4 py-[9px] cursor-pointer transition-colors whitespace-nowrap flex items-center gap-3 hover:bg-white/10"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
                        }}
                      >
                        <span
                          className="block w-1.5 h-1.5 rounded-full shrink-0 transition-colors"
                          style={{
                            background: isActive
                              ? 'rgba(255,255,255,0.95)'
                              : 'rgba(255,255,255,0.35)',
                          }}
                        />
                        <span
                          className="text-[12px] leading-none transition-colors"
                          style={{
                            color: isActive
                              ? 'rgba(255,255,255,0.98)'
                              : 'rgba(255,255,255,0.72)',
                          }}
                        >
                          {categoryLabels[c]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* نمونه‌های پوسته */}
          <div className="flex items-center gap-[8px]" role="group" aria-label="انتخاب پوسته رنگی">
            {(Object.keys(themes) as ThemeKey[]).map((k) => {
              const isActive = theme === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onThemeChange(k)}
                  aria-label={themes[k].label}
                  aria-pressed={isActive}
                  title={themes[k].label}
                  className="cursor-pointer rounded-full transition-all duration-200 hover:scale-110"
                  style={{
                    width: isActive ? '18px' : '14px',
                    height: isActive ? '18px' : '14px',
                    background: themes[k].bg,
                    boxShadow: isActive
                      ? '0 0 0 1.5px rgba(255,255,255,0.95), 0 0 0 2.5px rgba(0,0,0,0.15)'
                      : '0 0 0 1px rgba(255,255,255,0.45)',
                  }}
                />
              );
            })}
          </div>

          {/* منوی موبایل */}
          <div ref={mobileWrapRef} className="relative md:hidden">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen((v) => !v);
                setFilterOpen(false);
              }}
              aria-label="منوی صفحات"
              aria-expanded={mobileMenuOpen}
              className="cursor-pointer flex items-center justify-center w-[32px] h-[32px] rounded-full text-white/90 transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.22)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="text-[15px]" />
            </button>

            <div
              className="absolute left-0 mt-2 overflow-hidden"
              style={{
                minWidth: '156px',
                borderRadius: '16px',
                background: 'rgba(28,28,32,0.55)',
                border: '1px solid rgba(255,255,255,0.22)',
                backdropFilter: 'blur(28px) saturate(180%)',
                WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                boxShadow: '0 12px 40px -8px rgba(0,0,0,0.35)',
                transformOrigin: 'top left',
                transform: mobileMenuOpen ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(-4px)',
                opacity: mobileMenuOpen ? 1 : 0,
                pointerEvents: mobileMenuOpen ? 'auto' : 'none',
                transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1), opacity 0.16s ease',
              }}
            >
              <ul className="py-1.5">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onNavigate(item.id);
                      }}
                      className="w-full text-right px-4 py-2.5 text-[13px] text-white/90 hover:bg-white/12 transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
