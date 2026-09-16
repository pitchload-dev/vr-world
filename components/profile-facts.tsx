'use client';
import type { Startup } from '@/lib/startups';
import { fullProfile, profileGroups, unavailable } from '@/lib/profile-fields';
export function ProfileFacts({ startup }: { startup: Startup }) {
  const p = fullProfile(startup);
  return (
    <div className="profile-data" lang="en">
      <p className="profile-data-note">
        {p.provenance === 'pitchload'
          ? 'Profile data supplied by Pitchload.'
          : p.provenance === 'provided'
            ? 'KCM details supplied in the event organizer’s screenshot.'
            : 'Preview profile.'}{' '}
        Missing values are shown as “Noch nicht verfügbar”.
      </p>
      {profileGroups(startup).map((group) => (
        <section className="profile-data-card" key={group.title}>
          <h3>{group.title}</h3>
          <dl>
            {group.fields.map((f) => (
              <div
                key={f.label}
                className={f.value === unavailable ? 'is-missing' : ''}
              >
                <dt>{f.label}</dt>
                <dd>
                  {f.link ? (
                    <a href={f.link} target="_blank" rel="noreferrer">
                      {f.value} ↗
                    </a>
                  ) : (
                    f.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {group.title === 'Headquarters' && p.address && (
            <a
              className="headquarters-map"
              href={`https://www.openstreetmap.org/search?query=${encodeURIComponent([p.legalName, p.address, p.city].filter(Boolean).join(', '))}`}
              target="_blank"
              rel="noreferrer"
            >
              View headquarters on map ↗
            </a>
          )}
        </section>
      ))}
    </div>
  );
}
