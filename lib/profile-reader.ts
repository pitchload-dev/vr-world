import type { Startup } from './startups';
import { profileGroups } from './profile-fields';

export type ProfilePage = {
  title: string;
  rows: { text: string; label?: boolean }[];
};

// Keep complete values, including long URLs, within a comfortable VR reading area.
export function profileReaderPages(
  startup: Startup,
  measure: (text: string) => number,
  width = 1080,
): ProfilePage[] {
  const wrap = (value: string) => {
    const lines: string[] = [];
    for (const paragraph of value.split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (line && measure(`${line} ${word}`) > width) {
          lines.push(line);
          line = '';
        }
        for (const char of (line ? ' ' : '') + word) {
          if (line && measure(line + char) > width) {
            lines.push(line);
            line = '';
          }
          line += char;
        }
      }
      lines.push(line);
    }
    return lines;
  };
  const pages: ProfilePage[] = [];
  for (const group of profileGroups(startup)) {
    let current: ProfilePage = { title: group.title, rows: [] };
    const advance = () => {
      if (current.rows.length) pages.push(current);
      current = { title: group.title, rows: [] };
    };
    for (const field of group.fields) {
      const body = wrap(field.value);
      if (
        current.rows.length &&
        current.rows.length + Math.min(body.length + 2, 12) > 12
      )
        advance();
      current.rows.push({ text: field.label, label: true });
      for (const line of body) {
        if (current.rows.length >= 12) {
          advance();
          current.rows.push({
            text: `${field.label} · continued`,
            label: true,
          });
        }
        current.rows.push({ text: line });
      }
      if (current.rows.length < 12) current.rows.push({ text: '' });
    }
    advance();
  }
  return pages;
}
