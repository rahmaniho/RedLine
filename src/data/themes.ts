export type ThemeKey = 'rose' | 'mineral' | 'iris' | 'ink';

export type Theme = {
  label: string;
  bg: string;
  radial: string;
  itemBg: string;
  topText: string;
};

export const themes: Record<ThemeKey, Theme> = {
  rose: {
    label: 'رز گِلی',
    bg: '#D96E6A',
    radial: 'radial-gradient(circle at 50% 45%, #E28480 0%, #D96E6A 55%, #B85956 100%)',
    itemBg: '#B85956',
    topText: 'rgba(255,255,255,0.85)',
  },
  mineral: {
    label: 'آبی کانی',
    bg: '#6088A1',
    radial: 'radial-gradient(circle at 50% 50%, #7699AF 0%, #6088A1 55%, #4C7288 100%)',
    itemBg: '#4E7389',
    topText: 'rgba(255,255,255,0.85)',
  },
  iris: {
    label: 'بنفشه',
    bg: '#8385BE',
    radial: 'radial-gradient(circle at 50% 45%, #9698CB 0%, #8385BE 55%, #6D6FA8 100%)',
    itemBg: '#6E70AA',
    topText: 'rgba(255,255,255,0.85)',
  },
  ink: {
    label: 'مشکی',
    bg: '#2C3138',
    radial: 'radial-gradient(circle at 50% 50%, #3B4149 0%, #2C3138 55%, #1E2228 100%)',
    itemBg: '#1E2228',
    topText: 'rgba(255,255,255,0.75)',
  },
};
