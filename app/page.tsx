'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Compass,
  Glasses,
  Info,
  Map,
  MoveUpRight,
  MousePointer2,
  Maximize,
  ChevronRight,
  Box,
  BriefcaseBusiness,
  ExternalLink,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  startups as previewStartups,
  placement,
  type Startup,
} from '@/lib/startups';
import {
  previewSlides,
  previewVideo,
  investmentDisplay,
  boothJobs,
} from '@/lib/booth-content';
import { BoothPopup } from '@/components/booth-popup';
import { ProfileFacts } from '@/components/profile-facts';
import { InterestAdmin } from '@/components/interest-admin';
import { exhibitConcept } from '@/lib/exhibit-concepts';
import { companyFacts, profileParagraphs } from '@/lib/booth-panels';
import { excerpt } from '@/lib/booth-content';
import type { BoothPopupType } from '@/lib/booth-content';
import type { HallAPI } from '@/lib/hall';
import { registerExhibitionTools } from '@/lib/webmcp';
import type { ExhibitionContent } from '@/lib/pitchload';
export default function Home() {
  const host = useRef<HTMLDivElement>(null);
  const [startups, setStartups] = useState<Startup[]>(previewStartups);
  const [contentSource, setContentSource] = useState('preview');
  const [contentDate, setContentDate] = useState('');
  const [companyTab, setCompanyTab] = useState('about');
  const [adminOpen, setAdminOpen] = useState<'investment' | 'followup' | null>(
    null,
  );
  const [slideIndex, setSlideIndex] = useState(0);
  const [popup, setPopup] = useState<{
    id: number;
    type: BoothPopupType;
    jobIndex?: number;
  } | null>(null);
  const hall = useRef<HallAPI | null>(null);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [panel, setPanel] = useState<'directory' | 'company' | 'help' | null>(
    null,
  );
  const [selected, setSelected] = useState(1);
  const [error, setError] = useState('');
  const [pos, setPos] = useState([15, 24]);
  const [map, setMap] = useState(true);
  const [visited, setVisited] = useState<number[]>([]);
  const [moving, setMoving] = useState(true);
  const [focusHint, setFocusHint] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const select = (id: number) => {
    if (!id) {
      setPanel('directory');
      return;
    }
    setSelected(id);
    setCompanyTab('about');
    setSlideIndex(0);
    setPanel('company');
  };
  useEffect(() => {
    let gone = false;
    const abort = new AbortController();
    Promise.all([
      import('@/lib/hall'),
      fetch('/api/exhibition', { signal: abort.signal })
        .then((r) => {
          if (!r.ok) throw new Error('Content unavailable');
          return r.json() as Promise<ExhibitionContent>;
        })
        .catch(() => ({ startups: previewStartups, source: 'preview' })),
    ])
      .then(([{ createHall }, content]) => {
        if (gone || !host.current) return;
        setMoving(
          !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        );
        const companies =
          Array.isArray(content.startups) && content.startups.length === 11
            ? content.startups
            : previewStartups;
        setStartups(companies);
        setContentSource(content.source || 'preview');
        setContentDate(
          'updatedAt' in content && typeof content.updatedAt === 'string'
            ? content.updatedAt
            : '',
        );
        try {
          hall.current = createHall(
            host.current,
            {
              ready: () => setReady(true),
              select,
              content: (id, tab) => {
                setSelected(id);
                setCompanyTab(tab);
                setSlideIndex(0);
                setPanel('company');
              },
              popup: (id, type, jobIndex) => {
                setPanel(null);
                setPopup({ id, type, jobIndex });
              },
              position: (x, z) => {
                setPos([x, z]);
                const close = companies.find((_, index) => {
                  const p = placement(index);
                  return Math.hypot(p.x - x, p.z - z) < 3.6;
                });
                if (close)
                  setVisited((current) =>
                    current.includes(close.id)
                      ? current
                      : [...current, close.id],
                  );
              },
              hint: setFocusHint,
              visited: (id) =>
                setVisited((current) =>
                  current.includes(id) ? current : [...current, id],
                ),
              mode: setEntered,
              error: setError,
            },
            companies,
          );
        } catch {
          setError(
            'The 3D hall could not start. Try a browser with hardware acceleration, or explore the startup directory.',
          );
        }
      })
      .catch(() => {
        if (!gone)
          setError(
            'The exhibition could not finish loading. Check your connection and refresh, or explore the startup directory.',
          );
      });
    return () => {
      gone = true;
      abort.abort();
      hall.current?.dispose();
    };
  }, []);
  useEffect(() => {
    hall.current?.pause(!!panel || !!popup || !!adminOpen);
  }, [panel, popup, adminOpen]);
  useEffect(
    () =>
      registerExhibitionTools({
        list: () =>
          startups.map(({ id, name, sector }) => ({ id, name, sector })),
        open: (id) => {
          if (!Number.isInteger(id) || id < 1 || id > 11)
            throw new Error('Choose a booth from 1 to 11.');
          setSelected(id);
          setPanel('company');
        },
      }),
    [startups],
  );
  const visit = (id: number) => {
    hall.current?.visit(id);
    setPanel(null);
    if (id) {
      setSelected(id);
      setVisited((v) => (v.includes(id) ? v : [...v, id]));
    }
  };
  const s = startups[selected - 1];
  const slides = previewSlides(s);
  const nearby = entered
    ? startups
        .map((startup, i) => {
          const p = placement(i);
          return { startup, distance: Math.hypot(p.x - pos[0], p.z - pos[1]) };
        })
        .filter((item) => item.distance < 5.8)
        .sort((a, b) => a.distance - b.distance)[0]?.startup
    : undefined;
  const nextBooth = () =>
    visit(
      nearby ? (nearby.id % 11) + 1 : visited.length ? (selected % 11) + 1 : 1,
    );
  return (
    <main
      className={`exhibition ${entered ? 'is-entered' : ''}`}
      data-motion={moving ? 'active' : 'paused'}
    >
      <header className="topbar">
        <Link href="/" className="brand" aria-label="KIT Venture Hall home">
          <span className="kit">
            KIT<span className="kit-ray">◢</span>
          </span>
          <span className="brand-divider" />
          <span>
            VENTURE<span className="brand-light"> HALL</span>
          </span>
        </Link>
        <nav className="mainnav">
          <button
            className={!panel && !adminOpen ? 'active' : ''}
            onClick={() => {
              setAdminOpen(null);
              setPanel(null);
            }}
          >
            Exhibition
          </button>
          <button
            className={panel === 'directory' ? 'active' : ''}
            onClick={() => {
              setAdminOpen(null);
              setPanel('directory');
            }}
          >
            The startups <span className="count">11</span>
          </button>
          <button
            className={adminOpen === 'investment' ? 'active' : ''}
            onClick={() => {
              setPanel(null);
              setAdminOpen('investment');
            }}
          >
            Investment-Interesse
          </button>
          <button
            className={adminOpen === 'followup' ? 'active' : ''}
            onClick={() => {
              setPanel(null);
              setAdminOpen('followup');
            }}
          >
            Follow-up Requests
          </button>
        </nav>
        <button
          className="vr-button"
          disabled={!ready}
          onClick={() => hall.current?.vr()}
        >
          <Glasses size={19} /> Enter VR <ArrowUpRight size={17} />
        </button>
      </header>
      <div className="world" ref={host} />
      {adminOpen && (
        <InterestAdmin
          key={adminOpen}
          kind={adminOpen}
          close={() => setAdminOpen(null)}
        />
      )}
      <div className="world-shade" />
      <div className="event-label">
        <span className="live-dot" /> KIT · KARLSRUHE{' '}
        <span className="small-rule" /> INVESTOR EXPERIENCE
      </div>
      {!entered && (
        <section className="intro">
          <div className="eyebrow">A NEW PERSPECTIVE ON INNOVATION</div>
          <h1>
            Step into
            <br />
            what’s next<span>.</span>
          </h1>
          <p>
            11 startups. Extraordinary ideas.
            <br />
            One place to experience them.
          </p>
          <button
            className="primary"
            disabled={!ready}
            onClick={() => hall.current?.enter()}
          >
            {ready ? 'Enter the exhibition' : 'Preparing your exhibition'}
            <ArrowRight size={21} />
          </button>
          <button className="text-button" onClick={() => setPanel('directory')}>
            Meet the startups <ArrowUpRight size={16} />
          </button>
          <button
            className="text-button tour-start"
            disabled={!ready}
            onClick={() => visit(1)}
          >
            Start a booth-by-booth tour <ArrowRight size={16} />
          </button>
          <div className="compatibility">
            <span>DESKTOP</span>
            <i /> <span>META QUEST 3</span>
          </div>
        </section>
      )}
      {entered && (
        <div className="location">
          <span className="eyebrow">YOU ARE EXPLORING</span>
          <strong>{nearby ? nearby.name : 'The exhibition hall'}</strong>
          {nearby && (
            <span className="location-sector">
              {nearby.sector} · Booth {String(nearby.id).padStart(2, '0')}
            </span>
          )}
          <button
            onClick={() => (nearby ? select(nearby.id) : setPanel('directory'))}
          >
            {nearby ? 'View company & exhibit' : 'Choose a startup'}{' '}
            <ChevronRight size={16} />
          </button>
          {nearby && (
            <div className="booth-actions" aria-label="Booth shortcuts">
              <button onClick={() => setPopup({ id: nearby.id, type: 'jobs' })}>
                <BriefcaseBusiness size={16} />
                Careers
              </button>
              <button
                onClick={() => setPopup({ id: nearby.id, type: 'meeting' })}
              >
                Request follow up
              </button>
              <button
                onClick={() => setPopup({ id: nearby.id, type: 'investment' })}
              >
                Investment
              </button>
            </div>
          )}
          <div className="tour-controls">
            <button
              aria-label="Previous booth"
              onClick={() =>
                visit(nearby && nearby.id > 1 ? nearby.id - 1 : 11)
              }
            >
              <ArrowLeft size={17} />
            </button>
            <span>{visited.length} / 11 explored</span>
            <button onClick={nextBooth}>
              Next booth <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
      {entered && !panel && !popup && (focusHint || showWelcome) && (
        <div className={`explore-coach ${focusHint ? 'has-target' : ''}`}>
          <MousePointer2 size={18} />
          <span>
            {focusHint
              ? `Click · ${focusHint}`
              : 'Drag to look. Select a highlighted object to explore.'}
          </span>
          {!focusHint && (
            <button
              aria-label="Dismiss exploration tip"
              onClick={() => setShowWelcome(false)}
            >
              ×
            </button>
          )}
        </div>
      )}
      <div className="view-controls">
        <button
          title="Exhibition overview"
          aria-label="Exhibition overview"
          onClick={() => hall.current?.overview()}
        >
          <Compass size={20} />
        </button>
        <button
          title="Toggle floor plan"
          aria-label="Toggle floor plan"
          aria-pressed={map}
          onClick={() => setMap(!map)}
        >
          <Map size={20} />
        </button>
        <button
          title="How to explore"
          aria-label="How to explore"
          onClick={() => setPanel('help')}
        >
          <HelpCircle size={20} />
        </button>
        <button
          title="Full screen"
          aria-label="Full screen"
          onClick={() => {
            if (document.fullscreenElement)
              document.exitFullscreen().catch(() => {});
            else
              document.documentElement
                .requestFullscreen?.()
                .catch(() =>
                  setError('Full screen is unavailable in this browser.'),
                );
          }}
        >
          <Maximize size={18} />
        </button>
      </div>
      {map && (
        <aside className="minimap">
          <div className="map-heading">
            <span>THE FLOOR PLAN</span>
            <span>01</span>
          </div>
          <div className="floorplan">
            <div className="aisle" />
            {startups.map((s, i) => {
              const p = placement(i);
              return (
                <button
                  key={s.id}
                  className={`map-booth ${visited.includes(s.id) ? 'visited' : ''} ${nearby?.id === s.id ? 'is-current' : ''}`}
                  style={{
                    left: `${((p.x + 18) / 36) * 100}%`,
                    top: `${((p.z + 25) / 50) * 100}%`,
                  }}
                  onClick={() => visit(s.id)}
                  aria-label={`Visit booth ${s.id}: ${s.name}`}
                  title={s.name}
                  aria-current={nearby?.id === s.id ? 'location' : undefined}
                >
                  {String(s.id).padStart(2, '0')}
                </button>
              );
            })}
            <button
              className="map-info"
              onClick={() => visit(0)}
              title="Information desk"
              aria-label="Visit information desk"
            >
              i
            </button>
            <span
              className="map-you"
              style={{
                left: `${Math.max(3, Math.min(97, ((pos[0] + 18) / 36) * 100))}%`,
                top: `${Math.max(3, Math.min(97, ((pos[1] + 25) / 50) * 100))}%`,
              }}
            />
          </div>
          <div className="map-legend">
            <span>
              <i />
              You
            </span>
            <span>{visited.length} / 11 visited</span>
          </div>
        </aside>
      )}
      <footer className="bottom-bar">
        <div>
          <span className="status-dot" />
          <span>
            {contentSource === 'snapshot'
              ? 'PITCHLOAD · SAVED CONTENT'
              : contentSource === 'pitchload'
                ? 'PITCHLOAD · LIVE CONTENT'
                : contentSource === 'partial'
                  ? 'PITCHLOAD · PARTIAL PREVIEW'
                  : 'EXHIBITION PREVIEW'}
          </span>
        </div>
        <div className="desktop-hint">
          <MousePointer2 size={15} /> Drag to look{' '}
          <span className="key-group">W A S D</span> to move
        </div>
        <button
          onClick={() => {
            visit(0);
            setPanel('directory');
          }}
        >
          <Info size={17} /> Information desk <ArrowUpRight size={15} />
        </button>
      </footer>
      {entered && (
        <div className="touch-controls">
          {[
            { t: '↑', x: 0, z: -1 },
            { t: '←', x: -1, z: 0 },
            { t: '↓', x: 0, z: 1 },
            { t: '→', x: 1, z: 0 },
          ].map((k) => (
            <button
              key={k.t}
              aria-label={`Move ${k.t}`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                hall.current?.move(k.x, k.z);
              }}
              onPointerUp={() => hall.current?.move(0, 0)}
              onPointerCancel={() => hall.current?.move(0, 0)}
            >
              {k.t}
            </button>
          ))}
        </div>
      )}
      {error && (
        <output className="notice" aria-live="polite">
          <p>{error}</p>
          <button aria-label="Dismiss message" onClick={() => setError('')}>
            ×
          </button>
        </output>
      )}
      <Sheet
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <SheetContent className="details-panel" side="right">
          <div className="panel-inner">
            {panel === 'directory' ? (
              <>
                <span className="eyebrow">INFORMATION DESK</span>
                <SheetTitle className="panel-title">
                  Meet the startups<span>.</span>
                </SheetTitle>
                <SheetDescription className="panel-subtitle">
                  Eleven perspectives on what comes next. Select a company to
                  discover its work.
                </SheetDescription>
                <div className="startup-list">
                  {startups.map((s) => (
                    <button
                      className="startup-row"
                      key={s.id}
                      onClick={() => select(s.id)}
                    >
                      <span className="startup-number">
                        {String(s.id).padStart(2, '0')}
                      </span>
                      <span
                        className="startup-monogram"
                        style={{ background: s.color }}
                      >
                        {s.name.slice(0, 1)}
                      </span>
                      <span className="startup-info">
                        <strong>{s.name}</strong>
                        <small>{s.sector}</small>
                      </span>
                      <ArrowUpRight size={19} />
                    </button>
                  ))}
                </div>
                <p className="content-note">
                  {
                    startups.filter((s) => s.contentSource === 'pitchload')
                      .length
                  }{' '}
                  profiles from Pitchload. Other booths retain their preview
                  information. 3D exhibits remain illustrative. Investment
                  figures identify Pitchload data or demo content.
                  {contentDate &&
                    ` Content retrieved ${new Date(contentDate).toLocaleDateString('de-DE')}.`}
                </p>
              </>
            ) : panel === 'company' ? (
              <>
                <button
                  className="back-button"
                  onClick={() => setPanel('directory')}
                >
                  <ArrowLeft size={16} /> All startups
                </button>
                <div className="company-mark" style={{ background: s.color }}>
                  {s.name[0]}
                  <span>{String(s.id).padStart(2, '0')}</span>
                </div>
                <span className="eyebrow">
                  BOOTH {String(s.id).padStart(2, '0')} /{' '}
                  {s.sector.toUpperCase()}
                </span>
                <SheetTitle className="panel-title">{s.name}</SheetTitle>
                <SheetDescription className="company-headline">
                  {s.headline}
                </SheetDescription>
                <Tabs
                  value={companyTab}
                  onValueChange={(value) => setCompanyTab(String(value))}
                  key={s.id}
                  className="company-tabs"
                >
                  <TabsList variant="line">
                    <TabsTrigger value="about">Company</TabsTrigger>
                    <TabsTrigger value="facts">Profile data</TabsTrigger>
                    <TabsTrigger value="exhibit">Exhibit</TabsTrigger>
                    <TabsTrigger value="slides">Slides</TabsTrigger>
                    <TabsTrigger value="video">Video</TabsTrigger>
                    <TabsTrigger value="jobs">
                      Jobs {s.jobs.length ? `(${s.jobs.length})` : ''}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="facts">
                    <ProfileFacts startup={s} />
                  </TabsContent>
                  <TabsContent value="about">
                    <div className="profile-source">
                      <span className="status-dot" />
                      {s.contentSource === 'pitchload'
                        ? 'Company information from Pitchload'
                        : 'Exhibition preview profile'}
                    </div>
                    <dl className="profile-metrics">
                      {companyFacts(s).map((fact) => (
                        <div key={fact.label}>
                          <dt>{fact.label}</dt>
                          <dd>{fact.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <section className="profile-overview">
                      <span className="eyebrow">AT A GLANCE</span>
                      <p>
                        {excerpt(profileParagraphs(s)[0] || s.description, 420)}
                      </p>
                    </section>
                    <details className="profile-story" key={s.id}>
                      <summary>
                        Read the complete company profile{' '}
                        <ArrowRight size={17} />
                      </summary>
                      <div>
                        {profileParagraphs(s).map((paragraph, index) => (
                          <p className="company-copy" key={index}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </details>
                    {s.source && (
                      <a
                        className="source-link"
                        href={s.source}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Company profile · {s.sourceLabel}{' '}
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {s.pending && (
                      <p className="content-note">
                        Profile awaiting confirmation from the event team.
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="exhibit">
                    <div className="exhibit-card">
                      <Box size={32} />
                      <h3>{exhibitConcept(s.id).title}</h3>
                      <p>{exhibitConcept(s.id).description}</p>
                      <p>
                        Select {exhibitConcept(s.id).action} at the booth.
                        Select again to reset.
                      </p>
                      <span className="content-note">
                        Illustrative concept · not a supplied product model or
                        live digital twin.
                      </span>
                    </div>
                  </TabsContent>
                  <TabsContent value="slides">
                    <div className="slide-reader">
                      <span className="eyebrow">
                        {slides[slideIndex].eyebrow}
                      </span>
                      <h3>{slides[slideIndex].title}</h3>
                      <p>{slides[slideIndex].body}</p>
                      <small>
                        Exhibition preview · official deck to follow
                      </small>
                    </div>
                    <div className="slide-navigation">
                      <button
                        aria-label="Previous slide"
                        onClick={() =>
                          setSlideIndex(
                            (slideIndex + slides.length - 1) % slides.length,
                          )
                        }
                      >
                        ← Previous
                      </button>
                      <span>
                        {slideIndex + 1} / {slides.length}
                      </span>
                      <button
                        aria-label="Next slide"
                        onClick={() =>
                          setSlideIndex((slideIndex + 1) % slides.length)
                        }
                      >
                        Next →
                      </button>
                    </div>
                  </TabsContent>
                  <TabsContent value="video">
                    <video
                      className="booth-video"
                      controls
                      playsInline
                      preload="none"
                      poster="/media/venture-preview-poster.jpg"
                      src={previewVideo}
                    >
                      <track
                        kind="captions"
                        label="English"
                        srcLang="en"
                        src="/media/preview.vtt"
                        default
                      />
                    </video>
                    <p className="content-note">
                      18-second silent exhibition preview. Official startup
                      films will be supplied by the media service.
                    </p>
                  </TabsContent>
                  <TabsContent value="jobs">
                    {boothJobs(s).map((j, jobIndex) => (
                      <button
                        className="job-card"
                        onClick={() => {
                          setPanel(null);
                          setPopup({ id: s.id, type: 'jobs', jobIndex });
                        }}
                        key={j.title}
                      >
                        <BriefcaseBusiness size={20} />
                        <strong>{j.title}</strong>
                        <p>{j.location}</p>
                        <span>
                          {j.preview ? 'Open sample job card' : 'Read job card'}{' '}
                          <ArrowUpRight size={16} />
                        </span>
                      </button>
                    ))}
                  </TabsContent>
                </Tabs>
                <button
                  className="primary visit-button"
                  disabled={!ready}
                  onClick={() => visit(s.id)}
                >
                  Visit {s.name} <MoveUpRight size={20} />
                </button>
                <div className="investment-banner">
                  <span>{investmentDisplay(s).label} · {investmentDisplay(s).source}</span>
                  <strong>{investmentDisplay(s).amount}</strong>
                  <small>{investmentDisplay(s).note}</small>
                  <button
                    className="interest-banner-button"
                    onClick={() => {
                      setPanel(null);
                      setPopup({ id: s.id, type: 'investment' });
                    }}
                  >
                    Unverbindliches Interesse bekunden{' '}
                    <ArrowUpRight size={18} />
                  </button>
                </div>
                <button
                  className="booking-link"
                  onClick={() => {
                    setPanel(null);
                    setPopup({ id: s.id, type: 'meeting' });
                  }}
                >
                  Request follow up <ArrowUpRight size={18} />
                </button>
                <p className="booking-note">
                  Your request is saved for the event team.
                </p>
                <p className="content-note">
                  {s.contentSource === 'pitchload'
                    ? `Company content provided by Pitchload.${contentDate ? ' Retrieved ' + new Date(contentDate).toLocaleDateString('de-DE') + '.' : ''}`
                    : 'Public information reviewed 7 September 2026.'}
                </p>
              </>
            ) : (
              <>
                <span className="eyebrow">MAKE YOURSELF AT HOME</span>
                <SheetTitle className="panel-title">
                  How to explore<span>.</span>
                </SheetTitle>
                <SheetDescription>
                  Move at your own pace, or jump straight to a startup.
                </SheetDescription>
                <div className="help-step">
                  <MousePointer2 />
                  <div>
                    <h3>On desktop</h3>
                    <p>
                      Drag the scene to look around. Use W A S D or the arrow
                      keys to walk. Click a booth to open its profile.
                    </p>
                  </div>
                </div>
                <div className="help-step">
                  <Map />
                  <div>
                    <h3>Find your way</h3>
                    <p>
                      Choose a numbered booth on the floor plan to move there.
                      The information desk lists all eleven startups.
                    </p>
                  </div>
                </div>
                <div className="help-step">
                  <Glasses />
                  <div>
                    <h3>In Meta Quest</h3>
                    <p>
                      Open the exhibition URL in Meta Quest Browser and select
                      Enter VR. Point at the floor and press the trigger to
                      teleport. Use the left thumbstick to walk: forward,
                      backward, or sideways relative to where you look. Push
                      further to walk faster. Move the right thumbstick left or
                      right to snap turn. Center the sticks after closing a
                      reader or the headset menu to resume moving. Use the menu
                      on your left controller to return to the desk or exit.
                    </p>
                  </div>
                </div>
                <button
                  className="motion-button"
                  aria-pressed={!moving}
                  onClick={() => {
                    setMoving(!moving);
                    hall.current?.motion(!moving);
                  }}
                >
                  {moving
                    ? 'Pause exhibit animation'
                    : 'Resume exhibit animation'}
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      {popup && (
        <BoothPopup
          key={`${popup.id}-${popup.type}-${popup.jobIndex || 0}`}
          startup={startups.find((s) => s.id === popup.id)!}
          type={popup.type}
          initialJobIndex={popup.jobIndex}
          close={() => setPopup(null)}
        />
      )}
    </main>
  );
}
