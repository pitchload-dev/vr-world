import type { CompanyProfile, Startup } from './startups';
import { panelText } from './booth-panels';
export const unavailable = 'Noch nicht verfügbar';
// Confirmed by the user's KCM screenshot, not inferred from another company.
const kcmProvided: CompanyProfile = {
  provenance: 'provided',
  legalName: 'Karlsruhe Conductive Materials',
  stage: 'Pre-Seed',
  founders: 3,
  region: 'Baden-Württemberg, Germany',
  industry: 'Chemicals',
  goToMarketModel: 'B2B',
  productType: 'Hardware',
  address: 'Gotthard-Franz-Straße 3\n76131 Karlsruhe',
  city: 'Karlsruhe',
};
export function fullProfile(s: Startup): CompanyProfile {
  return s.profile || (s.id === 8 ? kcmProvided : {});
}
export type ProfileField = { label: string; value: string; link?: string };
const value = (v: unknown) =>
  v === undefined || v === null || v === '' ? unavailable : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v);
export function profileGroups(
  s: Startup,
): { title: string; fields: ProfileField[] }[] {
  const p = fullProfile(s);
  return [
    {
      title: 'Our Product',
      fields: [
        { label: 'Stage', value: value(p.stage) },
        {
          label: 'Business Readiness Level',
          value: value(p.businessReadinessLevel),
        },
        { label: 'Go to Market Model', value: value(p.goToMarketModel) },
        { label: 'Product Type', value: value(p.productType) },
        {
          label: 'Product Readiness Level',
          value: value(p.productReadinessLevel),
        },
        {
          label: 'Technology Readiness Level',
          value: value(p.technologyReadinessLevel),
        },
      ],
    },
    {
      title: 'Our Company',
      fields: [
        { label: 'Company name', value: value(p.legalName || s.name) },
        { label: 'Founders', value: value(p.founders) },
        { label: 'Region', value: value(p.region) },
        { label: 'Industry', value: value(p.industry) },
        { label: 'Legal form', value: value(p.legalForm) },
        { label: 'Incorporated', value: value(p.incorporated) },
        { label: 'Female founders', value: value(p.femaleFounders) },
        { label: 'First-time founders', value: value(p.firstTimeFounders) },
        { label: 'Employees', value: value(p.employees) },
        { label: 'Founding year', value: value(p.foundingYear) },
        { label: 'Category', value: value(p.category) },
        { label: 'Handle', value: value(p.handle) },
      ],
    },
    {
      title: 'Investment',
      fields: [
        { label: 'Seeking investment', value: value(p.seekingInvestment) },
        { label: 'Investment size', value: p.investmentSize === undefined ? unavailable : p.investmentSize.toLocaleString('de-DE', { maximumFractionDigits: 2 }) },
        { label: 'Currency', value: unavailable },
      ],
    },
    {
      title: 'Headquarters',
      fields: [
        { label: 'Address', value: value(p.address) },
        { label: 'City', value: value(p.city) },
        { label: 'Website', value: value(p.website), link: p.website },
        {
          label: 'Email',
          value: value(p.email),
          link:
            p.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)
              ? `mailto:${p.email}`
              : undefined,
        },
      ],
    },
    {
      title: 'Profile',
      fields: [
        {
          label: 'Short description',
          value: value(p.aboutShort || s.headline),
        },
        {
          label: 'Full description',
          value: value(p.description || s.description),
        },
        { label: 'Logo', value: value(p.logoUrl), link: p.logoUrl },
        {
          label: 'Hero image',
          value: value(p.heroImageUrl),
          link: p.heroImageUrl,
        },
        { label: 'Created', value: value(p.created) },
        { label: 'Last changed', value: value(p.changed) },
      ],
    },
  ];
}
export function drawProfileFacts(c: CanvasRenderingContext2D, s: Startup) {
  const p = fullProfile(s),
    groups = profileGroups(s);
  c.fillStyle = '#fff';
  c.fillRect(0, 0, 1024, 1037);
  const card = (title: string, y: number, h: number) => {
    c.fillStyle = '#eef0eb';
    c.fillRect(24, y, 976, h);
    c.fillStyle = '#252a26';
    panelText(c, title, 52, y + 54, 920, 40, 1);
    c.fillStyle = '#d1d6cb';
    c.fillRect(52, y + 79, 920, 2);
  };
  const row = (label: string, v: string, y: number) => {
    c.fillStyle = '#272e29';
    panelText(c, label, 52, y, 502, 29, 1);
    c.fillStyle = v === unavailable ? '#778075' : '#252a26';
    panelText(c, v, 580, y, 385, 25, 2, 1.1);
  };
  card('Our Product', 20, 465);
  groups[0].fields.forEach((f, i) => row(f.label, f.value, 148 + i * 58));
  card('Our Company', 501, 276);
  ['Founders', 'Region', 'Industry'].forEach((label, i) => {
    const f = groups[1].fields.find((f) => f.label === label)!;
    row(f.label, f.value, 625 + i * 57);
  });
  card('Headquarters', 793, 203);
  c.fillStyle = '#252a26';
  panelText(c, p.legalName || s.name, 52, 906, 920, 29, 1);
  panelText(c, p.address || unavailable, 52, 948, 920, 28, 2, 1.15);
  c.fillStyle = '#176b54';
  panelText(c, 'SELECT TO READ ALL PROFILE FIELDS  ↗', 52, 1023, 920, 25, 1);
}
