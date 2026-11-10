import { useEffect, useMemo, useRef, useState } from "react";

// ─── Grunddaten ──────────────────────────────────────────────────────────────
const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const WD_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const DEFAULT_SETTINGS = { name: "", scale: 1.15, pin: "1234", pinChanged: false };

const DEFAULT_PLAN = [
  { id: "p1", time: "07:30", title: "Aufstehen und Waschen", emoji: "🛁", days: ALL_DAYS },
  { id: "p2", time: "08:30", title: "Frühstück", emoji: "🥐", days: ALL_DAYS },
  { id: "p3", time: "10:00", title: "Gymnastik im Gemeinschaftsraum", emoji: "🤸", days: [1, 3, 5] },
  { id: "p4", time: "10:00", title: "Gottesdienst in der Kapelle", emoji: "⛪", days: [0] },
  { id: "p5", time: "12:00", title: "Mittagessen", emoji: "🍲", days: ALL_DAYS },
  { id: "p6", time: "13:00", title: "Mittagsruhe", emoji: "😴", days: ALL_DAYS },
  { id: "p7", time: "15:00", title: "Kaffee und Kuchen", emoji: "☕", days: ALL_DAYS },
  { id: "p8", time: "16:00", title: "Singkreis", emoji: "🎵", days: [2, 4] },
  { id: "p9", time: "18:00", title: "Abendessen", emoji: "🍞", days: ALL_DAYS },
];

const DEFAULT_CONTACTS = [];

const MOODS = [
  { value: 3, emoji: "😊", label: "Gut", color: "var(--good)" },
  { value: 2, emoji: "😐", label: "Es geht", color: "var(--mid)" },
  { value: 1, emoji: "😟", label: "Nicht gut", color: "var(--bad)" },
];

const IDLE_MS = 120_000; // nach 2 Min ohne Bedienung zurück auf "Heute"

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher voll oder gesperrt – App läuft trotzdem weiter */
  }
}
function usePersistent(key, fallback) {
  const [value, setValue] = useState(() => load(key, fallback));
  useEffect(() => save(key, value), [key, value]);
  return [value, setValue];
}

