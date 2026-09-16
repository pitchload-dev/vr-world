import * as THREE from 'three';
import type { Startup } from './startups';
import { validFollowUpContact } from './follow-up';
import { submitInterest, submitFollowUp } from './interest-client';
import { profileReaderPages, type ProfilePage } from './profile-reader';
import {
  boothJobs,
  previewSlides,
  interestLimits,
  type BoothPopupType,
} from './booth-content';

// A world-anchored reader: placed in front of the headset once, never head locked.
export function createImmersivePopup(
  scene: THREE.Scene,
  head: () => THREE.Camera,
  saveInterest = submitInterest,
  saveFollowUp = submitFollowUp,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const c = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 1.08), material);
  panel.visible = false;
  panel.renderOrder = 100;
  scene.add(panel);
  const cueGeometry = new THREE.BufferGeometry();
  cueGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(12), 3),
  );
  const cueMaterial = new THREE.LineBasicMaterial({
    color: '#78cfb5',
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const cue = new THREE.LineLoop(cueGeometry, cueMaterial);
  cue.renderOrder = 101;
  cue.visible = false;
  cue.raycast = () => {};
  panel.add(cue);
  let pressedButton: { x: number; y: number; w: number; h: number } | undefined;
  let pressedAt = -Infinity;

  let company: Startup,
    mode: BoothPopupType | 'slides' | 'profile' = 'jobs';
  let profilePages: ProfilePage[] = [];
  let saving = false,
    saveError = false,
    generation = 0;
  let attempt: { signature: string; id: string } | null = null;
  let interestStep = 100;
  let contactName = '',
    contactEmail = '',
    contactError = '';
  let editing: 'name' | 'email' | null = null;
  let uppercase = false;
  let hovered = -1;
  let interested: boolean | null = null,
    interestAmount: number | null = 25000;
  let job = 0,
    page = 0,
    confirmed = false;
  let buttons: {
    x: number;
    y: number;
    w: number;
    h: number;
    run: () => void;
  }[] = [];
  const close = () => {
    generation++;
    saving = false;
    panel.visible = false;
    buttons = [];
    hovered = -1;
  };
  function text(
    value: string,
    x: number,
    y: number,
    size = 30,
    color = '#d8e7de',
  ) {
    c.font = `${size >= 40 ? 600 : 400} ${size}px Arial`;
    c.fillStyle = color;
    c.fillText(value, x, y);
  }
  function lines(value: string, width: number, size: number) {
    c.font = `${size}px Arial`;
    const result: string[] = [];
    let line = '';
    for (const word of value.split(/\s+/)) {
      if (line && c.measureText(line + ' ' + word).width > width) {
        result.push(line);
        line = '';
      }
      line += (line ? ' ' : '') + word;
    }
    if (line) result.push(line);
    return result;
  }
  function button(
    label: string,
    x: number,
    y: number,
    w: number,
    run: () => void,
    selected = false,
    disabled = false,
  ) {
    disabled = disabled || (['investment', 'meeting'].includes(mode) && saving);
    c.fillStyle = disabled ? '#29443c' : selected ? '#c6e889' : '#edf4ea';
    c.beginPath();
    c.roundRect(x, y, w, 70, 12);
    c.fill();
    text(label, x + 20, y + 46, 28, disabled ? '#93a49b' : '#173e36');
    if (!disabled) {
      if (buttons.length === hovered) {
        c.strokeStyle = mode === 'investment' ? '#2e72ff' : '#68dfff';
        c.lineWidth = 5;
        c.stroke();
      }
      buttons.push({ x, y, w, h: 70, run });
    }
  }
  function draw() {
    buttons = [];
    c.fillStyle = mode === 'investment' ? '#ffffff' : '#102f29';
    c.fillRect(0, 0, 1200, 900);
    c.fillStyle = company.color;
    c.fillRect(0, 0, 1200, 10);
    text(
      company.name.toUpperCase(),
      54,
      78,
      34,
      mode === 'investment' ? '#16362c' : company.color,
    );
    button(
      mode === 'investment' ? 'Schließen ×' : 'Close ×',
      mode === 'investment' ? 920 : 968,
      34,
      mode === 'investment' ? 226 : 178,
      close,
    );
    if (mode === 'profile') {
      const current = profilePages[page];
      text(current.title, 54, 161, 44, '#ffffff');
      current.rows.forEach((row, i) =>
        text(
          row.text,
          54,
          224 + i * 39,
          row.label ? 27 : 30,
          row.label ? '#b8d3bd' : '#ffffff',
        ),
      );
      text(
        `ALL PROFILE FIELDS · PAGE ${page + 1} / ${profilePages.length}`,
        54,
        724,
        25,
      );
      button(
        '← Previous',
        54,
        758,
        520,
        () => {
          page--;
          draw();
        },
        false,
        page === 0,
      );
      button(
        'Next →',
        604,
        758,
        542,
        () => {
          page++;
          draw();
        },
        false,
        page === profilePages.length - 1,
      );
      text(
        'Squeeze either controller to bring this panel back in front of you.',
        54,
        868,
        24,
      );
    } else if (mode === 'slides') {
      const slides = previewSlides(company),
        slide = slides[job];
      text(slide.eyebrow, 54, 154, 27, '#b8d3bd');
      lines(slide.title, 1090, 44)
        .slice(0, 3)
        .forEach((line, i) => text(line, 54, 230 + i * 53, 44, '#ffffff'));
      const body = lines(slide.body, 1085, 33);
      const pages = Math.max(1, Math.ceil(body.length / 6));
      page = Math.min(page, pages - 1);
      body
        .slice(page * 6, page * 6 + 6)
        .forEach((line, i) => text(line, 54, 430 + i * 44, 33));
      text(
        `PREVIEW SLIDE ${job + 1} / ${slides.length} · PAGE ${page + 1} / ${pages}`,
        54,
        724,
        25,
      );
      button(
        '← Previous',
        54,
        758,
        350,
        () => {
          if (page > 0) page--;
          else {
            job--;
            page = 0;
          }
          draw();
        },
        false,
        job === 0 && page === 0,
      );
      button(
        page < pages - 1 ? 'Read more →' : 'Next slide →',
        434,
        758,
        350,
        () => {
          if (page < pages - 1) page++;
          else {
            job++;
            page = 0;
          }
          draw();
        },
        false,
        job === slides.length - 1 && page === pages - 1,
      );
      button('Request follow up', 814, 758, 332, () => {
        mode = 'meeting';
        draw();
      });
      text(
        'Squeeze either controller to bring this panel back in front of you.',
        54,
        868,
        24,
      );
    } else if (mode === 'jobs') {
      const jobs = boothJobs(company),
        current = jobs[job];
      text(
        current.preview
          ? 'CAREERS / SAMPLE ROLE'
          : 'CAREERS / PUBLISHED LISTING',
        54,
        142,
        25,
      );
      const title = lines(current.title, 1090, 43);
      title
        .slice(0, 2)
        .forEach((line, i) => text(line, 54, 206 + i * 52, 43, '#ffffff'));
      const location = lines(current.location, 1090, 27);
      location
        .slice(0, 2)
        .forEach((line, i) => text(line, 54, 318 + i * 36, 27, '#b8d3bd'));
      const body = lines(current.description, 1085, 33);
      const pages = Math.max(1, Math.ceil(body.length / 6));
      page = Math.min(page, pages - 1);
      body
        .slice(page * 6, page * 6 + 6)
        .forEach((line, i) => text(line, 54, 418 + i * 44, 33));
      text(
        `ROLE ${job + 1} / ${jobs.length} · PAGE ${page + 1} / ${pages}`,
        54,
        722,
        25,
      );
      button(
        '← Back',
        54,
        758,
        200,
        () => {
          page--;
          draw();
        },
        false,
        page === 0,
      );
      button(
        'Read more →',
        274,
        758,
        250,
        () => {
          page++;
          draw();
        },
        false,
        page === pages - 1,
      );
      button(
        'Next role →',
        544,
        758,
        250,
        () => {
          job = (job + 1) % jobs.length;
          page = 0;
          draw();
        },
        false,
        jobs.length < 2,
      );
      button('Request follow up', 814, 758, 332, () => {
        mode = 'meeting';
        draw();
      });
      text(
        'Published application links are available in the desktop company profile.',
        54,
        867,
        23,
      );
    } else if (mode === 'investment') {
      const ink = (value: string, x: number, y: number, size = 30) =>
        text(value, x, y, size, '#101c29');
      ink('Unverbindliche Interessenbekundung', 54, 153, 39);
      c.fillStyle = '#e4edff';
      c.beginPath();
      c.roundRect(54, 185, 1092, 120, 22);
      c.fill();
      lines(
        'Dieses Demo-Angebot ist noch nicht zur Zeichnung geöffnet. Ihre unverbindliche Angabe wird für das Veranstaltungsteam gespeichert. Es entsteht keine Verpflichtung.',
        990,
        28,
      ).forEach((line, i) => ink(line, 88, 226 + i * 34, 28));
      if (confirmed) {
        ink('Ihre Angabe wurde gespeichert.', 54, 398, 42);
        ink(
          interested ? 'Ja, ich bin interessiert' : 'Nein, nicht interessiert',
          54,
          476,
          34,
        );
        if (interested && interestAmount !== null)
          ink(
            interestAmount.toLocaleString('de-DE') + ' € · unverbindlich',
            54,
            540,
            38,
          );
        ink('In der geschützten Tabelle des Veranstaltungsteams.', 54, 634, 29);
        ink('Es wurde keine Investition getätigt.', 54, 679, 29);
        button('Weitere Angabe', 54, 758, 440, () => {
          confirmed = false;
          attempt = null;
          draw();
        });
        button('Zurück zum Stand', 524, 758, 500, close);
      } else {
        ink('Hätten Sie potenziell Interesse an diesem Angebot?', 54, 355, 31);
        button(
          'Ja, ich bin interessiert',
          54,
          384,
          520,
          () => {
            interested = true;
            draw();
          },
          interested === true,
        );
        button(
          'Nein, nicht interessiert',
          604,
          384,
          542,
          () => {
            interested = false;
            draw();
          },
          interested === false,
        );
        if (interested === true) {
          ink(
            'Welchen Betrag würden Sie ggf. in Betracht ziehen?',
            54,
            502,
            30,
          );
          ink(
            interestAmount === null
              ? 'Ohne Betrag'
              : interestAmount.toLocaleString('de-DE') + ' €',
            54,
            563,
            36,
          );
          button(
            interestAmount === null ? 'Betrag angeben' : 'Ohne Betrag',
            826,
            518,
            320,
            () => {
              interestAmount = interestAmount === null ? 25000 : null;
              draw();
            },
          );
          const adjust = (delta: number) => {
            if (interestAmount === null) return;
            interestAmount = Math.min(
              interestLimits.max,
              Math.max(interestLimits.min, interestAmount + delta),
            );
            draw();
          };
          button(
            '− ' + interestStep.toLocaleString('de-DE') + ' €',
            334,
            518,
            226,
            () => adjust(-interestStep),
            false,
            interestAmount === null || interestAmount <= interestLimits.min,
          );
          button(
            '+ ' + interestStep.toLocaleString('de-DE') + ' €',
            580,
            518,
            226,
            () => adjust(interestStep),
            false,
            interestAmount === null || interestAmount >= interestLimits.max,
          );
          ink('Schrittweite wählen', 54, 614, 23);
          [10, 100, 500, 1000, 10000].forEach((step, i) =>
            button(
              step.toLocaleString('de-DE') + ' €',
              54 + i * 220,
              631,
              212,
              () => {
                interestStep = step;
                draw();
              },
              interestStep === step,
            ),
          );
        } else {
          ink('Ihre Auswahl bleibt unverbindlich.', 54, 536, 34);
          ink(
            'Ihre Auswahl wird für das Veranstaltungsteam gespeichert.',
            54,
            594,
            28,
          );
        }
        ink(
          saveError
            ? 'Nicht gespeichert. Bitte erneut versuchen.'
            : 'Demo · Keine Investition, kein Angebot, keine Verpflichtung.',
          54,
          739,
          24,
        );
        button('Abbrechen', 54, 758, 440, close);
        button(
          saving ? 'Wird gespeichert …' : 'Interesse speichern',
          524,
          758,
          622,
          () => {
            void persistInterest();
          },
          true,
          interested === null,
        );
        ink(
          'Gespeichert: Startup, Zeitpunkt, Auswahl, Betrag · ohne Kontaktdaten.',
          54,
          871,
          24,
        );
      }
    } else {
      text('FOLLOW-UP REQUEST', 54, 153, 27, '#b8d3bd');
      const fit = (value: string, width = 1000) => {
        c.font = '28px Arial';
        let result = value;
        while (result.length && c.measureText(result).width > width)
          result = result.slice(1);
        return result === value ? value : '…' + result;
      };
      if (editing) {
        text(
          editing === 'name' ? 'Name (optional)' : 'E-Mail (optional)',
          54,
          217,
          38,
          '#ffffff',
        );
        text(
          fit((editing === 'name' ? contactName : contactEmail) + ' |'),
          54,
          277,
          28,
          '#c6e889',
        );
        const rows = [
          '1234567890',
          'qwertzuiop',
          'asdfghjkl@',
          'yxcvbnm.-_',
          "äöüß+!'%=&",
        ];
        rows.forEach((row, r) =>
          Array.from(row).forEach((key, col) => {
            const character = uppercase ? key.toUpperCase() : key;
            button(character, 54 + col * 110, 310 + r * 80, 102, () => {
              if (
                editing === 'name' &&
                contactName.length + character.length <= 120
              )
                contactName += character;
              if (
                editing === 'email' &&
                contactEmail.length + character.length <= 254
              )
                contactEmail += character;
              draw();
            });
          }),
        );
        button(
          uppercase ? 'abc' : 'ABC',
          54,
          730,
          180,
          () => {
            uppercase = !uppercase;
            draw();
          },
          uppercase,
        );
        button(
          'Leerzeichen',
          254,
          730,
          285,
          () => {
            if (contactName.length < 120) contactName += ' ';
            draw();
          },
          false,
          editing === 'email',
        );
        button('← Löschen', 559, 730, 280, () => {
          if (editing === 'name')
            contactName = Array.from(contactName).slice(0, -1).join('');
          else contactEmail = contactEmail.slice(0, -1);
          draw();
        });
        button(
          'Fertig ✓',
          859,
          730,
          287,
          () => {
            editing = null;
            draw();
          },
          true,
        );
        text(
          'Mit dem Controller auf eine Taste zeigen und den Trigger drücken.',
          54,
          855,
          24,
        );
      } else if (confirmed) {
        text('Your request has been saved', 54, 225, 44, '#ffffff');
        text(
          fit(contactName || 'Name: nicht angegeben'),
          54,
          332,
          28,
          '#c6e889',
        );
        text(
          fit(contactEmail || 'E-Mail: nicht angegeben'),
          54,
          390,
          28,
          '#c6e889',
        );
        lines(
          'Ihre Follow-up-Anfrage und Kontaktdaten sind für das Veranstaltungsteam gespeichert.',
          1050,
          32,
        ).forEach((line, i) => text(line, 54, 490 + i * 43, 32));
        if (!contactEmail.trim())
          text(
            'Ohne E-Mail: Bitte sprechen Sie das Team vor Ort an.',
            54,
            615,
            28,
          );
        text('Reference: ' + (attempt?.id || ''), 54, 674, 24);
        button('Another request', 54, 730, 420, () => {
          confirmed = false;
          attempt = null;
          draw();
        });
        button('Back to the booth', 504, 730, 530, close);
      } else {
        text('Request follow up', 54, 220, 40, '#ffffff');
        text('Name (optional)', 54, 297, 28);
        button(fit(contactName || 'Name eingeben …'), 54, 320, 1092, () => {
          editing = 'name';
          contactError = '';
          draw();
        });
        text('E-Mail für die Rückmeldung (optional)', 54, 447, 28);
        button(fit(contactEmail || 'E-Mail eingeben …'), 54, 470, 1092, () => {
          editing = 'email';
          contactError = '';
          draw();
        });
        text('Feld auswählen und mit der VR-Tastatur ausfüllen.', 54, 592, 28);
        text(
          contactError ||
            (saveError
              ? 'Nicht gespeichert. Bitte erneut versuchen.'
              : 'Ihre Angaben werden für das Veranstaltungsteam gespeichert.'),
          54,
          660,
          27,
        );
        button(
          saving ? 'Wird gespeichert …' : 'Follow-up anfragen',
          54,
          730,
          1092,
          () => {
            void persistFollowUp();
          },
          true,
        );
        text(
          'Name und E-Mail sind freiwillig. Ohne E-Mail ist keine Rückmeldung möglich.',
          54,
          856,
          24,
        );
      }
    }

    texture.needsUpdate = true;
  }
  panel.userData.activate = (hit: THREE.Intersection) => {
    if (!hit.uv) return;
    const x = hit.uv.x * 1200,
      y = (1 - hit.uv.y) * 900;
    const selected = buttons.find(
      (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
    );
    hovered = -1;
    if (selected) {
      const before = `${mode}/${editing}/${confirmed}/${job}/${page}/${generation}`;
      selected.run();
      if (
        before ===
        `${mode}/${editing}/${confirmed}/${job}/${page}/${generation}`
      ) {
        pressedButton = selected;
        pressedAt = performance.now() / 1000;
      } else pressedButton = undefined;
    }
  };
  async function persistFollowUp() {
    if (saving) return;
    if (!validFollowUpContact(contactName, contactEmail)) {
      contactError = 'Bitte geben Sie eine gültige E-Mail-Adresse an.';
      draw();
      return;
    }
    const current = generation;
    const input = {
      startupId: company.id,
      name: contactName.trim(),
      email: contactEmail.trim(),
      source: 'vr' as const,
    };
    const signature = JSON.stringify(input);
    if (attempt?.signature !== signature)
      attempt = { signature, id: crypto.randomUUID() };
    saving = true;
    saveError = false;
    draw();
    try {
      await saveFollowUp({ ...input, submissionId: attempt.id });
      if (current === generation) confirmed = true;
    } catch {
      if (current === generation) saveError = true;
    } finally {
      if (current === generation) {
        saving = false;
        draw();
      }
    }
  }
  async function persistInterest() {
    if (saving || interested === null) return;
    const current = generation;
    const input = {
      startupId: company.id,
      interested,
      amount: interested ? interestAmount : null,
      source: 'vr' as const,
    };
    const signature = JSON.stringify(input);
    if (attempt?.signature !== signature)
      attempt = { signature, id: crypto.randomUUID() };
    saving = true;
    saveError = false;
    draw();
    try {
      await saveInterest({ ...input, submissionId: attempt.id });
      if (current === generation) confirmed = true;
    } catch {
      if (current === generation) saveError = true;
    } finally {
      if (current === generation) {
        saving = false;
        draw();
      }
    }
  }
  function recenter() {
    const camera = head();
    camera.getWorldPosition(panel.position);
    camera.getWorldQuaternion(panel.quaternion);
    panel.position.add(
      new THREE.Vector3(0, 0, -1.55).applyQuaternion(panel.quaternion),
    );
    panel.updateMatrixWorld(true);
  }
  return {
    get active() {
      return panel.visible;
    },
    targets: [panel],
    update(time: number, motion: boolean) {
      cue.visible = false;
      if (!panel.visible || !motion) return;
      const age = (time - pressedAt) / 0.28;
      const pulse = time % 7;
      const available = buttons.slice(1);
      const button =
        age >= 0 && age < 1 && pressedButton
          ? pressedButton
          : !editing && !saving && pulse < 1.2 && available.length
            ? available[Math.floor(time / 7) % available.length]
            : undefined;
      if (!button) return;
      const pressing = button === pressedButton && age >= 0 && age < 1;
      const inset = pressing ? 3 - age * 5 : 3;
      const left = ((button.x + inset) / 1200) * 1.44 - 0.72;
      const right = ((button.x + button.w - inset) / 1200) * 1.44 - 0.72;
      const top = 0.54 - ((button.y + inset) / 900) * 1.08;
      const bottom = 0.54 - ((button.y + button.h - inset) / 900) * 1.08;
      const positions = cueGeometry.getAttribute(
        'position',
      ) as THREE.BufferAttribute;
      positions.setXYZ(0, left, top, 0.002);
      positions.setXYZ(1, right, top, 0.002);
      positions.setXYZ(2, right, bottom, 0.002);
      positions.setXYZ(3, left, bottom, 0.002);
      positions.needsUpdate = true;
      cueGeometry.computeBoundingSphere();
      cueMaterial.opacity = pressing
        ? (1 - age) * 0.9
        : Math.sin((pulse / 1.2) * Math.PI) * 0.6;
      cue.visible = true;
    },
    close,
    recenter,
    hover(hit?: THREE.Intersection) {
      const x = (hit?.uv?.x ?? -1) * 1200,
        y = (1 - (hit?.uv?.y ?? 2)) * 900;
      const next = buttons.findIndex(
        (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
      );
      if (next !== hovered) {
        hovered = next;
        if (panel.visible) draw();
      }
      return next >= 0;
    },
    open(
      startup: Startup,
      type: BoothPopupType | 'slides' | 'profile',
      initialJobIndex = 0,
    ) {
      company = startup;
      generation++;
      saving = false;
      saveError = false;
      attempt = null;
      pressedButton = undefined;
      cue.visible = false;
      mode = type;
      if (type === 'profile') {
        c.font = '30px Arial';
        profilePages = profileReaderPages(
          startup,
          (value) => c.measureText(value).width,
        );
      }
      job = page = 0;
      if (type === 'jobs')
        job = Math.max(
          0,
          Math.min(initialJobIndex, boothJobs(startup).length - 1),
        );
      contactName = contactEmail = contactError = '';
      editing = null;
      uppercase = false;
      confirmed = false;
      hovered = -1;
      interested = null;
      interestAmount = 25000;
      interestStep = 100;
      panel.visible = true;
      recenter();
      draw();
    },
    dispose() {
      generation++;
      cueGeometry.dispose();
      cueMaterial.dispose();
      panel.removeFromParent();
      panel.geometry.dispose();
      texture.dispose();
      material.dispose();
    },
  };
}
