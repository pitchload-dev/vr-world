'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Glasses } from 'lucide-react';
import { MeetingRequestForm } from '@/components/meeting-request-form';
import { startups } from '@/lib/startups';
function Booking() {
  const params = useSearchParams();
  const id = Number(params.get('startup'));
  const startup = startups.find((s) => s.id === id) || startups[0];
  return (
    <main className="meeting-page">
      <Link className="meeting-back" href="/">
        <ArrowLeft size={17} /> Back to the exhibition
      </Link>
      <div className="meeting-shell">
        <aside className="meeting-about">
          <span className="eyebrow">KIT / VENTURE HALL</span>
          <div className="meeting-mark" style={{ background: startup.color }}>
            {startup.name[0]}
          </div>
          <span className="eyebrow">Request follow up</span>
          <h1>{startup.name}</h1>
          <p>
            A conversation about the technology, the team, and what comes next.
          </p>
          <div>
            <Clock size={17} /> Follow-up with the team
          </div>
          <div>
            <Glasses size={17} /> Investor event · Karlsruhe
          </div>
        </aside>
        <section className="meeting-calendar">
          <h2>Request follow up</h2>
          <MeetingRequestForm key={startup.id} startupId={startup.id} />
        </section>
      </div>
    </main>
  );
}
export default function MeetingPage() {
  return (
    <Suspense
      fallback={
        <main className="meeting-page">Opening the follow-up request…</main>
      }
    >
      <Booking />
    </Suspense>
  );
}
