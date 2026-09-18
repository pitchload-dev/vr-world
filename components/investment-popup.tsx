'use client';
import { useRef, useState } from 'react';
import { submitInterest } from '@/lib/interest-client';
import { Info, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  interestLimits,
  investmentDisplay,
  validInterestAmount,
} from '@/lib/booth-content';
import type { Startup } from '@/lib/startups';

export function InvestmentPopup({
  startup,
  close,
}: {
  startup: Startup;
  close: () => void;
}) {
  const [interested, setInterested] = useState<boolean | null>(null);
  const [amount, setAmount] = useState('25000');
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  const attempt = useRef<{ signature: string; id: string } | null>(null);
  const inFlight = useRef(false);
  async function save() {
    if (inFlight.current || interested === null || (interested && !valid))
      return;
    inFlight.current = true;
    setSaving(true);
    setError('');
    const input = {
      startupId: startup.id,
      interested,
      amount: interested && amount.trim() ? Number(amount) : null,
      source: 'desktop' as const,
    };
    const signature = JSON.stringify(input);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, id: crypto.randomUUID() };
    try {
      await submitInterest({ ...input, submissionId: attempt.current.id });
      setFinished(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }
  const valid = validInterestAmount(amount);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) close();
      }}
    >
      <DialogContent className="interest-popup" lang="de">
        <span className="interest-company">
          {startup.name} · {investmentDisplay(startup).label} · {investmentDisplay(startup).amount} · {investmentDisplay(startup).source}
        </span>
        <DialogTitle className="interest-title">
          Unverbindliche Interessenbekundung
        </DialogTitle>
        <DialogDescription className="interest-info">
          <Info size={30} aria-hidden="true" />
          <span>
            Über diese Ausstellung ist keine Zeichnung möglich. Sie
            können Ihr unverbindliches Interesse bekunden, um die Nachfrage
            einzuschätzen. Ihre Angabe wird für das Veranstaltungsteam
            gespeichert. Dies stellt keinerlei Verpflichtung dar.
          </span>
        </DialogDescription>
        {finished ? (
          <div className="interest-result" aria-live="polite">
            <Check size={32} />
            <h3>Ihre Interessenbekundung wurde gespeichert.</h3>
            <p>
              {interested
                ? 'Ja, ich bin interessiert'
                : 'Nein, nicht interessiert'}
              {interested && amount.trim()
                ? ` · ${Number(amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`
                : ''}
            </p>
            <p>
              Das Veranstaltungsteam kann Ihre Angabe in der geschützten Tabelle
              sehen. Es wurde keine Investition getätigt.
            </p>
            <div className="interest-footer">
              <button
                type="button"
                onClick={() => {
                  attempt.current = null;
                  setFinished(false);
                }}
              >
                Weitere Angabe
              </button>
              <button className="interest-submit" type="button" onClick={close}>
                Zurück zum Stand
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <fieldset className="interest-choice" disabled={saving}>
              <legend>
                Hätten Sie potenziell Interesse an diesem Angebot?
              </legend>
              <div>
                <button
                  type="button"
                  className="interest-yes"
                  aria-pressed={interested === true}
                  onClick={() => setInterested(true)}
                >
                  Ja, ich bin interessiert
                </button>
                <button
                  type="button"
                  aria-pressed={interested === false}
                  onClick={() => setInterested(false)}
                >
                  Nein, nicht interessiert
                </button>
              </div>
            </fieldset>
            {interested === true && (
              <div className="interest-amount">
                <label htmlFor="interest-amount">
                  Welchen Betrag würden Sie ggf. in Betracht ziehen?
                </label>
                <div className="interest-input">
                  <span className="interest-floating">
                    Unverbindlicher Betrag · optional
                  </span>
                  <span aria-hidden="true">€</span>
                  <Input
                    id="interest-amount"
                    type="number"
                    inputMode="decimal"
                    min={interestLimits.min}
                    max={interestLimits.max}
                    step="0.01"
                    value={amount}
                    disabled={saving}
                    onChange={(event) => setAmount(event.target.value)}
                    aria-invalid={!valid}
                    aria-describedby="interest-range"
                  />
                </div>
                <p
                  id="interest-range"
                  className={!valid ? 'interest-error' : ''}
                >
                  Zwischen 111,00 € und 111.111,00 € · Beispielgrenzen für diese
                  Demo.
                </p>
              </div>
            )}
            <p className="interest-disclaimer">
              Dies ist eine unverbindliche Interessenbekundung und stellt weder
              eine Investition, ein Angebot zum Erwerb von Wertpapieren, eine
              Anlageberatung noch eine vertragliche Verpflichtung dar. Diese
              Ausstellung verwendet beispielhafte Investitionsbeträge. Beim
              Speichern werden Startup, Zeitpunkt, Ihre Auswahl und
              gegebenenfalls der Betrag ohne Namen oder Kontaktdaten in der
              geschützten Tabelle des Veranstaltungsteams gespeichert. Es
              erfolgt keine Übermittlung an ONINO oder Pitchload.
            </p>
            {error && (
              <p className="interest-error" role="alert">
                {error}
              </p>
            )}
            <div className="interest-footer">
              <button type="button" disabled={saving} onClick={close}>
                Abbrechen
              </button>
              <button
                className="interest-submit"
                type="submit"
                disabled={
                  saving || interested === null || (interested && !valid)
                }
              >
                {saving ? 'Wird gespeichert …' : 'Interesse speichern'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
