'use client';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CalendarDays } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { boothJobs } from '@/lib/booth-content';
import type { Startup } from '@/lib/startups';
import type { BoothPopupType } from '@/lib/booth-content';
import { MeetingRequestForm } from '@/components/meeting-request-form';
import { InvestmentPopup } from '@/components/investment-popup';

export function BoothPopup({
  startup,
  type,
  close,
  initialJobIndex = 0,
}: {
  startup: Startup;
  type: BoothPopupType;
  close: () => void;
  initialJobIndex?: number;
}) {
  const [mode, setMode] = useState(type);
  const [jobIndex, setJobIndex] = useState(initialJobIndex);
  const [saving, setSaving] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const startAtTop = useCallback(() => {
    // Keep focus and the reading position at the new content's beginning.
    headingRef.current?.focus({ preventScroll: true });
    popupRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
  useLayoutEffect(startAtTop, [startup.id, mode, jobIndex, startAtTop]);
  const jobs = boothJobs(startup),
    job = jobs[jobIndex];
  if (type === 'investment')
    return <InvestmentPopup startup={startup} close={close} />;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) close();
      }}
    >
      <DialogContent
        className="booth-popup"
        ref={popupRef}
        initialFocus={() => {
          startAtTop();
          return false;
        }}
      >
        <div className="popup-brand" style={{ borderColor: startup.color }}>
          <span className="eyebrow">
            {startup.name} / {mode === 'jobs' ? 'CAREERS' : 'Request follow up'}
          </span>
          <div className="popup-icon">
            {mode === 'jobs' ? (
              <BriefcaseBusiness size={28} />
            ) : (
              <CalendarDays size={28} />
            )}
          </div>
          <DialogTitle className="popup-title" ref={headingRef} tabIndex={-1}>
            {mode === 'jobs' ? job.title : 'Request follow up'}
          </DialogTitle>
          <DialogDescription className="popup-description">
            {mode === 'jobs'
              ? job.location
              : 'Leave your contact details to continue the conversation with the team.'}
          </DialogDescription>
        </div>
        {mode === 'jobs' ? (
          <>
            <span className="preview-pill">
              {job.preview
                ? 'SAMPLE ROLE · NOT AN OPEN VACANCY'
                : 'PUBLISHED LISTING · AVAILABILITY TO CONFIRM'}
            </span>
            <p className="popup-body">{job.description}</p>
            {jobs.length > 1 && (
              <div className="popup-role-nav">
                <button
                  disabled={jobIndex === 0}
                  onClick={() => setJobIndex(jobIndex - 1)}
                >
                  ← Previous
                </button>
                <span>
                  Role {jobIndex + 1} of {jobs.length}
                </span>
                <button
                  disabled={jobIndex === jobs.length - 1}
                  onClick={() => setJobIndex(jobIndex + 1)}
                >
                  Next →
                </button>
              </div>
            )}
            <div className="popup-actions">
              {job.url && (
                <a
                  className="primary"
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Published listing ↗
                </a>
              )}
              <button className="primary" onClick={() => setMode('meeting')}>
                Request follow up <ArrowRight size={18} />
              </button>
            </div>
          </>
        ) : (
          <MeetingRequestForm startupId={startup.id} onBusy={setSaving} />
        )}
      </DialogContent>
    </Dialog>
  );
}
