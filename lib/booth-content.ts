import type { Startup } from './startups';
import { exhibitConcept } from './exhibit-concepts';
export type BoothPopupType = 'jobs' | 'meeting' | 'investment';
export function excerpt(value: string, max: number) {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  const clipped = compact.slice(0, max - 1);
  return (
    clipped.slice(
      0,
      clipped.lastIndexOf(' ') > max / 2
        ? clipped.lastIndexOf(' ')
        : clipped.length,
    ) + '…'
  );
}
export const interestLimits = { min: 111, max: 111111 };
export function validInterestAmount(value: string) {
  if (!value.trim()) return true;
  return (
    /^\d+(\.\d{1,2})?$/.test(value) &&
    Number(value) >= interestLimits.min &&
    Number(value) <= interestLimits.max
  );
}
export function previewSlides(s: Startup) {
  return [
    { eyebrow: '01 / THE COMPANY', title: s.headline, body: s.description },
    {
      eyebrow: '02 / EXPERIENCE THE TECHNOLOGY',
      title: exhibitConcept(s.id).title,
      body: `${exhibitConcept(s.id).description} Select ${exhibitConcept(s.id).action} on the central display; select again to reset. Illustrative concept, not an official product model.`,
    },
    {
      eyebrow: '03 / START A CONVERSATION',
      title: 'Meet the people behind it.',
      body: 'Pick up a careers card from the vertical rack, watch the exhibition preview film, or use the meeting station to try the booking journey. Official decks, films and calendars can replace this preview content.',
    },
  ];
}
export const previewVideo = '/media/venture-preview.mp4';
export { followUpDays as meetingDays, followUpSlots as meetingSlots } from './follow-up';
export function investmentPreview(id: number) {
  return (
    [
      '€2.5M',
      '€1.2M',
      '€800K',
      '€1.5M',
      '€3M',
      '€2M',
      '€4M',
      '€1M',
      '€750K',
      '€2.2M',
      '€3.5M',
    ][id - 1] || '€1M'
  );
}
export function investmentDisplay(s: Startup) {
  const p = s.profile;
  if (p?.provenance === 'pitchload') {
    return {
      label: p.seekingInvestment === false ? 'Not currently seeking investment' : p.seekingInvestment === true ? 'Seeking investment' : 'Investment information',
      amount: p.seekingInvestment === false ? '—' : p.investmentSize === undefined ? 'Not disclosed' : p.investmentSize.toLocaleString('de-DE', { maximumFractionDigits: 2 }),
      note: p.investmentSize === undefined || p.seekingInvestment === false ? 'Company information supplied by Pitchload.' : 'Pitchload funding target · currency not supplied.',
      source: 'PITCHLOAD',
    };
  }
  return { label: 'Seeking investment', amount: investmentPreview(s.id), note: 'Sample amount · not a company disclosure', source: 'DEMO' };
}
export function boothJobs(s: Startup) {
  return s.jobs.length
    ? s.jobs.map((j) => ({
        ...j,
        description:
          ('description' in j &&
            typeof j.description === 'string' &&
            j.description) ||
          `Explore a role with ${s.name}. The published listing contains the responsibilities, requirements and application instructions. Availability needs confirmation.`,
        preview: false,
      }))
    : [
        {
          title: 'Startup talent · sample role',
          location: 'Karlsruhe · Example opportunity',
          url: '',
          description:
            'Help a growing startup develop its technology, work with the founding team and bring research into practice. This sample role demonstrates the careers experience; it is not an advertised vacancy.',
          preview: true,
        },
      ];
}
export function meetingLink(id: number) {
  return `/meeting?startup=${id}`;
}
