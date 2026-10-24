const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/** Resolve a public asset path safely under both root ('/') and GitHub Pages relative ('./') bases. */
export function withBasePath(assetPath: string): string {
  const clean = assetPath.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || './';
  return `${base.endsWith('/') ? base : `${base}/`}${clean}`;
}

/** Convert ASCII digits 0-9 to Persian digits ۰-۹. */
export function toFaDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

/** Generate a clean editorial SVG data-URI fallback if network images are unreachable. */
export function createEditorialFallbackSvg(title: string, subtitle = 'آتلیهٔ عکاسی کارن'): string {
  const safeTitle = title.replace(/[<>&"']/g, '');
  const safeSub = subtitle.replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e7ded4"/>
        <stop offset="55%" stop-color="#d5c7b8"/>
        <stop offset="100%" stop-color="#b8a596"/>
      </linearGradient>
      <radialGradient id="r" cx="50%" cy="38%" r="60%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.45)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.08)"/>
      </radialGradient>
    </defs>
    <rect width="900" height="1200" fill="url(#g)"/>
    <rect width="900" height="1200" fill="url(#r)"/>
    <circle cx="450" cy="480" r="190" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>
    <text x="450" y="500" text-anchor="middle" fill="#3a322c" font-family="Vazirmatn, serif" font-size="52" font-weight="700">${safeTitle}</text>
    <text x="450" y="565" text-anchor="middle" fill="#6b5e54" font-family="Vazirmatn, sans-serif" font-size="24">${safeSub}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