const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n) => String(n).padStart(2, "0");
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function partOfDay(h) {
  if (h < 5) return { label: "Nacht", greet: "Gute Nacht", icon: "🌙" };
  if (h < 11) return { label: "Morgen", greet: "Guten Morgen", icon: "🌅" };
  if (h < 14) return { label: "Mittag", greet: "Guten Tag", icon: "☀️" };
  if (h < 18) return { label: "Nachmittag", greet: "Guten Tag", icon: "🌤️" };
  if (h < 22) return { label: "Abend", greet: "Guten Abend", icon: "🌇" };
  return { label: "Nacht", greet: "Gute Nacht", icon: "🌙" };
}
function season(month) {
  if (month <= 1 || month === 11) return { label: "Winter", icon: "❄️" };
  if (month <= 4) return { label: "Frühling", icon: "🌷" };
  if (month <= 7) return { label: "Sommer", icon: "🌻" };
  return { label: "Herbst", icon: "🍂" };
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function todaysPlan(plan, now) {
  const wd = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const items = plan
    .filter((p) => p.days.includes(wd))
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  // "Jetzt" = letzter Termin, der begonnen hat (max. 90 Min her); "Als Nächstes" = erster künftiger
  let currentId = null;
  let nextId = null;
  for (const p of items) {
    const m = toMinutes(p.time);
    if (m <= nowMin && nowMin - m <= 90) currentId = p.id;
    if (m > nowMin && !nextId) nextId = p.id;
  }
  return { items, currentId, nextId, nowMin };
}

// Bildschirm wach halten (Wand-/Tisch-Tablet). Funktioniert nur in unterstützten Browsern + HTTPS.
function useWakeLock() {
  useEffect(() => {
    let lock = null;
    const request = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* nicht verfügbar – ignorieren */
      }
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      lock?.release?.().catch(() => {});
    };
  }, []);
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [settings, setSettings] = usePersistent("ph.settings", DEFAULT_SETTINGS);
  const [plan, setPlan] = usePersistent("ph.plan", DEFAULT_PLAN);
  const [contacts, setContacts] = usePersistent("ph.contacts", DEFAULT_CONTACTS);
  const [moods, setMoods] = usePersistent("ph.moods", []);
  const [tab, setTab] = useState("heute");
  const [admin, setAdmin] = useState(false);
  const [pinPrompt, setPinPrompt] = useState(false);
  const now = useNow();
  useWakeLock();

  // Inaktivität → zurück zur Startseite, Betreuungsmodus schließen
  const idleTimer = useRef(null);
  useEffect(() => {
    const reset = () => {
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        setTab("heute");
        setAdmin(false);
        setPinPrompt(false);
      }, IDLE_MS);
    };
    reset();
    const evs = ["pointerdown", "keydown"];
    evs.forEach((e) => window.addEventListener(e, reset));
    return () => {
      clearTimeout(idleTimer.current);
      evs.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--scale", String(settings.scale));
  }, [settings.scale]);

  const today = useMemo(() => todaysPlan(plan, now), [plan, now]);

  if (admin) {
    return (
      <Admin
        settings={settings}
        setSettings={setSettings}
        plan={plan}
        setPlan={setPlan}
        contacts={contacts}
        setContacts={setContacts}
        moods={moods}
        setMoods={setMoods}
        onClose={() => setAdmin(false)}
      />
    );
  }

  const tabs = [
    { id: "heute", label: "Heute", icon: "🏠" },
    { id: "plan", label: "Tagesplan", icon: "📋" },
    { id: "familie", label: "Familie", icon: "👪" },
    { id: "befinden", label: "Wie geht's?", icon: "💬" },
  ];

  return (
    <div className="app">
      <main className="screen">
        {tab === "heute" && <Today now={now} today={today} name={settings.name} onPlan={() => setTab("plan")} />}
        {tab === "plan" && <Plan now={now} today={today} />}
        {tab === "familie" && <Family contacts={contacts} />}
        {tab === "befinden" && (
          <Mood
            onPick={(value) => setMoods((m) => [...m, { ts: Date.now(), value }].slice(-500))}
          />
        )}
      </main>

      <nav className="tabbar" aria-label="Hauptmenü">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            <span className="tab-icon" aria-hidden>{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <button className="staff-btn" onClick={() => setPinPrompt(true)} aria-label="Betreuung">
        ⚙︎ Betreuung
      </button>

      {pinPrompt && (
        <PinPrompt
          pin={settings.pin}
          onCancel={() => setPinPrompt(false)}
          onOk={() => {
            setPinPrompt(false);
            setAdmin(true);
          }}
        />
      )}
    </div>
  );
}

