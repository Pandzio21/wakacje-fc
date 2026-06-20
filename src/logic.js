// ════════════════════════════════════════════════════════════════════════════
//  WAKACJE FC — logika (zawodnicy, wartości, sezony, nagrody, mecze)
// ════════════════════════════════════════════════════════════════════════════

// ─── ZAWODNICY ────────────────────────────────────────────────────────────────
export const PLAYERS = [
  { id:"tazzy",   name:"Tazzy",   position:"ŚO",    value:1_000_000 },
  { id:"pandzio", name:"Pandzio", position:"BR",    value:3_000_000 },
  { id:"adam",    name:"Adam",    position:"ŚO/PŚ", value:10_000_000 },
  { id:"natan",   name:"Natan",   position:"ŚO",    value:40_000_000 },
  { id:"smietan", name:"Śmietan", position:"PS/LS", value:120_000_000 },
  { id:"maniak",  name:"Maniak",  position:"N/PS",  value:90_000_000 },
  { id:"bartek",  name:"Bartek",  position:"N/BR",  value:180_000_000 },
  { id:"hux",     name:"Hux",     position:"ŚP/BR", value:120_000_000 },
  { id:"tymko",   name:"Tymko",   position:"BR/ŚO", value:800_000 },
  { id:"kalinek", name:"Kalinek", position:"PS/LS", value:18_000_000 },
  { id:"piotrulla", name:"Piotrulla", position:"ŚO", value:4_000_000 },
];

// Zawodnicy spoza klasy — oceniani w meczach, ale POZA rankingiem i statystykami sezonu
export const RANDOM_PLAYERS = [
  { id:"rnd1", name:"Random 1", position:"Spoza", value:1_000_000, random:true },
  { id:"rnd2", name:"Random 2", position:"Spoza", value:1_000_000, random:true },
  { id:"rnd3", name:"Random 3", position:"Spoza", value:1_000_000, random:true },
  { id:"rnd4", name:"Random 4", position:"Spoza", value:1_000_000, random:true },
];

export const ALL_PLAYERS = [...PLAYERS, ...RANDOM_PLAYERS];
export const isRandomId = (id) => RANDOM_PLAYERS.some(r => r.id === id);

export const BASE_RATING = 6.7;

