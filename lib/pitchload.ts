import { startups as preview, type Startup } from './startups';
import { excerpt } from './booth-content';
const BASE = 'https://pitchload.net/api/v1';
const jobTextCache = new Map<
  string,
  { expires: number; description: string }
>();
export const eventPlaylist = '87e366e3-2731-4099-9e38-9072e86795c1';
type Organization = {
  name: string;
  handle: string;
  aboutShort?: string | null;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  city?: string | null;
  employees?: number | null;
  foundingYear?: number | null;
  category?: string | null;
  email?: string | null;
  address?: string | null;
  heroImageUrl?: string | null;
  created?: string | null;
  changed?: string | null;
};
type Job = {
  id?: string;
  title: string;
  jobLink?: string | null;
  city?: string | null;
  employmentType?: string;
  workMode?: string;
  shortDescription?: string | null;
  description?: string | null;
  organization?: { handle?: string };
};
export type ExhibitionContent = {
  startups: Startup[];
  source: 'preview' | 'pitchload' | 'partial' | 'snapshot';
  playlist: string;
  message?: string;
  updatedAt?: string;
};
export function safeLink(value: unknown): string | undefined {
  if (typeof value !== 'string') return;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password)
      return url.href;
  } catch {}
  return;
}
const text = (value: unknown, max = 2500) =>
  typeof value === 'string'
    ? Array.from(value)
        .filter((char) => {
          const code = char.charCodeAt(0);
          return code >= 32 || code === 9 || code === 10 || code === 13;
        })
        .join('')
        .trim()
        .slice(0, max)
    : '';
