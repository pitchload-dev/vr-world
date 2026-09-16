'use client';
import { useEffect, useState } from 'react';
import { LockKeyhole, RefreshCw, LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { interestRequest, type InterestRow } from '@/lib/interest-client';

import { followUpDays, type FollowUpRow } from '@/lib/follow-up';

export function InterestAdmin({
  close,
  kind = 'investment',
}: {
  close: () => void;
  kind?: 'investment' | 'followup';
}) {
  const followup = kind === 'followup';
  const [authenticated, setAuthenticated] = useState(false),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(true),
    [error, setError] = useState('');
  const [rows, setRows] = useState<(InterestRow | FollowUpRow)[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0);
  const hasLegacyTimes =
    followup && rows.some((row) => 'name' in row && row.day != null);
  async function load(next = 0) {
    setBusy(true);
    setError('');
    try {
      const data = await interestRequest<{
        rows: (InterestRow | FollowUpRow)[];
        total: number;
        page: number;
      }>(followup ? 'follow-up-list' : 'list', undefined, next);
      setRows(data.rows);
      setTotal(data.total);
      setPage(data.page);
      setAuthenticated(true);
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        setAuthenticated(false);
        setRows([]);
      } else setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await interestRequest('login', { password });
      setPassword('');
      await load();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError('');
    try {
      await interestRequest('logout', {});
      setAuthenticated(false);
      setRows([]);
      setTotal(0);
    } catch (e) {
      setError('Abmelden fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="interest-admin" lang="de">
        <div className="admin-heading">
          <LockKeyhole size={26} />
          <div>
            <DialogTitle>
              {followup ? 'Follow-up Requests' : 'Investment-Interesse'}
            </DialogTitle>
            <DialogDescription>
              {followup
                ? 'Gespeicherte Follow-up-Anfragen'
                : 'Unverbindliche Angaben aus der Ausstellung'}
            </DialogDescription>
          </div>
        </div>
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        {!authenticated ? (
          <form className="admin-login" onSubmit={login}>
            <p>Dieser Bereich ist für das Veranstaltungsteam geschützt.</p>
            <label htmlFor="admin-password">Passwort</label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
            <button className="primary" disabled={busy || !password}>
              {busy ? 'Bitte warten …' : 'Tabelle öffnen'}
            </button>
          </form>
        ) : (
          <>
            <div className="admin-toolbar">
              <span>
                <strong>{total}</strong> gespeicherte Meldungen
              </span>
              <div>
                <button disabled={busy} onClick={() => void load(page)}>
                  <RefreshCw size={17} />
                  Aktualisieren
                </button>
                <button disabled={busy} onClick={() => void logout()}>
                  <LogOut size={17} />
                  Abmelden
                </button>
              </div>
            </div>
            <p className="admin-note">
              {followup
                ? 'Follow-up-Anfragen aus Browser und VR. Name und E-Mail sind freiwillig; direkte Rückmeldung ist nur mit E-Mail möglich.'
                : 'Anonyme Angaben · Demo-Investitionsbeträge · keine Zusagen oder Buchungen. Mehrere Meldungen können von derselben Person stammen.'}
            </p>
            <Table>
              <TableCaption>
                Neueste Meldungen zuerst · Zeitangaben für Europe/Berlin
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeitpunkt</TableHead>
                  <TableHead>Startup</TableHead>
                  {followup ? (
                    <>
                      {hasLegacyTimes && (
                        <TableHead>Früherer Terminwunsch</TableHead>
                      )}
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Referenz</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Interesse</TableHead>
                      <TableHead>Optionaler Betrag</TableHead>
                    </>
                  )}
                  <TableHead>Zugang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {new Date(row.createdAt).toLocaleString('de-DE', {
                        timeZone: 'Europe/Berlin',
                      })}
                    </TableCell>
                    <TableCell>{row.startup}</TableCell>
                    {'name' in row ? (
                      <>
                        {hasLegacyTimes && (
                          <TableCell>
                            {row.day == null
                              ? '—'
                              : `${followUpDays[row.day]} · ${row.slot}`}
                          </TableCell>
                        )}
                        <TableCell>{row.name || 'Nicht angegeben'}</TableCell>
                        <TableCell>{row.email || 'Nicht angegeben'}</TableCell>
                        <TableCell>
                          <small>{row.id}</small>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <span
                            className={
                              row.interested ? 'admin-yes' : 'admin-no'
                            }
                          >
                            {row.interested ? 'Ja' : 'Nein'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {row.amountCents === null
                            ? '—'
                            : (row.amountCents / 100).toLocaleString('de-DE', {
                                style: 'currency',
                                currency: 'EUR',
                              })}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      {row.source === 'vr' ? 'VR' : 'Desktop'}
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length && (
                  <TableRow>
                    <TableCell
                      colSpan={followup ? (hasLegacyTimes ? 7 : 6) : 5}
                      className="admin-empty"
                    >
                      {followup
                        ? 'Noch keine Follow-up-Anfragen gespeichert.'
                        : 'Noch keine Interessenbekundungen gespeichert.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="admin-pagination">
              <button
                disabled={busy || page === 0}
                onClick={() => void load(page - 1)}
              >
                ← Zurück
              </button>
              <span>
                Seite {page + 1} / {Math.max(1, Math.ceil(total / 50))}
              </span>
              <button
                disabled={busy || (page + 1) * 50 >= total}
                onClick={() => void load(page + 1)}
              >
                Weiter →
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