export const DEFAULT_CRITERIA = [
  { id:"goal",             label:"⚽ Gol",               desc:"Trafił do siatki",                      points:0.40,  cat:"pos" },
  { id:"assist",           label:"🎯 Asysta",             desc:"Podał bezpośrednio na gola",            points:0.30,  cat:"pos" },
  { id:"nutmeg",           label:"🍑 Siatkówka",          desc:"Przepuścił piłkę między nogami",        points:0.30,  cat:"pos" },
  { id:"skill",            label:"🪄 Sztuczka",           desc:"Efektowny drybling",                    points:0.25,  cat:"pos" },
  { id:"screamer",         label:"🚀 Benger",             desc:"Gol z ponad 20m",                       points:0.50,  cat:"pos" },
  { id:"tackle",           label:"🦵 Wślizg",             desc:"Czysty spektakularny wślizg",           points:0.25,  cat:"pos" },
  { id:"dribble_line",     label:"🕺 Minął linię",        desc:"Ominął 3+ zawodników z rzędu",          points:0.40,  cat:"pos" },
  { id:"freekick",         label:"🌀 Gol ze stałego",     desc:"Gol z rzutu wolnego / rogu",            points:0.45,  cat:"pos" },
  { id:"clutch",           label:"🔥 Clutch",             desc:"Decydujące zagranie przy końcówce",     points:0.50,  cat:"pos" },
  { id:"rainbow",          label:"🌈 Rainbow flick",      desc:"Rainbow flick skutecznie w grze",       points:0.35,  cat:"pos" },
  { id:"key_pass",         label:"🔑 Kluczowe podanie",   desc:"Stworzyło stuprocentową sytuację",      points:0.20,  cat:"pos" },
  { id:"header",           label:"🦁 Gol głową",          desc:"Trafił do siatki głową",                points:0.35,  cat:"pos" },
  { id:"save",             label:"🧤 Obrona gola",        desc:"Obronił strzał idący w okienko",        points:0.40,  cat:"gk_pos" },
  { id:"save_penalty",     label:"🫵 Obrona karnego",     desc:"Obronił penalty",                       points:0.80,  cat:"gk_pos" },
  { id:"save_rebound",     label:"🏃 Obrona dobitki",     desc:"Wrócił i obronił dobitkę",              points:0.35,  cat:"gk_pos" },
  { id:"gk_assist",        label:"🎁 Podanie na gola",    desc:"Uruchomił akcję kończącą się golem",    points:0.30,  cat:"gk_pos" },
  { id:"gk_rush",          label:"⛔ Wyjście 1 na 1",     desc:"Wybiegł i zatrzymał sam na sam",        points:0.45,  cat:"gk_pos" },
  { id:"gk_sweeper",       label:"🧹 Obrona nóżkami",     desc:"Wyczyścił sytuację nóżkami",            points:0.30,  cat:"gk_pos" },
  { id:"miss",             label:"🤦 Pudło",              desc:"Spudłował z metra / sam na bramkę",     points:-0.30, cat:"neg" },
  { id:"own_goal",         label:"😬 Samobój",            desc:"Wpakował do własnej siatki",            points:-0.40, cat:"neg" },
  { id:"lost_ball_danger", label:"💀 Niebezp. strata",    desc:"Stracił piłkę w groźnym miejscu",       points:-0.25, cat:"neg" },
  { id:"lost_ball_cheap",  label:"🎁 Głupia strata",      desc:"Łatwa strata w środku pola",            points:-0.15, cat:"neg" },
  { id:"foul_danger",      label:"🟥 Faul w polu",        desc:"Sfaulował w polu karnym",               points:-0.30, cat:"neg" },
  { id:"lazy_track",       label:"🛋️ Nie wrócił",         desc:"Nie cofnął się do obrony",              points:-0.20, cat:"neg" },
  { id:"bad_pass",         label:"🙈 Podanie do rywala",  desc:"Zagrał wprost do nogi przeciwnika",     points:-0.20, cat:"neg" },
  { id:"penalty_miss",     label:"😱 Pudło z karnego",    desc:"Spudłował rzut karny",                  points:-0.50, cat:"neg" },
  { id:"gk_blunder",       label:"🫣 Klops bramkarza",    desc:"Wpuścił łatwego gola z winy błędu",     points:-0.50, cat:"gk_neg" },
  { id:"gk_wrong_pos",     label:"📍 Zła pozycja",        desc:"Stał w złym miejscu – kosztowało gola",  points:-0.30, cat:"gk_neg" },
  { id:"gk_lost_ball",     label:"🤲 Wybił pod nogi",     desc:"Wybił piłkę prosto pod nogi rywala",     points:-0.25, cat:"gk_neg" },
];

export const DEFAULT_PLAYERS = (() => {
  const today = new Date().toISOString().slice(0, 10);
  const hB = { id:1, date:today, score:"8:5", opponent:"Team Śmietanki", result:"Wygrana",   note:"", criteria:{}, goals:[], teamA:[], teamB:[] };
  const sB = { id:2, date:today, score:"5:8", opponent:"Team Huxa",       result:"Przegrana", note:"", criteria:{}, goals:[], teamA:[], teamB:[] };
  const pre = { hux:{...hB,rating:10.00}, adam:{...hB,rating:6.35}, pandzio:{...hB,rating:7.70}, tazzy:{...hB,rating:6.00},
                smietan:{...sB,rating:9.85}, maniak:{...sB,rating:7.80}, natan:{...sB,rating:7.50} };
  return PLAYERS.map(p => ({ ...p, matches: pre[p.id] ? [pre[p.id]] : [], opinions: [] }));
})();

