# KIT Venture Hall – mit Speicherung

Dieses Paket enthält die fertige Website und eine Netlify-Funktion. Die Funktion speichert Interessenbekundungen und Follow-up-Anfragen dauerhaft in Netlify Blobs. Neue Deployments derselben Netlify-Site behalten die Daten. Eine andere Site hat einen eigenen Speicher.

## Einmalig bei Netlify einrichten

**Dieses Paket muss mit der Netlify CLI bereitgestellt werden. Ein Upload über Netlify Drop installiert nur statische Dateien und aktiviert die Speicherung nicht.**

Im Terminal diesen entpackten Ordner öffnen und folgende Schritte ausführen:

1. `npx --yes netlify-cli@27.6.0 login` – im Browser bei Netlify anmelden.
2. `npx --yes netlify-cli@27.6.0 link` – die bestehende Ausstellungs-Site auswählen. Falls noch keine existiert: `npx --yes netlify-cli@27.6.0 sites:create` und anschließend verknüpfen.
3. `npx --yes netlify-cli@27.6.0 deploy --prod --dir=public --functions=netlify/functions` – Website und Backend gemeinsam veröffentlichen.
4. Die HTTPS-Adresse öffnen. Oben auf **Investment-Interesse** oder **Follow-up Requests** klicken und das vom Veranstalter festgelegte Passwort eingeben.
5. Eine Testmeldung absenden und anschließend in der geschützten Tabelle prüfen. Testmeldungen bleiben echte Einträge der Tabelle.

Der vorgegebene Zugang ist als gesalzener Passwortprüfwert ausschließlich im Servercode hinterlegt. Weder das Klartextpasswort noch dieser Prüfwert stehen im öffentlichen Website-Ordner. Ein späteres anderes Passwort kann über einen neuen PBKDF2-Prüfwert in `INTEREST_ADMIN_PASSWORD_HASH` gesetzt werden. Format: `600000:32-stellige-Salt-Hex:64-stellige-Hash-Hex`, PBKDF2 mit SHA-256 und 600.000 Durchläufen. Danach die Funktion erneut bereitstellen.

Der Pitchload-API-Schlüssel wird nicht benötigt: Die Firmenprofile sind weiterhin der gespeicherte Datenstand vom 9. September 2026.

## Gespeicherte Tabellen

Startup, serverseitiger Zeitpunkt, Interesse Ja/Nein, optionaler Eurobetrag, Zugang Desktop/VR und eine technische Übertragungs-ID. Namen oder Kontaktdaten werden nicht abgefragt. Gleiches erneutes Absenden nach einem Verbindungsfehler erzeugt keinen doppelten Eintrag. „Weitere Angabe“ erzeugt bewusst eine neue Meldung; die Tabelle zählt keine eindeutigen Personen.

Die eigene Tabelle **Follow-up Requests** enthält Startup, Eingangszeitpunkt, optional Name/E-Mail, Zugang Desktop/VR und Referenz-ID. Alle Meeting-Einstiege speichern dort, ohne Auswahl von Tag oder Uhrzeit. Kontaktdaten sind im Browser und in VR freiwillig. In VR öffnet die Auswahl eines Feldes eine Controller-Tastatur mit Groß-/Kleinschreibung, Umlauten, E-Mail-Zeichen, Leerzeichen und Löschtaste. Ohne E-Mail ist keine direkte Rückmeldung möglich. Es werden keine Einladungen versendet. Alte Einträge mit Terminwunsch bleiben unverändert und werden bei Bedarf mit einer zusätzlichen Tabellenspalte angezeigt. Eine unverändert wiederholte Übertragung wird nur einmal gespeichert.

Im VR-Investmentformular lässt sich die Schrittweite zwischen 10 €, 100 €, 500 €, 1.000 € und 10.000 € wählen. Plus/Minus verändert den Betrag innerhalb der Demo-Grenzen von 111 € bis 111.111 €; „Ohne Betrag“ bleibt verfügbar.

Das Veranstaltungsteam liest beide Tabellen ausschließlich nach serverseitiger Anmeldung. Die Sitzung läuft nach acht Stunden ab; Abmelden macht sie sofort ungültig. Anmeldeversuche und Übertragungen sind begrenzt. Technische Sitzungs- und Begrenzungseinträge enthalten keine Klartext-IP-Adressen. Der Browser erhält keine Daten, wenn die Anmeldung fehlt.

Ohne Backend oder bei einem Fehler zeigt das Formular eine Fehlermeldung. Es behauptet dann nicht, dass gespeichert wurde. Die Beispiel-Investitionsbeträge bleiben Demo-Inhalte; es erfolgt keine Investition und keine Übermittlung an ONINO oder Pitchload.

## Lokal ausprobieren

Mit Node.js ab 22.13: `npm start`, dann `http://localhost:4173` öffnen. Dieser lokale Server speichert ausschließlich auf diesem Computer unter `.local-data/`; die Daten werden nicht zu Netlify übertragen. Den lokalen Server nur einmal pro Ordner starten. Nur `public/` wird ausgeliefert – Serverdateien und lokale Daten sind nicht öffentlich erreichbar. Die Veröffentlichung auf Netlify verwendet automatisch Netlify Blobs statt dieser lokalen Datei.

## Quellen

[Netlify Functions](https://docs.netlify.com/build/functions/get-started/) · [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)

Das Paket ist für Netlify vorbereitet und lokal getestet. Es wurde noch nicht in deinem Netlify-Konto veröffentlicht. Der physische Quest-3-Test steht ebenfalls noch aus.