const normal = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b(gmbh|ug|haftungsbeschränkt)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
export function matchOrganization(s: Startup, orgs: Organization[]) {
  const names = [normal(s.name)];
  if (s.id === 8) names.push('karlsruheconductivematerials');
  if (s.id === 4) names.push('formictransportsysteme');
  return orgs.find(
    (o) => names.includes(normal(o.name)) || names.includes(normal(o.handle)),
  );
}
export function mapProfile(
  base: Startup,
  org: Organization,
  jobs: Job[] | null,
): Startup {
  return {
    ...base,
    name: base.name,
    headline: excerpt(text(org.aboutShort, 1000), 110) || base.headline,
    description:
      text(org.description, 12000) || text(org.aboutShort) || base.description,
    source: safeLink(org.website) || base.source,
    sourceLabel: safeLink(org.website) ? 'Company website' : base.sourceLabel,
    pending: false,
    contentSource: 'pitchload',
    profile: {
      provenance: 'pitchload',
      legalName: text(org.name, 500),
      handle: text(org.handle, 250),
      category: text(org.category, 100),
      aboutShort: text(org.aboutShort, 12000),
      description: text(org.description, 50000),
      website: safeLink(org.website),
      email: text(org.email, 320),
      address: text(org.address, 2000),
      city: text(org.city, 300),
      logoUrl: safeLink(org.logoUrl),
      heroImageUrl: safeLink(org.heroImageUrl),
      created: text(org.created, 100),
      changed: text(org.changed, 100),
      employees:
        Number.isInteger(org.employees) && org.employees! >= 0
          ? org.employees!
          : undefined,
      foundingYear: Number.isInteger(org.foundingYear)
        ? org.foundingYear!
        : undefined,
    },
    logoUrl: safeLink(org.logoUrl),
    city: text(org.city, 150) || undefined,
    employees:
      Number.isInteger(org.employees) && org.employees! >= 0
        ? org.employees!
        : undefined,
    foundingYear:
      Number.isInteger(org.foundingYear) &&
      org.foundingYear! >= 1800 &&
      org.foundingYear! <= new Date().getFullYear()
        ? org.foundingYear!
        : undefined,
    jobs:
      jobs === null
        ? base.jobs
        : jobs.map((j) => ({
            title: text(j.title, 150),
            location: [
              text(j.city, 150),
              text(j.employmentType, 80).replaceAll('_', ' '),
              text(j.workMode, 80).replaceAll('_', ' '),
            ]
              .filter(Boolean)
              .join(' · '),
            url: safeLink(j.jobLink) || '',
            description:
              text(j.description, 12000) || text(j.shortDescription, 1200),
          })),
  };
}
export async function loadPitchload(
  apiKey: string | undefined,
  playlist = eventPlaylist,
  fetcher: typeof fetch = fetch,
): Promise<ExhibitionContent> {
  if (!apiKey)
    return {
      startups: preview,
      source: 'preview',
      playlist,
      message:
        'Preview content. Pitchload connection is awaiting configuration.',
    };
  let rateLimited = false;
  let requestCount = 0;
  const request = async (path: string) => {
    if (rateLimited) throw new Error('Pitchload rate limit reached');
    requestCount++;
    const response = await fetcher(BASE + path, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      // Workers support manual redirects; rejecting non-2xx responses below
      // prevents the Bearer token from ever following a different origin.
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 429) rateLimited = true;
    if (!response.ok)
      throw new Error(`Pitchload request failed (${response.status})`);
    return (await response.json()) as {
      data: unknown;
      meta?: { totalCount: number; offset: number; limit: number };
    };
  };
  async function pages<T>(path: string): Promise<T[]> {
    const all: T[] = [];
    for (let offset = 0; offset < 1000; offset += 100) {
      const r = await request(
        `${path}${path.includes('?') ? '&' : '?'}limit=100&offset=${offset}`,
      );
      if (!Array.isArray(r.data)) throw new Error('Invalid Pitchload list');
      all.push(...(r.data as T[]));
      if (r.data.length < 100 || all.length >= (r.meta?.totalCount ?? Infinity))
        return all;
    }
    throw new Error('Pitchload list exceeds exhibition import limit');
  }
  try {
    const orgs = await pages<Organization>(
      `/playlists/${encodeURIComponent(playlist)}/entries?category=STARTUP`,
    );
    if (
      !orgs.every(
        (o) => typeof o.name === 'string' && typeof o.handle === 'string',
      )
    )
      throw new Error('Invalid organization records');
    const result: Startup[] = [];
    const jobsByCompany = new Map<number, Job[]>();
    let partial = false;
    // Three requests at a time avoids overwhelming a rate-limited content API.
    for (let offset = 0; offset < preview.length; offset += 3) {
      const batch = await Promise.all(
        preview.slice(offset, offset + 3).map(async (base) => {
          const org = matchOrganization(base, orgs);
          if (!org) {
            partial = true;
            return base;
          }
          try {
            const detail = await request(
              `/organizations/${encodeURIComponent(org.handle)}?format=text`,
            );
            if (!detail.data || typeof detail.data !== 'object')
              throw new Error('Invalid profile');
            let jobs: Job[] | null = null;
            try {
              jobs = await pages<Job>(
                `/jobs?organization=${encodeURIComponent(org.handle)}`,
              );
              if (!jobs.every((j) => typeof j.title === 'string'))
                throw new Error('Invalid jobs');
              jobs = jobs.filter(
                (j) =>
                  !j.organization?.handle ||
                  j.organization.handle.toLowerCase() ===
                    org.handle.toLowerCase(),
              );
              jobsByCompany.set(base.id, jobs);
            } catch {
              jobs = null;
              partial = true;
            }
            return mapProfile(base, { ...org, ...detail.data }, jobs);
          } catch {
            partial = true;
            return base;
          }
        }),
      );
      result.push(...batch);
    }
    // All profiles and job lists take priority over optional longer job texts.
    for (const company of result) {
      const listed = jobsByCompany.get(company.id) || [];
      for (const [index, job] of listed.entries()) {
        if (rateLimited) break;
        if (!job.id) continue;
        const cached = jobTextCache.get(job.id);
        if (cached && cached.expires > Date.now()) {
          company.jobs[index].description =
            cached.description || company.jobs[index].description;
          continue;
        }
        if (requestCount >= 20) continue;
        try {
          const detail = await request(
            `/jobs/${encodeURIComponent(job.id)}?format=text`,
          );
          if (detail.data && typeof detail.data === 'object') {
            const full = detail.data as Job;
            if (
              !full.organization?.handle ||
              full.organization.handle.toLowerCase() ===
                job.organization?.handle?.toLowerCase()
            ) {
              const description = text(full.description, 12000);
              company.jobs[index].description =
                description || company.jobs[index].description;
              jobTextCache.set(job.id, {
                expires: Date.now() + 1800000,
                description,
              });
            }
          }
        } catch {
          partial = true;
        }
      }
    }
    return {
      startups: result,
      source: partial ? 'partial' : 'pitchload',
      playlist,
      updatedAt: new Date().toISOString(),
      ...(partial
        ? {
            message:
              'Some booths use preview content while their profiles are unavailable.',
          }
        : {}),
    };
  } catch (error) {
    console.warn(
      'Pitchload import unavailable:',
      error instanceof Error
        ? error.message.replaceAll(apiKey, '[redacted]')
        : 'Invalid response',
    );
    return {
      startups: preview,
      source: 'preview',
      playlist,
      message:
        'Pitchload content is temporarily unavailable. Showing exhibition preview content.',
    };
  }
}
