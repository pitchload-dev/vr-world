'use client';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

import { submitFollowUp } from '@/lib/interest-client';

export function MeetingRequestForm({
  startupId,
  onBusy,
}: {
  startupId: number;
  onBusy?: (busy: boolean) => void;
}) {
  const [name, setName] = useState(''),
    [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(''),
    [error, setError] = useState('');
  const attempt = useRef<{ signature: string; id: string } | null>(null),
    inFlight = useRef(false);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    onBusy?.(true);
    setError('');
    const input = {
      startupId,
      name: name.trim(),
      email: email.trim(),
      source: 'desktop' as const,
    };
    const signature = JSON.stringify(input);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, id: crypto.randomUUID() };
    try {
      const result = await submitFollowUp({
        ...input,
        submissionId: attempt.current.id,
      });
      setSaved(result.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setSaving(false);
      onBusy?.(false);
    }
  }
  if (saved)
    return (
      <div className="follow-up-form" role="status">
        <span className="preview-pill">FOLLOW-UP REQUEST</span>
        <h2>Anfrage gespeichert</h2>
        <p>
          Ihre Follow-up-Anfrage und die freiwilligen Kontaktdaten sind für das
          Veranstaltungsteam gespeichert.
        </p>
        {!email && (
          <p>
            Ohne E-Mail-Adresse ist keine direkte Rückmeldung möglich. Bitte
            sprechen Sie das Team vor Ort an.
          </p>
        )}
        <small>Referenz: {saved}</small>
        <button
          className="primary"
          onClick={() => {
            setSaved('');
            attempt.current = null;
          }}
        >
          Weitere Anfrage
        </button>
      </div>
    );
  return (
    <form className="follow-up-form" onSubmit={save} lang="de">
      <span className="preview-pill">FOLLOW-UP REQUEST</span>
      <fieldset disabled={saving}>
        <legend>Ihre Kontaktdaten</legend>
        <label htmlFor="follow-up-name">Name (optional)</label>
        <Input
          id="follow-up-name"
          autoComplete="name"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="follow-up-email">
          E-Mail für die Rückmeldung (optional)
        </label>
        <Input
          id="follow-up-email"
          type="email"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </fieldset>
      <p className="booking-explanation">
        Mit dem Speichern werden Ihre Follow-up-Anfrage und Ihre freiwilligen
        Kontaktdaten für das Veranstaltungsteam hinterlegt.
      </p>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <button className="primary" disabled={saving}>
        {saving ? 'Wird gespeichert …' : 'Follow-up anfragen'}
      </button>
    </form>
  );
}
