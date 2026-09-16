import type { Startup } from './startups';
import { excerpt, previewSlides } from './booth-content';

export function companyFacts(s: Startup) {
  return [
    { label: 'Founded', value: s.foundingYear ? String(s.foundingYear) : '—' },
    { label: 'Team members', value: s.employees ? String(s.employees) : '—' },
    {
      label: 'Listed jobs',
      value:
        s.contentSource === 'pitchload' || s.jobs.length
          ? String(s.jobs.length)
          : '—',
    },
  ];
}
export function profileParagraphs(s: Startup) {
  return s.description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
// Fixed text boxes protect the composition when API titles or descriptions grow.
export function panelText(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  maxLines: number,
  leading = 1.25,
) {
  c.font = `${size}px Arial`;
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && c.measureText(line + ' ' + word).width > width) {
      lines.push(line);
      line = '';
    }
    // Break oversized tokens rather than drawing outside the board.
    let rest = word;
    while (c.measureText(rest).width > width) {
      if (line) {
        lines.push(line);
        line = '';
      }
      let count = rest.length - 1;
      while (count > 1 && c.measureText(rest.slice(0, count)).width > width)
        count--;
      lines.push(rest.slice(0, count));
      rest = rest.slice(count);
    }
    line += (line ? ' ' : '') + rest;
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let last = visible[maxLines - 1];
    while (last && c.measureText(last + '…').width > width)
      last = last.slice(0, -1);
    visible[maxLines - 1] = last.trimEnd() + '…';
  }
  visible.forEach((row, index) =>
    c.fillText(row, x, y + index * size * leading),
  );
  return visible;
}

export function drawCompanyBoard(
  c: CanvasRenderingContext2D,
  s: Startup,
  page: number,
) {
  const slide = previewSlides(s)[page];
  c.fillStyle = '#f7f9f3';
  c.fillRect(0, 0, 1024, 648);
  c.fillStyle = s.color;
  c.fillRect(0, 0, 12, 648);
  c.fillStyle = '#45685b';
  panelText(
    c,
    [
      '01 / COMPANY OVERVIEW',
      '02 / THE TECHNOLOGY',
      '03 / CONNECT WITH THE TEAM',
    ][page],
    48,
    52,
    660,
    24,
    1,
  );
  c.fillStyle = '#e5ecdf';
  c.fillRect(788, 24, 194, 42);
  c.fillStyle = '#355542';
  panelText(
    c,
    s.contentSource === 'pitchload' && page === 0 ? 'PITCHLOAD' : 'PREVIEW',
    808,
    53,
    158,
    23,
    1,
  );
  c.fillStyle = '#173e36';
  panelText(c, slide.title, 48, 129, 924, 46, 3, 1.16);
  c.fillStyle = '#52665c';
  panelText(
    c,
    page === 0
      ? excerpt(profileParagraphs(s)[0] || s.description, 320)
      : slide.body,
    48,
    324,
    922,
    29,
    4,
    1.28,
  );
  companyFacts(s).forEach((fact, index) => {
    const x = 48 + index * 316;
    c.fillStyle = '#e8eee3';
    c.fillRect(x, 493, 296, 91);
    c.fillStyle = '#173e36';
    panelText(c, fact.value, x + 19, 535, 250, 38, 1);
    c.fillStyle = '#5e7364';
    panelText(c, fact.label, x + 19, 567, 250, 23, 1);
  });
  c.fillStyle = '#176b54';
  panelText(c, 'SELECT TO READ THE FULL PROFILE  ↗', 48, 625, 840, 24, 1);
  c.fillStyle = '#6e8075';
  panelText(c, `${page + 1} / 3`, 906, 625, 75, 24, 1);
}
