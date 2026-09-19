import assets from './company-image-assets.json';
import type { Startup } from './startups';

export function companyImage(s: Startup, kind: 'logo' | 'hero') {
  const url = kind === 'logo' ? s.profile?.logoUrl || s.logoUrl : s.profile?.heroImageUrl;
  if (!url) return undefined;
  const local = (assets as Record<string, string>)[url];
  if (local) return local;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) return url;
  } catch {}
  return undefined;
}

// Preserve the whole artwork, including wordmarks and text inside hero images.
export function containedImage(width: number, height: number, boxWidth: number, boxHeight: number, padding = 0) {
  const scale = Math.min((boxWidth - padding * 2) / width, (boxHeight - padding * 2) / height);
  return { x: (boxWidth - width * scale) / 2, y: (boxHeight - height * scale) / 2, width: width * scale, height: height * scale };
}
