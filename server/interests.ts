import type { InterestRow } from '../lib/interest-client';
import {
  followUpDays,
  followUpSlots,
  validFollowUpContact,
  type FollowUpRow,
} from '../lib/follow-up';

export interface InterestStore {
  get<T>(key: string): Promise<{ data: T; etag: string } | null>;
  put(key: string, data: unknown, etag: string | null): Promise<boolean>;
}
const names = [
  'REMENT',
  'Semorai',
  'Viss',
  'FORMIC',
  'Validaitor',
  'Nanoshape',
  'Superheated',
  'KCM',
  'Sparseon',
  'Formetis',
  'Photreon',
];
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cookieName = '__Host-kit-interest-admin';
const hex = (bytes: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
const fromHex = (value: string) =>
  Uint8Array.from(value.match(/.{2}/g) || [], (b) => parseInt(b, 16));
const hash = async (value: string) =>
  hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
export async function passwordMatches(password: string, configured: string) {
  const [rounds, salt, expected] = configured.split(':');
  if (
    rounds !== '600000' ||
    !/^[0-9a-f]{32}$/.test(salt || '') ||
    !/^[0-9a-f]{64}$/.test(expected || '')
  )
    return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const actual = hex(
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: fromHex(salt),
        iterations: 600000,
      },
      key,
      256,
    ),
  );
  let difference = 0;
  for (let i = 0; i < actual.length; i++)
    difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function change<T>(
  store: InterestStore,
  key: string,
  empty: T,
  mutate: (value: T) => T,
) {
  // Compare-and-swap keeps simultaneous submissions from overwriting one another.
  for (let i = 0; i < 12; i++) {
    const current = await store.get<T>(key);
    const next = mutate(current?.data ?? structuredClone(empty));
    if (await store.put(key, next, current?.etag ?? null)) return next;
  }
  throw new HttpError(
    503,
    'Die Speicherung ist beschäftigt. Bitte erneut versuchen.',
  );
}
export function createInterestHandler(
  store: InterestStore,
  passwordHash: string,
  now = () => Date.now(),
) {
  const reply = (
    data: unknown,
    status = 200,
    headers: Record<string, string> = {},
  ) =>
    Response.json(data, {
      status,
      headers: {
        'Cache-Control': 'private, no-store',
        Vary: 'Cookie',
        'X-Content-Type-Options': 'nosniff',
        ...headers,
      },
    });
  const rate = async (
    ip: string,
    action: string,
    limit: number,
    period: number,
  ) => {
    const key = `limits/${action}/${await hash(ip)}`;
    await change(store, key, { start: now(), count: 0 }, (v) => {
      if (now() - v.start >= period) v = { start: now(), count: 0 };
      if (v.count >= limit)
        throw new HttpError(
          429,
          'Zu viele Versuche. Bitte später erneut versuchen.',
        );
      return { ...v, count: v.count + 1 };
    });
  };
  const sessionKey = async (request: Request) => {
    const token = request.headers
      .get('cookie')
      ?.split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith(cookieName + '='))
      ?.slice(cookieName.length + 1);
    return token && /^[0-9a-f]{64}$/.test(token)
      ? `sessions/${await hash(token)}`
      : null;
  };
  return async (request: Request, ip = 'unknown') => {
    try {
      const url = new URL(request.url),
        action = url.searchParams.get('action') || 'submit';
      const allowedMethod = ['list', 'follow-up-list'].includes(action)
        ? 'GET'
        : 'POST';
      if (
        ![
          'submit',
          'login',
          'logout',
          'list',
          'follow-up-submit',
          'follow-up-list',
        ].includes(action)
      )
        throw new HttpError(404, 'Nicht gefunden.');
      if (request.method !== allowedMethod)
        return reply({ error: 'Methode nicht erlaubt.' }, 405, {
          Allow: allowedMethod,
        });
      if (
        request.method === 'POST' &&
        (request.headers.get('origin') !== url.origin ||
          request.headers.get('sec-fetch-site') === 'cross-site')
      )
        throw new HttpError(403, 'Diese Anfrage ist nicht erlaubt.');
      let body: Record<string, unknown> = {};
      if (request.method === 'POST') {
        if (
          !request.headers.get('content-type')?.startsWith('application/json')
        )
          throw new HttpError(415, 'JSON erforderlich.');
        if (Number(request.headers.get('content-length')) > 4096)
          throw new HttpError(413, 'Anfrage zu groß.');
        const reader = request.body?.getReader();
        let bytes = 0;
        const chunks: Uint8Array[] = [];
        if (reader)
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            bytes += part.value.byteLength;
            if (bytes > 4096) {
              await reader.cancel();
              throw new HttpError(413, 'Anfrage zu groß.');
            }
            chunks.push(part.value);
          }
        const buffer = new Uint8Array(bytes);
        let offset = 0;
        for (const chunk of chunks) {
          buffer.set(chunk, offset);
          offset += chunk.length;
        }
        try {
          body = JSON.parse(new TextDecoder().decode(buffer));
        } catch {
          throw new HttpError(400, 'Ungültige Anfrage.');
        }
        if (!body || typeof body !== 'object' || Array.isArray(body))
          throw new HttpError(400, 'Ungültige Anfrage.');
      }
      if (action === 'follow-up-submit') {
        const { submissionId, startupId, name, email, source } = body;
        const day = body.day ?? null,
          slot = body.slot ?? null;
        if (
          typeof submissionId !== 'string' ||
          !uuid.test(submissionId) ||
          typeof startupId !== 'number' ||
          !Number.isInteger(startupId) ||
          startupId < 1 ||
          startupId > 11 ||
          !(
            (day === null && slot === null) ||
            (typeof day === 'number' &&
              Number.isInteger(day) &&
              day >= 0 &&
              day < followUpDays.length &&
              typeof slot === 'string' &&
              followUpSlots.includes(slot))
          ) ||
          typeof name !== 'string' ||
          typeof email !== 'string' ||
          !validFollowUpContact(name, email) ||
          !['desktop', 'vr'].includes(String(source))
        )
          throw new HttpError(400, 'Bitte prüfen Sie Ihre Kontaktdaten.');
        await rate(ip, 'follow-up-submit', 120, 60000);
        const row: FollowUpRow = {
          id: submissionId,
          startupId,
          startup: names[startupId - 1],
          day: day as number | null,
          slot: slot as string | null,
          name: name.trim(),
          email: email.trim(),
          source: source as 'desktop' | 'vr',
          createdAt: new Date(now()).toISOString(),
        };
        await change<FollowUpRow[]>(store, 'follow-up-table', [], (rows) => {
          const previous = rows.find((r) => r.id === row.id);
          if (previous) {
            if (
              ['startupId', 'day', 'slot', 'name', 'email', 'source'].some(
                (key) =>
                  previous[key as keyof FollowUpRow] !==
                  row[key as keyof FollowUpRow],
              )
            )
              throw new HttpError(
                409,
                'Diese Anfrage wurde bereits gespeichert. Bitte öffnen Sie das Formular erneut.',
              );
            return rows;
          }
          return [...rows, row];
        });
        return reply({ id: row.id }, 201);
      }
      if (action === 'submit') {
        const { submissionId, startupId, interested, amount, source } = body;
        if (
          typeof submissionId !== 'string' ||
          !uuid.test(submissionId) ||
          typeof startupId !== 'number' ||
          !Number.isInteger(startupId) ||
          startupId < 1 ||
          startupId > 11 ||
          typeof interested !== 'boolean' ||
          !['desktop', 'vr'].includes(String(source))
        )
          throw new HttpError(400, 'Bitte prüfen Sie Ihre Angaben.');
        if (
          amount !== null &&
          (typeof amount !== 'number' ||
            !Number.isFinite(amount) ||
            amount < 111 ||
            amount > 111111 ||
            Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001)
        )
          throw new HttpError(400, 'Bitte geben Sie einen gültigen Betrag an.');
        if (!interested && amount !== null)
          throw new HttpError(
            400,
            'Ohne Interesse wird kein Betrag gespeichert.',
          );
        await rate(ip, 'submit', 120, 60000);
        const row: InterestRow = {
          id: submissionId,
          startupId,
          startup: names[startupId - 1],
          interested,
          amountCents:
            amount === null ? null : Math.round((amount as number) * 100),
          source: source as 'desktop' | 'vr',
          createdAt: new Date(now()).toISOString(),
        };
        await change<InterestRow[]>(store, 'interest-table', [], (rows) => {
          const previous = rows.find((r) => r.id === row.id);
          if (previous) {
            if (
              previous.startupId !== row.startupId ||
              previous.interested !== row.interested ||
              previous.amountCents !== row.amountCents ||
              previous.source !== row.source
            )
              throw new HttpError(
                409,
                'Diese Übertragung wurde bereits gespeichert. Bitte öffnen Sie das Formular erneut.',
              );
            return rows;
          }
          return [...rows, row];
        });
        return reply({ id: row.id }, 201);
      }
      if (action === 'login') {
        await rate(ip, 'login', 8, 15 * 60000);
        if (
          typeof body.password !== 'string' ||
          body.password.length > 256 ||
          !(await passwordMatches(body.password, passwordHash))
        )
          throw new HttpError(401, 'Das Passwort stimmt nicht.');
        const token = hex(crypto.getRandomValues(new Uint8Array(32))),
          expires = now() + 8 * 60 * 60000;
        await store.put(
          `sessions/${await hash(token)}`,
          { expires, passwordVersion: passwordHash },
          null,
        );
        return reply({ authenticated: true }, 200, {
          'Set-Cookie': `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`,
        });
      }
      const key = await sessionKey(request);
      if (action === 'logout') {
        if (key)
          await change(store, key, { expires: 0, passwordVersion: '' }, () => ({
            expires: 0,
            passwordVersion: '',
          }));
        return reply({ authenticated: false }, 200, {
          'Set-Cookie': `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
        });
      }
      const session = key
        ? await store.get<{ expires: number; passwordVersion: string }>(key)
        : null;
      if (
        !session ||
        session.data.expires <= now() ||
        session.data.passwordVersion !== passwordHash
      )
        throw new HttpError(401, 'Bitte melden Sie sich an.');
      const pageText = url.searchParams.get('page') || '0';
      if (!/^\d{1,6}$/.test(pageText))
        throw new HttpError(400, 'Ungültige Seite.');
      const all =
        (
          await store.get<(InterestRow | FollowUpRow)[]>(
            action === 'follow-up-list' ? 'follow-up-table' : 'interest-table',
          )
        )?.data || [];
      const sorted = [...all].sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
      );
      const page = Math.min(
        Number(pageText),
        Math.max(0, Math.ceil(sorted.length / 50) - 1),
      );
      return reply({
        rows: sorted.slice(page * 50, page * 50 + 50),
        total: sorted.length,
        page,
      });
    } catch (error) {
      return reply(
        {
          error:
            error instanceof HttpError
              ? error.message
              : 'Der Server ist momentan nicht erreichbar. Bitte erneut versuchen.',
        },
        error instanceof HttpError ? error.status : 503,
      );
    }
  };
}