// ─── Heute (Orientierung) ────────────────────────────────────────────────────
function Today({ now, today, name, onPlan }) {
  const pod = partOfDay(now.getHours());
  const sea = season(now.getMonth());
  const current = today.items.find((p) => p.id === today.currentId);
  const next = today.items.find((p) => p.id === today.nextId);

  return (
    <section className="today">
      <p className="greet">
        {pod.greet}
        {name ? `, ${name}` : ""}!
      </p>
      <h1 className="weekday">Heute ist {WEEKDAYS[now.getDay()]}</h1>
      <p className="date">
        {now.getDate()}. {MONTHS[now.getMonth()]} {now.getFullYear()}
      </p>
      <p className="clock" aria-label={`Es ist ${now.getHours()} Uhr ${now.getMinutes()}`}>
        {pad(now.getHours())}:{pad(now.getMinutes())} <span className="uhr">Uhr</span>
      </p>

      <div className="chips">
        <span className="chip">{pod.icon} Es ist {pod.label}</span>
        <span className="chip">{sea.icon} Wir haben {sea.label}</span>
      </div>

      <div className="next-cards">
        {current && (
          <button className="card card-now" onClick={onPlan}>
            <span className="card-kicker">Jetzt</span>
            <span className="card-main">
              <span className="card-emoji" aria-hidden>{current.emoji}</span>
              {current.title}
            </span>
          </button>
        )}
        {next ? (
          <button className="card" onClick={onPlan}>
            <span className="card-kicker">Als Nächstes um {next.time} Uhr</span>
            <span className="card-main">
              <span className="card-emoji" aria-hidden>{next.emoji}</span>
              {next.title}
            </span>
          </button>
        ) : (
          <div className="card card-muted">
            <span className="card-main">Für heute steht nichts mehr an.</span>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Tagesplan ───────────────────────────────────────────────────────────────
function Plan({ now, today }) {
  return (
    <section>
      <h1 className="h1">Ihr Tag am {WEEKDAYS[now.getDay()]}</h1>
      {today.items.length === 0 && <p className="lead">Für heute ist nichts eingetragen.</p>}
      <ol className="plan">
        {today.items.map((p) => {
          const past = toMinutes(p.time) < today.nowMin && p.id !== today.currentId;
          const cls = p.id === today.currentId ? "now" : p.id === today.nextId ? "next" : past ? "past" : "";
          return (
            <li key={p.id} className={`plan-item ${cls}`}>
              <span className="plan-time">{p.time}</span>
              <span className="plan-emoji" aria-hidden>{p.emoji}</span>
              <span className="plan-title">{p.title}</span>
              {cls === "now" && <span className="badge">Jetzt</span>}
              {cls === "next" && <span className="badge badge-next">Als Nächstes</span>}
              {cls === "past" && <span className="plan-done" aria-label="vorbei">✓</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ─── Familie ─────────────────────────────────────────────────────────────────
function Family({ contacts }) {
  return (
    <section>
      <h1 className="h1">Ihre Familie und Freunde</h1>
      {contacts.length === 0 && (
        <p className="lead">Hier sind noch keine Personen eingetragen. Bitte fragen Sie das Personal.</p>
      )}
      <div className="contacts">
        {contacts.map((c) => (
          <article key={c.id} className="contact">
            <div className="avatar" aria-hidden>
              {c.photo ? <img src={c.photo} alt="" /> : c.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="contact-body">
              <h2 className="contact-name">{c.name}</h2>
              {c.relation && <p className="contact-rel">{c.relation}</p>}
              <div className="contact-actions">
                {c.phone && (
                  <a className="btn btn-big btn-call" href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}>
                    📞 Anrufen
                  </a>
                )}
                {c.video && (
                  <a className="btn btn-big btn-video" href={c.video} target="_blank" rel="noreferrer">
                    🎥 Videoanruf
                  </a>
                )}
                {!c.phone && !c.video && <p className="hint">Bitte Personal fragen</p>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── Befinden ────────────────────────────────────────────────────────────────
function Mood({ onPick }) {
  const [picked, setPicked] = useState(null);

  if (picked) {
    return (
      <section className="mood-done">
        <div className="mood-big" aria-hidden>{picked.emoji}</div>
        <h1 className="h1">Danke!</h1>
        {picked.value === 1 ? (
          <div className="alert" role="alert">
            <p>Das tut uns leid.</p>
            <p>
              <strong>Bitte drücken Sie Ihre Klingel</strong> oder sprechen Sie eine Pflegekraft an.
            </p>
            <p className="small">Dieses Gerät ruft niemanden automatisch.</p>
          </div>
        ) : (
          <p className="lead">Schön, dass Sie es uns sagen.</p>
        )}
        <button className="btn btn-big" onClick={() => setPicked(null)}>Zurück</button>
      </section>
    );
  }

  return (
    <section>
      <h1 className="h1">Wie geht es Ihnen heute?</h1>
      <div className="moods">
        {MOODS.map((m) => (
          <button
            key={m.value}
            className="mood"
            style={{ "--c": m.color }}
            onClick={() => {
              onPick(m.value);
              setPicked(m);
            }}
          >
            <span className="mood-emoji" aria-hidden>{m.emoji}</span>
            <span className="mood-label">{m.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── PIN ─────────────────────────────────────────────────────────────────────
function PinPrompt({ pin, onOk, onCancel }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const press = (d) => {
    const v = (val + d).slice(0, 8);
    setVal(v);
    setErr(false);
    if (v.length === pin.length) {
      if (v === pin) onOk();
      else {
        setErr(true);
        setVal("");
      }
    }
  };
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="PIN für Betreuung">
      <div className="modal-box">
        <h2>Bereich für Personal</h2>
        <p className="pin-dots" aria-live="polite">
          {err ? "Falsche PIN" : "●".repeat(val.length) || "PIN eingeben"}
        </p>
        <div className="keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} onClick={() => press(d)}>{d}</button>
          ))}
          <button onClick={onCancel} className="kp-cancel">Abbruch</button>
          <button onClick={() => press("0")}>0</button>
          <button onClick={() => setVal(val.slice(0, -1))} aria-label="Löschen">⌫</button>
        </div>
      </div>
    </div>
  );
}

// ─── Betreuungsmodus ─────────────────────────────────────────────────────────
function Admin({ settings, setSettings, plan, setPlan, contacts, setContacts, moods, setMoods, onClose }) {
  const [section, setSection] = useState("plan");
  const sections = [
    ["plan", "Tagesplan"],
    ["kontakte", "Kontakte"],
    ["befinden", "Befinden"],
    ["einstellungen", "Einstellungen"],
  ];
  return (
    <div className="admin">
      <header className="admin-head">
        <h1>Betreuung</h1>
        <button className="btn" onClick={onClose}>Fertig</button>
      </header>
      {!settings.pinChanged && (
        <p className="warn">Die Standard-PIN 1234 ist aktiv. Bitte unter „Einstellungen“ ändern.</p>
      )}
      <nav className="admin-tabs">
        {sections.map(([id, label]) => (
          <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}>
            {label}
          </button>
        ))}
      </nav>
      {section === "plan" && <PlanEditor plan={plan} setPlan={setPlan} />}
      {section === "kontakte" && <ContactEditor contacts={contacts} setContacts={setContacts} />}
      {section === "befinden" && <MoodLog moods={moods} setMoods={setMoods} />}
      {section === "einstellungen" && (
        <SettingsEditor
          settings={settings}
          setSettings={setSettings}
          onResetAll={() => {
            setPlan(DEFAULT_PLAN);
            setContacts([]);
            setMoods([]);
            setSettings(DEFAULT_SETTINGS);
          }}
          exportData={() => ({ settings: { ...settings, pin: undefined }, plan, contacts, moods })}
        />
      )}
    </div>
  );
}

function PlanEditor({ plan, setPlan }) {
  const empty = { time: "10:00", title: "", emoji: "📌", days: ALL_DAYS };
  const [draft, setDraft] = useState(empty);
  const sorted = [...plan].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  const toggleDay = (d) =>
    setDraft((x) => ({ ...x, days: x.days.includes(d) ? x.days.filter((y) => y !== d) : [...x.days, d] }));

  return (
    <div className="admin-body">
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.title.trim() || draft.days.length === 0) return;
          setPlan([...plan, { ...draft, title: draft.title.trim(), id: uid() }]);
          setDraft(empty);
        }}
      >
        <h2>Termin hinzufügen</h2>
        <div className="row">
          <label>Uhrzeit<input type="time" value={draft.time} required onChange={(e) => setDraft({ ...draft, time: e.target.value })} /></label>
          <label className="narrow">Symbol<input value={draft.emoji} maxLength={4} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} /></label>
        </div>
        <label>Bezeichnung<input value={draft.title} required placeholder="z. B. Besuch von Tochter Anna" onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
        <fieldset className="days">
          <legend>Wochentage</legend>
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <button type="button" key={d} className={draft.days.includes(d) ? "on" : ""} onClick={() => toggleDay(d)}>
              {WD_SHORT[d]}
            </button>
          ))}
        </fieldset>
        <button className="btn btn-primary" type="submit">Hinzufügen</button>
      </form>

      <ul className="list">
        {sorted.map((p) => (
          <li key={p.id}>
            <span><strong>{p.time}</strong> {p.emoji} {p.title}</span>
            <span className="muted">
              {p.days.length === 7 ? "täglich" : [1, 2, 3, 4, 5, 6, 0].filter((d) => p.days.includes(d)).map((d) => WD_SHORT[d]).join(", ")}
            </span>
            <button className="btn btn-danger" onClick={() => setPlan(plan.filter((x) => x.id !== p.id))}>Löschen</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactEditor({ contacts, setContacts }) {
  const empty = { name: "", relation: "", phone: "", video: "", photo: "" };
  const [draft, setDraft] = useState(empty);

  const onPhoto = (file) => {
    if (!file) return;
    // Foto verkleinern, damit localStorage (~5 MB) nicht überläuft
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 240;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const s = Math.min(img.width, img.height);
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      setDraft((d) => ({ ...d, photo: c.toDataURL("image/jpeg", 0.8) }));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="admin-body">
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.name.trim()) return;
          if (draft.video && !/^https:\/\//i.test(draft.video)) {
            alert("Der Video-Link muss mit https:// beginnen.");
            return;
          }
          setContacts([...contacts, { ...draft, name: draft.name.trim(), id: uid() }]);
          setDraft(empty);
        }}
      >
        <h2>Person hinzufügen</h2>
        <label>Name<input value={draft.name} required placeholder="z. B. Anna" onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
        <label>Beziehung<input value={draft.relation} placeholder="z. B. Tochter" onChange={(e) => setDraft({ ...draft, relation: e.target.value })} /></label>
        <label>Telefon<input type="tel" value={draft.phone} placeholder="+49 …" onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
        <label>Video-Link (optional)<input type="url" value={draft.video} placeholder="https://…" onChange={(e) => setDraft({ ...draft, video: e.target.value })} /></label>
        <label>Foto (optional)<input type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} /></label>
        {draft.photo && <img className="preview" src={draft.photo} alt="Vorschau" />}
        <p className="muted small">Nur mit Einwilligung der abgebildeten Person speichern.</p>
        <button className="btn btn-primary" type="submit">Hinzufügen</button>
      </form>
      <ul className="list">
        {contacts.map((c) => (
          <li key={c.id}>
            <span><strong>{c.name}</strong> {c.relation && `(${c.relation})`}</span>
            <span className="muted">{[c.phone, c.video && "Video"].filter(Boolean).join(" · ")}</span>
            <button className="btn btn-danger" onClick={() => setContacts(contacts.filter((x) => x.id !== c.id))}>Löschen</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MoodLog({ moods, setMoods }) {
  const days = useMemo(() => {
    const out = [];
    const d = new Date();
    for (let i = 0; i < 14; i++) {
      const k = dateKey(d);
      const entries = moods.filter((m) => dateKey(new Date(m.ts)) === k);
      out.push({ d: new Date(d), entries });
      d.setDate(d.getDate() - 1);
    }
    return out;
  }, [moods]);

  return (
    <div className="admin-body">
      <p className="muted">
        Selbstauskunft der letzten 14 Tage. Ersetzt keine Pflegedokumentation und keine Beobachtung durch Fachpersonal.
      </p>
      <ul className="list">
        {days.map(({ d, entries }) => (
          <li key={dateKey(d)}>
            <span><strong>{WD_SHORT[d.getDay()]} {d.getDate()}.{d.getMonth() + 1}.</strong></span>
            <span>
              {entries.length === 0
                ? <span className="muted">–</span>
                : entries.map((e) => (
                    <span key={e.ts} title={new Date(e.ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}>
                      {MOODS.find((m) => m.value === e.value)?.emoji}{" "}
                      <span className="muted small">{new Date(e.ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span>{"  "}
                    </span>
                  ))}
            </span>
          </li>
        ))}
      </ul>
      <button className="btn btn-danger" onClick={() => confirm("Gesamten Verlauf löschen?") && setMoods([])}>
        Verlauf löschen
      </button>
    </div>
  );
}

function SettingsEditor({ settings, setSettings, onResetAll, exportData }) {
  const [newPin, setNewPin] = useState("");
  const scales = [
    [1, "Normal"],
    [1.15, "Groß"],
    [1.35, "Sehr groß"],
  ];
  return (
    <div className="admin-body">
      <div className="form">
        <label>
          Anrede auf der Startseite (z. B. „Frau Müller“)
          <input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
        </label>
        <fieldset className="days">
          <legend>Schriftgröße</legend>
          {scales.map(([v, l]) => (
            <button type="button" key={v} className={settings.scale === v ? "on" : ""} onClick={() => setSettings({ ...settings, scale: v })}>
              {l}
            </button>
          ))}
        </fieldset>
      </div>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^\d{4,8}$/.test(newPin)) return alert("PIN: 4–8 Ziffern.");
          setSettings({ ...settings, pin: newPin, pinChanged: true });
          setNewPin("");
          alert("PIN geändert.");
        }}
      >
        <label>Neue PIN (4–8 Ziffern)<input inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} /></label>
        <button className="btn btn-primary" type="submit">PIN speichern</button>
      </form>

      <div className="form">
        <h2>Daten</h2>
        <p className="muted small">
          Alle Daten liegen nur auf diesem Gerät (Browser-Speicher). Es gibt keinen Server und keine Übertragung.
          Browserdaten löschen = App-Daten weg.
        </p>
        <button
          className="btn"
          onClick={() => {
            const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `mein-tag-export-${dateKey(new Date())}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          Daten exportieren
        </button>
        <button
          className="btn btn-danger"
          onClick={() => confirm("Wirklich ALLE Daten auf diesem Gerät löschen? (z. B. bei Bewohnerwechsel)") && onResetAll()}
        >
          Alles zurücksetzen
        </button>
      </div>
    </div>
  );
}
