'use client';
import { useState } from 'react';
import type { Startup } from '@/lib/startups';
import { companyImage } from '@/lib/company-images';

export function CompanyBrand({ startup }: { startup: Startup }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);
  const logo = companyImage(startup, 'logo');
  const hero = companyImage(startup, 'hero');
  return (
    <div className="company-brand">
      <div className="company-mark" style={{ background: logo && !logoFailed ? '#ffffff' : startup.color }}>
        {logo && !logoFailed ? <img className="company-logo" src={logo} alt={`${startup.name} logo`} onError={() => setLogoFailed(true)} /> : startup.name[0]}
        <span>{String(startup.id).padStart(2, '0')}</span>
      </div>
      {hero && !heroFailed && <img className="company-hero" src={hero} alt={`${startup.name} – Unternehmensmotiv`} onError={() => setHeroFailed(true)} />}
    </div>
  );
}
