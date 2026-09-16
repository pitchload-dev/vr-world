import type { FollowUpInput } from './follow-up';
export type InterestInput = {
  submissionId: string;
  startupId: number;
  interested: boolean;
  amount: number | null;
  source: 'desktop' | 'vr';
};
export type InterestRow = {
  id: string;
  startupId: number;
  startup: string;
  interested: boolean;
  amountCents: number | null;
  source: 'desktop' | 'vr';
  createdAt: string;
};
export async function interestRequest<T = Record<string, unknown>>(
  action: string,
  body?: unknown,
  page = 0,
): Promise<T> {
  const response = await fetch(
    `/api/interests?action=${encodeURIComponent(action)}&page=${page}`,
    {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      headers:
        body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    },
  );
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw new Error(
      'Die Speicherung ist noch nicht eingerichtet. Bitte versuchen Sie es später erneut.',
    );
  const data = (await response.json()) as { error?: string };
  if (!response.ok)
    throw Object.assign(
      new Error(data.error || 'Die Anfrage konnte nicht abgeschlossen werden.'),
      { status: response.status },
    );
  return data as T;
}
export async function submitInterest(
  input: InterestInput,
): Promise<{ id: string }> {
  return submitRecord('submit', input);
}
export async function submitFollowUp(
  input: FollowUpInput,
): Promise<{ id: string }> {
  return submitRecord('follow-up-submit', input);
}
async function submitRecord(
  action: string,
  input: InterestInput | FollowUpInput,
): Promise<{ id: string }> {
  try {
    const data = await interestRequest<{ id: string }>(action, input);
    if (data.id !== input.submissionId)
      throw new Error(
        'Keine gültige Speicherbestätigung erhalten. Bitte erneut versuchen.',
      );
    return data;
  } catch (error) {
    if (
      error instanceof Error &&
      ['TimeoutError', 'AbortError', 'TypeError'].includes(error.name)
    )
      throw new Error(
        'Keine Bestätigung erhalten. Bitte erneut versuchen; doppelte Übertragung wird vermieden.',
      );
    throw error;
  }
}