export const GOAL_TYPES = [
  { id:"normal",   label:"⚽ Normalny" },
  { id:"screamer", label:"🚀 Benger" },
  { id:"header",   label:"🦁 Głową" },
  { id:"freekick", label:"🌀 Wolny" },
  { id:"penalty",  label:"🫵 Karny" },
  { id:"noAssist", label:"🔵 Bez asysty" },
  { id:"ownGoal",  label:"😬 Samobój" },
];
export const GICO = { screamer:"🚀", header:"🦁", freekick:"🌀", penalty:"🫵", normal:"⚽", noAssist:"⚽", ownGoal:"😬" };
export const RESULT_COLOR = { Wygrana:"#22c55e", Remis:"#f59e0b", Przegrana:"#ef4444" };
export const RESULT_ICON  = { Wygrana:"W", Remis:"R", Przegrana:"P" };
export const CAT_LABELS = { pos:"⚽ Pozytywne – pole", gk_pos:"🧤 Pozytywne – bramkarz", neg:"🔴 Negatywne – pole", gk_neg:"🔴 Negatywne – bramkarz" };

// ─── MECZ: POŁOWY / FAZY ──────────────────────────────────────────────────────
export const HALF_MIN = 15;                       // połowa trwa 15 minut
export const PHASE_ORDER = ["1H", "2H", "ET"];     // faza gry (karne liczone osobno)
export const PHASE_LABELS = { "1H":"1. połowa", "2H":"2. połowa", "ET":"Dogrywka" };

export function goalPhase(g) {
  if (g.phase && PHASE_ORDER.includes(g.phase)) return g.phase;
  const min = parseInt(g.minute) || 0;
  return min > HALF_MIN ? "2H" : "1H";             // fallback dla starych meczów
}
export function goalSortVal(g) {
  return (parseInt(g.minute) || 0) * 100 + (parseInt(g.stoppage) || 0);
}
export function goalLabel(g) {
  const m = g.minute ? String(g.minute) : "";
  const s = g.stoppage ? ("+" + g.stoppage) : "";
  return m ? (m + s + "'") : (goalPhase(g) === "ET" ? "dogr." : "—");
}

// Wlicza wpływ gola na kryteria zawodnika o danym id (gol/asysta/typ/samobój)
export function applyGoalToCriteria(crit, g, id) {
  if (g.scorer === id) {
    if (g.type === "ownGoal") {
      crit.own_goal = (parseInt(crit.own_goal || 0) + 1);
    } else if (g.type === "screamer") {
      crit.screamer = (parseInt(crit.screamer || 0) + 1);
    } else if (g.type === "freekick") {
      crit.freekick = (parseInt(crit.freekick || 0) + 1);
    } else if (g.type === "header") {
      crit.header = (parseInt(crit.header || 0) + 1);
    } else {
      crit.goal = (parseInt(crit.goal || 0) + 1);
    }
  }
  if (g.assist === id) crit.assist = (parseInt(crit.assist || 0) + 1);
  return crit;
}

// ─── HELPERY OGÓLNE ───────────────────────────────────────────────────────────
export const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
export const fv = (v) => {
  const n = Math.abs(v || 0);
  return n >= 1e6 ? `€${(v / 1e6).toFixed(1)}M` : `€${(v / 1e3).toFixed(0)}K`;
};
export const rc = (r) => r >= 8 ? "#22c55e" : r >= 7 ? "#84cc16" : r >= 6.5 ? "#f59e0b" : r >= 5.5 ? "#f97316" : "#ef4444";
export const safeR = (m) => typeof m.rating === "number" ? m.rating : parseFloat(m.rating) || BASE_RATING;
export const medalColor = (i) => i === 0 ? "#fbbf24" : i === 1 ? "#c9a8e0" : i === 2 ? "#b45309" : "#3b1f5c";

export function calcMatchRating(cmap, clist) {
  if (!clist || !cmap) return BASE_RATING;
  let d = 0;
  clist.forEach(c => { const n = parseInt(cmap[c.id] || 0); if (n) d += c.points * n; });
  return clamp(BASE_RATING + d, 1, 10);
}
export function getAvgRating(matches) {
  if (!matches?.length) return null;
  const v = matches.map(safeR);
  return v.reduce((a, b) => a + b, 0) / v.length;
}

