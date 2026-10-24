export type ThemeKey = 'rose' | 'mineral' | 'sage' | 'iris' | 'ink';

export type Theme = {
  label: string;
  bg: string;
  radial: string;
  itemBg: string;
  topText: string;
};

export const themes: Record<ThemeKey, Theme> = {
  rose: {
    label: 'رُزِ خاکی',
    bg: '#D96E6A',
    radial: 'radial-gradient(circle at 50% 45%, #E38682 0%, #D96E6A 55%, #B65754 100%)',
    itemBg: '#B85956',
    topText: 'rgba(255,255,255,0.86)',
  },
  mineral: {
    label: 'آبیِ سنگی',
    bg: '#6088A1',
    radial: 'radial-gradient(circle at 50% 50%, #7699AF 0%, #6088A1 55%, #4B7086 100%)',
    itemBg: '#4E7389',
    topText: 'rgba(255,255,255,0.86)',
  },
  sage: {
    label: 'سبزِ زیتونی',
    bg: '#5E7667',
    radial: 'radial-gradient(circle at 50% 45%, #738C7C 0%, #5E7667 55%, #495E51 100%)',
    itemBg: '#4B6153',
    topText: 'rgba(255,255,255,0.86)',
  },
  iris: {
    label: 'زنبقِ بنفش',
    bg: '#8385BE',
    radial: 'radial-gradient(circle at 50% 45%, #9698CB 0%, #8385BE 55%, #6B6DA6 100%)',
    itemBg: '#6E70AA',
    topText: 'rgba(255,255,255,0.86)',
  },
  ink: {
    label: 'مُرکّبِ شب',
    bg: '#282D34',
    radial: 'radial-gradient(circle at 50% 50%, #383F48 0%, #282D34 55%, #1B1F24 100%)',
    itemBg: '#1C2026',
    topText: 'rgba(255,255,255,0.78)',
  },
};