// Bonus formy: +30% wartości przy spełnieniu kryteriów ostatnich meczów
export function checkFormBonus(player) {
  const ms = player.matches; const v = player.value;
  if (!ms || ms.length < 2) return false;
  const recentN = (n) => ms.slice(-n);
  const contrib = (m) => {
    const c = m.criteria || {};
    return parseInt(c.goal||0)+parseInt(c.screamer||0)+parseInt(c.freekick||0)+parseInt(c.header||0)+parseInt(c.assist||0);
  };
  if (v <= 10e6)      { const r = recentN(2); return r.length===2 && r.every(m => contrib(m)>=1 || safeR(m)>7.5); }
  else if (v <= 30e6) { const r = recentN(3); return r.length===3 && r.every(m => contrib(m)>=1 || safeR(m)>7.5); }
  else if (v <= 100e6){ const r = recentN(3); return r.length===3 && r.every(m => contrib(m)>=2 || safeR(m)>8.2); }
  else                { const r = recentN(3); return r.length===3 && r.every(m => contrib(m)>=3 || safeR(m)>9.2); }
}

export function getSessionChangePct(cur, rd) {
  const tier = Math.log10(Math.max(cur, 100_000) / 300_000 + 1);
  const base = 0.08 / tier;
  const pct = clamp(base * rd, -0.20, 0.20);
  const abs = cur * pct;
  if (Math.abs(abs) > 20_000_000) return (20_000_000 * Math.sign(abs)) / cur;
  return pct;
}

// Wartość liczona z listy meczów (posortowanej chronologicznie) + opinii
export function calcValueFrom(base, matches, opinions) {
  const ms = [...(matches || [])].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const ops = opinions || [];
  if (!ms.length && !ops.length) return base;
  let cur = base;
  ms.forEach(m => {
    const rd = safeR(m) - BASE_RATING;
    const pct = getSessionChangePct(cur, rd);
    cur = Math.max(cur + Math.round(cur * pct), 100_000);
  });
  if (checkFormBonus({ matches: ms, value: base })) cur = Math.round(cur * 1.30);
  const rec = ms.slice(-3);
  if (rec.length) {
    const ra = rec.reduce((s, m) => s + safeR(m), 0) / rec.length;
    cur = Math.max(Math.round(cur * (1 + clamp((ra - BASE_RATING) * 0.005, -0.02, 0.02))), 100_000);
  }
  let op = 0; ops.forEach(o => { if (o.sentiment === "positive") op += 0.02; if (o.sentiment === "negative") op -= 0.02; });
  return Math.max(Math.round(cur * (1 + clamp(op, -0.10, 0.10))), 100_000);
}
export function calcValue(player) {
  return calcValueFrom(player.value, player.matches || [], player.opinions || []);
}
// Wartość zawodnika na dany dzień (cutoff = YYYY-MM-DD; null = przed projektem → wartość bazowa)
export function valueAtDate(player, cutoffStr) {
  if (!cutoffStr) return player.value;
  const ms = (player.matches || []).filter(m => (m.date || "") <= cutoffStr);
  const ops = (player.opinions || []).filter(o => !o.date || o.date <= cutoffStr);
  return calcValueFrom(player.value, ms, ops);
}

export function getTrend(matches) {
  if (!matches || matches.length < 2) return "—";
  const d = safeR(matches[matches.length - 1]) - safeR(matches[matches.length - 2]);
  return d > 0.1 ? "▲" : d < -0.1 ? "▼" : "→";
}

// ─── DATY / SEZONY ────────────────────────────────────────────────────────────
const DAY = 86_400_000;
// UWAGA: użytkownik napisał „niedziela 27.06.2026", ale 27.06 to SOBOTA.
// Najbliższa niedziela (i koniec tygodnia Pn–Nd) to 28.06.2026 — i to jest koniec sezonu 1.
export const FIRST_SEASON_END = "2026-06-28"; // niedziela – koniec sezonu 1
export const REG_START        = "2026-06-29"; // poniedziałek – start cyklu tygodniowego (sezon 2+)

export function parseD(s) { return Date.parse((s || "").slice(0, 10) + "T00:00:00Z"); }
export function todayStr() { return new Date().toISOString().slice(0, 10); }
export function addDaysStr(s, n) { return new Date(parseD(s) + n * DAY).toISOString().slice(0, 10); }
export function fmtPL(s) {
  const t = parseD(s);
  if (isNaN(t)) return s || "—";
  const d = new Date(t);
  const p = (x) => String(x).padStart(2, "0");
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

export function seasonIndexOf(dateStr) {
  const t = parseD(dateStr);
  if (isNaN(t)) return 1;
  if (t <= parseD(FIRST_SEASON_END)) return 1;
  return 2 + Math.floor((t - parseD(REG_START)) / (7 * DAY));
}
export function seasonRange(idx) {
  if (idx <= 1) return { index: 1, start: null, end: FIRST_SEASON_END };
  const start = addDaysStr(REG_START, (idx - 2) * 7);
  return { index: idx, start, end: addDaysStr(start, 6) };
}

// ─── ZBIERANIE MECZÓW (deduplikacja per-zawodnik → jeden obiekt meczu) ─────────
export function matchKeyOf(m) {
  return `${m.date}|${m.score}|${m.teamAName || ""}|${m.teamBName || ""}`;
}
export function getMatches(players) {
  const map = new Map();
  players.forEach(p => (p.matches || []).forEach(m => {
    const key = matchKeyOf(m);
    if (!map.has(key)) {
      map.set(key, {
        key, date: m.date, score: m.score,
        teamAName: m.teamAName, teamBName: m.teamBName,
        teamA: m.teamA || [], teamB: m.teamB || [],
        sample: m, goalMap: new Map(), participants: [], ratings: [],
        shots: m.shots || null, penalties: m.penalties || null, extraTime: !!m.extraTime,
      });
    }
    const e = map.get(key);
    const side = (m.teamA || []).includes(p.id) ? "A" : ((m.teamB || []).includes(p.id) ? "B" : null);
    e.participants.push({ id: p.id, name: p.name, random: !!p.random, rating: safeR(m), criteria: m.criteria || {}, side, match: m });
    e.ratings.push(safeR(m));
    if (m.shots && !e.shots) e.shots = m.shots;
    if (m.penalties && !e.penalties) e.penalties = m.penalties;
    if (m.extraTime) e.extraTime = true;
    if (!e.teamA.length && (m.teamA || []).length) e.teamA = m.teamA;
    if (!e.teamB.length && (m.teamB || []).length) e.teamB = m.teamB;
    (m.goals || []).forEach(g => {
      const gk = (g.id != null) ? g.id : `${g.scorer}|${g.minute}|${g.teamSide}|${g.type}`;
      e.goalMap.set(gk, g);
    });
  }));
  return [...map.values()].map(e => ({ ...e, goals: [...e.goalMap.values()] }));
}
// metryka „meczu sezonu": suma ocen wszystkich grających + liczba goli
export function matchQuality(entry) {
  return entry.ratings.reduce((a, b) => a + b, 0) + (entry.goals ? entry.goals.length : 0);
}

// ─── BUDOWA LISTY SEZONÓW ─────────────────────────────────────────────────────
export function buildSeasons(players) {
  const today = todayStr();
  let maxIdx = seasonIndexOf(today);
  players.forEach(p => (p.matches || []).forEach(m => {
    const i = seasonIndexOf(m.date);
    if (i > maxIdx) maxIdx = i;
  }));
  const all = getMatches(players);
  const seasons = [];
  for (let i = 1; i <= maxIdx; i++) {
    const r = seasonRange(i);
    const inSeason = all.filter(e => seasonIndexOf(e.date) === i);
    const completed = parseD(r.end) < parseD(today); // zakończony, gdy dzisiaj jest PO niedzieli
    seasons.push({ ...r, matches: inSeason, completed });
  }
  return seasons; // rosnąco (1 → najnowszy)
}

// ─── STATYSTYKI ZAWODNIKA W SEZONIE ───────────────────────────────────────────
export function seasonStatsForPlayer(p, idx) {
  const ms = (p.matches || []).filter(m => seasonIndexOf(m.date) === idx);
  const sumC = (...ids) => ms.reduce((t, m) => t + ids.reduce((s, id) => s + parseInt((m.criteria || {})[id] || 0), 0), 0);
  const avg = ms.length ? ms.reduce((a, m) => a + safeR(m), 0) / ms.length : null;
  return {
    ms, n: ms.length,
    goals:   sumC("goal", "header", "freekick", "screamer"),
    assists: sumC("assist"),
    bangers: sumC("screamer"),
    avg,
  };
}

// ─── NAGRODY SEZONU ───────────────────────────────────────────────────────────
export function computeSeasonAwards(season, players) {
  const real = players.filter(p => !p.random);
  const idx = season.index;
  const stat = {}; real.forEach(p => { stat[p.id] = seasonStatsForPlayer(p, idx); });

  const startCut = season.start ? addDaysStr(season.start, -1) : null;
  const endCut = season.end;
  const growthOf = (p) => valueAtDate(p, endCut) - valueAtDate(p, startCut);
  const valEndOf = (p) => valueAtDate(p, endCut);

  const ranks = {
    scorers: real.map(p => ({ p, n: stat[p.id].goals })).filter(x => x.n > 0).sort((a, b) => b.n - a.n),
    assists: real.map(p => ({ p, n: stat[p.id].assists })).filter(x => x.n > 0).sort((a, b) => b.n - a.n),
    bangers: real.map(p => ({ p, n: stat[p.id].bangers })).filter(x => x.n > 0).sort((a, b) => b.n - a.n),
    mvp:     real.map(p => ({ p, avg: stat[p.id].avg, n: stat[p.id].n })).filter(x => x.n > 0).sort((a, b) => b.avg - a.avg),
    growth:  real.map(p => ({ p, g: growthOf(p) })).filter(x => stat[x.p.id].n > 0 || x.g !== 0).sort((a, b) => b.g - a.g),
    values:  real.map(p => ({ p, v: valEndOf(p) })).sort((a, b) => b.v - a.v),
  };

  const top = (arr, key) => arr.length ? arr[0][key] : null;
  const winners = (arr, key, max, ok = true) => (max != null && ok) ? arr.filter(x => x[key] === max).map(x => x.p) : [];

  const scorerMax = top(ranks.scorers, "n");
  const assistMax = top(ranks.assists, "n");
  const bangerMax = top(ranks.bangers, "n");
  const mvpMax    = top(ranks.mvp, "avg");
  const growthMax = ranks.growth.length ? ranks.growth[0].g : null;
  const valueMax  = top(ranks.values, "v");

  const scorer   = { winners: winners(ranks.scorers, "n", scorerMax, scorerMax > 0), n: scorerMax };
  const assist   = { winners: winners(ranks.assists, "n", assistMax, assistMax > 0), n: assistMax };
  const banger   = { winners: winners(ranks.bangers, "n", bangerMax, bangerMax > 0), n: bangerMax };
  const mvp      = { winners: winners(ranks.mvp, "avg", mvpMax), avg: mvpMax };
  const growth   = { winners: (growthMax != null && growthMax > 0) ? ranks.growth.filter(x => x.g === growthMax).map(x => x.p) : [], g: growthMax };
  const topValue = { winners: winners(ranks.values, "v", valueMax), v: valueMax };

  // liczba wygranych kategorii (6 kategorii) na zawodnika
  const win = {}; real.forEach(p => win[p.id] = 0);
  [scorer, assist, banger, mvp, growth, topValue].forEach(c => c.winners.forEach(p => { win[p.id]++; }));

  // Piłkarz sezonu — tylko spośród grających; remis → wyższa średnia ocen → wyższa wartość
  const played = real.filter(p => stat[p.id].n > 0);
  let potm = null, potmWins = 0;
  if (played.length) {
    const maxWins = Math.max(...played.map(p => win[p.id]));
    let cands = played.filter(p => win[p.id] === maxWins);
    if (maxWins === 0) cands = played;
    cands = cands.slice().sort((a, b) =>
      (stat[b.id].avg - stat[a.id].avg) ||
      (valEndOf(b) - valEndOf(a)) ||
      a.name.localeCompare(b.name)
    );
    potm = cands[0];
    potmWins = win[potm.id];
  }

  // Mecz sezonu
  let matchOfSeason = null, best = -1;
  season.matches.forEach(e => {
    const q = matchQuality(e);
    if (q > best) { best = q; matchOfSeason = e; }
  });

  return { potm, potmWins, played: played.length, scorer, assist, banger, mvp, growth, topValue, ranks, matchOfSeason, matchQuality: best, stat, win };
}

export function getLastCompletedSeasonAwards(players) {
  const seasons = buildSeasons(players);
  const completed = seasons.filter(s => s.completed);
  if (!completed.length) return null;
  const last = completed[completed.length - 1];
  return { season: last, awards: computeSeasonAwards(last, players) };
}

// ─── NORMALIZACJA STANU (zawsze 10 realnych + 4 random) ───────────────────────
export function normalizePlayers(loaded) {
  const byId = {};
  (loaded || []).forEach(p => { byId[p.id] = p; });
  const build = (canon, isRnd) => canon.map(rp => {
    const ex = byId[rp.id];
    return {
      ...rp,
      random: isRnd,
      matches: (ex && Array.isArray(ex.matches)) ? ex.matches : [],
      opinions: (ex && Array.isArray(ex.opinions)) ? ex.opinions : [],
    };
  });
  return [...build(PLAYERS, false), ...build(RANDOM_PLAYERS, true)];
}

// ─── SERIE DO WYKRESÓW ────────────────────────────────────────────────────────
export const SEASON_COLORS = ["#ff6b35","#00d9c0","#a855f7","#fbbf24","#22c55e","#ef4444","#3b82f6","#ec4899","#f97316","#14b8a6"];
export const seasonColor = (idx) => SEASON_COLORS[(((idx - 1) % SEASON_COLORS.length) + SEASON_COLORS.length) % SEASON_COLORS.length];

// Wartość po każdym meczu (narastająco) — punkty {x,y,date,season}; x=0 to wartość bazowa
export function valueSeries(player) {
  const ms = [...(player.matches || [])].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const ops = player.opinions || [];
  const out = [{
    x: 0, y: player.value,
    date: ms.length ? ms[0].date : todayStr(),
    season: ms.length ? seasonIndexOf(ms[0].date) : seasonIndexOf(todayStr()),
  }];
  ms.forEach((m, idx) => {
    const prefix = ms.slice(0, idx + 1);
    const opsUpTo = ops.filter(o => !o.date || o.date <= m.date);
    out.push({ x: idx + 1, y: calcValueFrom(player.value, prefix, opsUpTo), date: m.date, season: seasonIndexOf(m.date) });
  });
  return out;
}

// Seria wybranej metryki: value | avg | goals | assists | bangers | rating
export function metricSeries(player, metric) {
  if (metric === "value") return valueSeries(player);
  const ms = [...(player.matches || [])].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const out = [];
  let cum = 0, sum = 0;
  ms.forEach((m, idx) => {
    const c = m.criteria || {};
    let y;
    if (metric === "goals") { cum += parseInt(c.goal || 0) + parseInt(c.header || 0) + parseInt(c.freekick || 0) + parseInt(c.screamer || 0); y = cum; }
    else if (metric === "assists") { cum += parseInt(c.assist || 0); y = cum; }
    else if (metric === "bangers") { cum += parseInt(c.screamer || 0); y = cum; }
    else if (metric === "avg") { sum += safeR(m); y = sum / (idx + 1); }
    else { y = safeR(m); } // rating: ocena z meczu
    out.push({ x: idx + 1, y, date: m.date, season: seasonIndexOf(m.date) });
  });
  if (metric === "goals" || metric === "assists" || metric === "bangers") {
    out.unshift({ x: 0, y: 0, date: ms.length ? ms[0].date : todayStr(), season: ms.length ? seasonIndexOf(ms[0].date) : 1 });
  }
  return out;
}
