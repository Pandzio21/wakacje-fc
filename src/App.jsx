import { useState, useEffect, useRef } from "react";
import {
  PLAYERS, RANDOM_PLAYERS, ALL_PLAYERS, isRandomId,
  BASE_RATING, DEFAULT_CRITERIA, DEFAULT_PLAYERS,
  GOAL_TYPES, GICO, RESULT_COLOR, RESULT_ICON, CAT_LABELS,
  HALF_MIN, PHASE_ORDER, PHASE_LABELS, goalPhase, goalSortVal, goalLabel,
  fv, rc, safeR, medalColor,
  calcMatchRating, getAvgRating, checkFormBonus, getSessionChangePct, calcValue, getTrend, applyGoalToCriteria,
  FIRST_SEASON_END, todayStr, addDaysStr, fmtPL,
  seasonIndexOf, seasonRange, matchKeyOf, getMatches, buildSeasons,
  computeSeasonAwards, getLastCompletedSeasonAwards, normalizePlayers,
  SEASON_COLORS, seasonColor, valueSeries, metricSeries,
  MAX_VALUE, TOP_TIER_FLOOR, TOP_TIER_MIN_RATING,
  applySeasonRolloverIfNeeded, SEASON_BONUSES,
} from "./logic.js";

// ─── WSPÓLNE STYLE ────────────────────────────────────────────────────────────
const BG = "radial-gradient(ellipse at top,#1a0f2e 0%,#0c0a1d 60%)";
const CARD = { background:"#150d2e", border:"1px solid #221640", borderRadius:12, padding:18, marginBottom:14 };
const LABEL = { fontSize:11, color:"#334155", marginBottom:14, letterSpacing:.5 };
const INP = { background:"#221640", border:"1px solid #3b1f5c", borderRadius:6, color:"#e2e8f0", padding:"7px 10px", fontSize:13, width:"100%", boxSizing:"border-box" };
const nameOf = (id) => { const p = ALL_PLAYERS.find(x => x.id === id); return p ? p.name : "?"; };

const EMPTY_WIZ = () => ({
  step:"1", date:todayStr(), teamAName:"", teamBName:"",
  teamA:[], teamB:[], goals:[], ratings:{}, activeP:null,
  extraTime:false, pensOn:false, pensA:"", pensB:"",
  editingKey:null,
});

// ─── PASEK KROKÓW ─────────────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:20 }}>
      {[["1","Skład"],["2","Gole"],["3","Oceny"],["4","Gotowe"]].map(([s,lbl],i) => (
        <div key={s} style={{ display:"flex", alignItems:"center", gap:6 }}>
          {i>0 && <div style={{ width:16, height:2, background: parseInt(step)>i ? "#ff6b35" : "#3b1f5c" }} />}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            <div style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800,
              background: step===s ? "#ff6b35" : parseInt(step)>parseInt(s) ? "#7c2d12" : "#3b1f5c",
              color: step===s ? "#fff" : parseInt(step)>parseInt(s) ? "#ffb088" : "#475569" }}>
              {parseInt(step)>parseInt(s) ? "✓" : s}
            </div>
            <div style={{ fontSize:9, color: step===s ? "#ffb088" : "#475569" }}>{lbl}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── KREATOR MECZU ────────────────────────────────────────────────────────────
function MatchWizard({ wiz, setWiz, players, criteria, onSubmit }) {
  const { step, date, teamAName, teamBName, teamA, teamB, goals, ratings, activeP, extraTime, pensOn, pensA, pensB, editingKey } = wiz;
  const isEdit = !!editingKey;
  const W = (upd) => setWiz(w => ({ ...w, ...upd }));
  const scoreA = goals.filter(g => g.teamSide==="A").length;
  const scoreB = goals.filter(g => g.teamSide==="B").length;
  const inp = { width:"100%", background:"#221640", border:"1px solid #3b1f5c", borderRadius:6, color:"#e2e8f0", padding:"8px 10px", fontSize:13, boxSizing:"border-box" };
  const lbl = { fontSize:12, color:"#64748b", display:"block", marginBottom:4 };

  const PlayerPick = ({ p, ids, other, setIds, ac, ab }) => {
    const inThis = ids.includes(p.id), inOther = other.includes(p.id);
    return (
      <button onClick={() => { if (inOther) return; setIds(inThis ? ids.filter(x => x!==p.id) : [...ids, p.id]); }}
        style={{ padding:"6px 10px", borderRadius:6, border:`1px solid ${inThis?ac:"#3b1f5c"}`, textAlign:"left", cursor: inOther?"not-allowed":"pointer", fontSize:12, fontWeight:600,
          background: inThis?ab:"transparent", color: inThis?ac:inOther?"#334155":"#64748b", opacity: inOther?0.4:1 }}>
        {inThis ? "✓ " : ""}{p.name} <span style={{ fontWeight:400, opacity:.6 }}>· {p.position}</span>
      </button>
    );
  };

  // STEP 1 ───────────────────────────────────────────────────────────────────
  if (step==="1") return (
    <div style={{ marginTop:16 }}>
      {isEdit && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,107,53,.12)", border:"1px solid #ff6b35", borderRadius:8, padding:"8px 12px", marginBottom:12 }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#ffb088" }}>✏️ Edytujesz istniejący mecz</span>
        </div>
      )}
      <p style={{ fontSize:12, color:"#64748b", margin:"0 0 16px" }}>Wybierz datę, nazwij drużyny i dodaj zawodników. Zawodnicy „spoza klasy" są oceniani, ale nie liczą się do rankingu ani statystyk sezonu.</p>
      <div style={{ background:"#221640", border:"1px solid #3b1f5c", borderRadius:12, padding:20 }}>
        <StepBar step={step} />
        <label style={lbl}>Data meczu</label>
        <input type="date" value={date} onChange={e => W({ date:e.target.value })} style={{ ...inp, marginBottom:16 }} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            { side:"A", name:teamAName, setName:v=>W({teamAName:v}), ids:teamA, other:teamB, setIds:v=>W({teamA:v}), ac:"#ff6b35", ab:"rgba(255,107,53,.15)", ph:"Team Huxa" },
            { side:"B", name:teamBName, setName:v=>W({teamBName:v}), ids:teamB, other:teamA, setIds:v=>W({teamB:v}), ac:"#00d9c0", ab:"rgba(0,217,192,.15)", ph:"Team Śmietanki" },
          ].map(({ side, name, setName, ids, other, setIds, ac, ab, ph }) => (
            <div key={side}>
              <label style={lbl}>Drużyna {side}</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={ph} style={{ ...inp, marginBottom:10, borderColor:ac+"66" }} />
              <label style={lbl}>Zawodnicy</label>
              <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                {PLAYERS.map(p => <PlayerPick key={p.id} p={p} ids={ids} other={other} setIds={setIds} ac={ac} ab={ab} />)}
                <div style={{ fontSize:9, color:"#475569", textAlign:"center", margin:"4px 0 1px", letterSpacing:.5 }}>— SPOZA KLASY —</div>
                {RANDOM_PLAYERS.map(p => <PlayerPick key={p.id} p={p} ids={ids} other={other} setIds={setIds} ac={ac} ab={ab} />)}
              </div>
              <div style={{ fontSize:11, color:ac, marginTop:5, opacity: ids.length?1:0.3 }}>{ids.length} zawodników</div>
            </div>
          ))}
        </div>
        <button onClick={() => { if (teamA.length && teamB.length) W({ step:"2" }); }} disabled={!teamA.length||!teamB.length}
          style={{ width:"100%", marginTop:16, padding:"11px", background: teamA.length&&teamB.length?"#ff6b35":"#3b1f5c", border:"none", borderRadius:8, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          Dalej → Gole
        </button>
      </div>
    </div>
  );

  // STEP 2 ───────────────────────────────────────────────────────────────────
  if (step==="2") {
    const add = (side) => W({ goals:[...goals, { id:Date.now()+Math.random(), teamSide:side, scorer:"", assist:"", minute:"", stoppage:"", type:"normal", phase:"1H" }] });
    const upd = (id, u) => W({ goals: goals.map(g => g.id===id ? { ...g, ...u } : g) });
    const rm = (id) => W({ goals: goals.filter(g => g.id!==id) });
    const sel = { background:"#221640", border:"1px solid #3b1f5c", borderRadius:5, color:"#e2e8f0", padding:"5px 7px", fontSize:12, width:"100%" };
    const tA = teamA.map(id => ALL_PLAYERS.find(p => p.id===id)).filter(Boolean);
    const tB = teamB.map(id => ALL_PLAYERS.find(p => p.id===id)).filter(Boolean);
    return (
      <div style={{ marginTop:16 }}>
        <div style={{ background:"#221640", border:"1px solid #3b1f5c", borderRadius:12, padding:20 }}>
          <StepBar step={step} />
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:20, marginBottom:18, padding:"14px", background:"#0c0a1d", borderRadius:10 }}>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:11, color:"#64748b", marginBottom:2 }}>{teamAName||"A"}</div><div style={{ fontSize:38, fontWeight:900, color:"#ff6b35" }}>{scoreA}</div></div>
            <div style={{ fontSize:20, color:"#334155", fontWeight:800 }}>:</div>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:11, color:"#64748b", marginBottom:2 }}>{teamBName||"B"}</div><div style={{ fontSize:38, fontWeight:900, color:"#00d9c0" }}>{scoreB}</div></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
            <button onClick={() => add("A")} style={{ padding:"9px", background:"rgba(255,107,53,.15)", border:"1px solid #ff6b35", borderRadius:8, color:"#ffb088", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Gol {teamAName||"A"}</button>
            <button onClick={() => add("B")} style={{ padding:"9px", background:"rgba(0,217,192,.15)", border:"1px solid #00d9c0", borderRadius:8, color:"#7ef5e5", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Gol {teamBName||"B"}</button>
          </div>
          {goals.length===0 && <div style={{ fontSize:12, color:"#334155", textAlign:"center", padding:"16px 0", fontStyle:"italic" }}>Brak goli – dodaj powyżej lub przejdź dalej</div>}
          {goals.map((g, gi) => {
            const isA = g.teamSide==="A";
            const isOG = g.type==="ownGoal";
            // Przy samobóju gol liczy się dla drużyny `teamSide`, ale strzela go zawodnik drużyny PRZECIWNEJ
            const pool = isOG ? (isA ? tB : tA) : (isA ? tA : tB);
            const noA = g.type==="penalty" || g.type==="noAssist" || isOG;
            return (
              <div key={g.id} style={{ background:"#0c0a1d", border:`1px solid ${isOG?"#ef4444":(isA?"#ff6b35":"#00d9c0")}33`, borderRadius:10, padding:"12px", marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:isA?"#ffb088":"#7ef5e5" }}>● Gol {gi+1} · {isA?(teamAName||"A"):(teamBName||"B")}{isOG && <span style={{ color:"#ef4444", marginLeft:5 }}>(samobój)</span>}</div>
                  <button onClick={() => rm(g.id)} style={{ background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:16 }}>✕</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <div>
                    <label style={lbl}>{isOG ? `Strzelec (${isA?(teamBName||"B"):(teamAName||"A")} – samobój)` : "Strzelec"}</label>
                    <select value={g.scorer} onChange={e => upd(g.id,{ scorer:e.target.value })} style={{ ...sel, borderColor:isOG?"#ef4444":"#3b1f5c" }}>
                      <option value="">— —</option>
                      {pool.map(p => <option key={p.id} value={p.id}>{p.name}{p.random?" (spoza)":""}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Asysta</label>
                    <select value={g.assist} onChange={e => upd(g.id,{ assist:e.target.value })} disabled={noA} style={{ ...sel, opacity:noA?0.35:1 }}>
                      <option value="">— brak —</option>
                      {pool.filter(p => p.id!==g.scorer).map(p => <option key={p.id} value={p.id}>{p.name}{p.random?" (spoza)":""}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"68px 78px 1fr", gap:8, marginBottom:8, alignItems:"end" }}>
                  <div>
                    <label style={lbl}>Min.</label>
                    <input type="number" min="1" max="60" placeholder="12" value={g.minute} onChange={e => upd(g.id,{ minute:e.target.value })} style={{ ...sel, padding:"5px 6px" }} />
                  </div>
                  <div>
                    <label style={lbl}>Doliczony</label>
                    <input type="number" min="0" max="15" placeholder="+0" value={g.stoppage} onChange={e => upd(g.id,{ stoppage:e.target.value })} style={{ ...sel, padding:"5px 6px" }} />
                  </div>
                  <div>
                    <label style={lbl}>Faza</label>
                    <div style={{ display:"flex", gap:4 }}>
                      {PHASE_ORDER.map(ph => (
                        <button key={ph} onClick={() => upd(g.id,{ phase:ph })}
                          style={{ flex:1, padding:"5px 4px", borderRadius:4, border:`1px solid ${g.phase===ph?"#ff6b35":"#3b1f5c"}`, background:g.phase===ph?"rgba(255,107,53,.2)":"transparent", color:g.phase===ph?"#ffb088":"#64748b", fontSize:10, fontWeight:600, cursor:"pointer" }}>
                          {ph==="1H"?"1. poł":ph==="2H"?"2. poł":"dogr."}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {GOAL_TYPES.map(t => (
                    <button key={t.id} onClick={() => {
                        const wasOG = g.type==="ownGoal", willOG = t.id==="ownGoal";
                        const clearScorer = wasOG !== willOG; // pula zawodników się zmienia → resetuj wybór
                        upd(g.id,{ type:t.id, assist:(t.id==="penalty"||t.id==="noAssist"||willOG)?"":g.assist, scorer:clearScorer?"":g.scorer });
                      }}
                      style={{ padding:"3px 9px", borderRadius:4, border:"1px solid", fontSize:11, fontWeight:600, cursor:"pointer",
                        background:g.type===t.id?(t.id==="ownGoal"?"#ef4444":"#ff6b35"):"transparent", borderColor:g.type===t.id?(t.id==="ownGoal"?"#ef4444":"#ff6b35"):"#3b1f5c", color:g.type===t.id?"#fff":"#64748b" }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* DOGRYWKA / KARNE */}
          <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #3b1f5c" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#c9a8e0", marginBottom:10, letterSpacing:.5 }}>⏱️ DOGRYWKA I KARNE</div>
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              <button onClick={() => W({ extraTime: !extraTime })}
                style={{ padding:"7px 12px", borderRadius:7, border:`1px solid ${extraTime?"#ff6b35":"#3b1f5c"}`, background:extraTime?"rgba(255,107,53,.18)":"transparent", color:extraTime?"#ffb088":"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                {extraTime?"✓ ":""}Dogrywka rozegrana
              </button>
              <button onClick={() => W({ pensOn: !pensOn })}
                style={{ padding:"7px 12px", borderRadius:7, border:`1px solid ${pensOn?"#00d9c0":"#3b1f5c"}`, background:pensOn?"rgba(0,217,192,.18)":"transparent", color:pensOn?"#7ef5e5":"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                {pensOn?"✓ ":""}Rzuty karne
              </button>
            </div>
            {pensOn && (
              <div style={{ display:"flex", alignItems:"center", gap:10, background:"#0c0a1d", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"#64748b", marginBottom:3 }}>{teamAName||"A"}</div>
                  <input type="number" min="0" value={pensA} onChange={e => W({ pensA:e.target.value })} style={{ width:"100%", background:"#221640", border:"1px solid #ff6b35", borderRadius:5, color:"#ffb088", padding:"6px", fontSize:15, textAlign:"center", boxSizing:"border-box" }} />
                </div>
                <div style={{ fontSize:16, color:"#334155", fontWeight:800, marginTop:14 }}>:</div>
                <div style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"#64748b", marginBottom:3 }}>{teamBName||"B"}</div>
                  <input type="number" min="0" value={pensB} onChange={e => W({ pensB:e.target.value })} style={{ width:"100%", background:"#221640", border:"1px solid #00d9c0", borderRadius:5, color:"#7ef5e5", padding:"6px", fontSize:15, textAlign:"center", boxSizing:"border-box" }} />
                </div>
              </div>
            )}
            <div style={{ fontSize:10, color:"#475569", marginTop:8 }}>Karne rozstrzygają o zwycięzcy tylko przy remisie w regulaminowym czasie. Połowa trwa {HALF_MIN} min.</div>
          </div>

          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <button onClick={() => W({ step:"1" })} style={{ padding:"9px 16px", background:"transparent", border:"1px solid #3b1f5c", borderRadius:8, color:"#64748b", fontSize:13, cursor:"pointer" }}>← Wróć</button>
            <button onClick={() => W({ step:"3" })} style={{ flex:1, padding:"11px", background:"#ff6b35", border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Dalej → Oceny</button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3 ───────────────────────────────────────────────────────────────────
  if (step==="3") {
    if (activeP) {
      const p = ALL_PLAYERS.find(x => x.id===activeP);
      const rnd = isRandomId(activeP);
      const r = ratings[activeP] || { criteria:{}, note:"" };
      const setR = (u) => W({ ratings:{ ...ratings, [activeP]:{ ...r, ...u } } });
      const updC = (cid, n) => setR({ criteria:{ ...r.criteria, [cid]:Math.max(0,n) } });
      const myGoals = goals.filter(g => g.scorer===activeP);
      const myAssists = goals.filter(g => g.assist===activeP);
      const pc = { ...r.criteria };
      goals.forEach(g => applyGoalToCriteria(pc, g, activeP));
      const pr = calcMatchRating(pc, criteria);
      const curPl = players.find(x => x.id===activeP) || { value:0, matches:[], opinions:[] };
      const curV = calcValue(curPl);
      const chg = Math.round(curV * getSessionChangePct(curV, pr-BASE_RATING, pr));
      return (
        <div style={{ marginTop:16 }}>
          <button onClick={() => W({ activeP:null })} style={{ background:"none", border:"none", color:"#ff6b35", cursor:"pointer", fontSize:13, marginBottom:12, padding:0 }}>← Wróć do składu</button>
          <div style={{ background:"#221640", border:"1px solid #3b1f5c", borderRadius:12, padding:20 }}>
            <StepBar step={step} />
            <div style={{ fontSize:17, fontWeight:800, marginBottom:4, color:"#e2e8f0" }}>{p?.name} <span style={{ fontSize:12, color:"#64748b", fontWeight:400 }}>· {p?.position}</span>
              {rnd && <span style={{ fontSize:9, background:"rgba(148,163,184,.15)", border:"1px solid #475569", color:"#94a3b8", borderRadius:3, padding:"1px 6px", marginLeft:8 }}>SPOZA KLASY</span>}
            </div>
            {(myGoals.length>0 || myAssists.length>0) && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:12 }}>
                {myGoals.map((g,i) => <span key={i} style={{ background: g.type==="ownGoal"?"rgba(239,68,68,.2)":"rgba(255,107,53,.2)", border:`1px solid ${g.type==="ownGoal"?"#ef4444":"#ff6b35"}`, borderRadius:4, padding:"2px 8px", fontSize:11, color:g.type==="ownGoal"?"#fca5a5":"#ffb088" }}>{GICO[g.type]||"⚽"}{g.type==="ownGoal"?" samobój":""}{g.minute?" "+goalLabel(g):""}</span>)}
                {myAssists.map((g,i) => <span key={i} style={{ background:"rgba(20,184,166,.2)", border:"1px solid #14b8a6", borderRadius:4, padding:"2px 8px", fontSize:11, color:"#5eead4" }}>🎯{g.minute?" "+goalLabel(g):""}</span>)}
              </div>
            )}
            {["pos","gk_pos","neg","gk_neg"].map(cat => (
              <div key={cat} style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:cat.includes("neg")?"#ef4444":"#ff6b35", letterSpacing:.8, textTransform:"uppercase", marginBottom:6 }}>{CAT_LABELS[cat]}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
                  {criteria.filter(c => c.cat===cat).map(c => {
                    const v = parseInt((r.criteria||{})[c.id]||0);
                    return (
                      <div key={c.id} style={{ background:"#0c0a1d", borderRadius:7, padding:"8px 10px", border:`1px solid ${c.points>0?"#1e3a5f":"#3f1f2f"}` }}>
                        <div style={{ fontSize:11, fontWeight:600, color:"#e8d5f5", marginBottom:1 }}>{c.label}</div>
                        <div style={{ fontSize:9, color:"#475569", marginBottom:5 }}>{c.desc}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <button onClick={() => updC(c.id, v-1)} style={{ width:22, height:22, borderRadius:4, background:"#3b1f5c", border:"none", color:"#c9a8e0", cursor:"pointer", fontSize:13, fontWeight:700 }}>−</button>
                          <span style={{ minWidth:16, textAlign:"center", fontWeight:800, fontSize:13, color:v?(c.points>0?"#ff6b35":"#ef4444"):"#334155" }}>{v}</span>
                          <button onClick={() => updC(c.id, v+1)} style={{ width:22, height:22, borderRadius:4, background:c.points>0?"rgba(255,107,53,.2)":"rgba(239,68,68,.2)", border:"none", color:c.points>0?"#ffb088":"#fca5a5", cursor:"pointer", fontSize:13, fontWeight:700 }}>+</button>
                          <span style={{ fontSize:9, color:c.points>0?"#ff6b35":"#ef4444" }}>{c.points>0?"+":""}{c.points}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <label style={{ fontSize:12, color:"#64748b", display:"block", marginTop:4 }}>Notatka</label>
            <input value={r.note||""} onChange={e => setR({ note:e.target.value })} placeholder="opcjonalnie..."
              style={{ width:"100%", background:"#0c0a1d", border:"1px solid #3b1f5c", borderRadius:6, color:"#e2e8f0", padding:"7px 10px", fontSize:13, marginTop:4, marginBottom:14, boxSizing:"border-box" }} />
            <div style={{ background:"#0c0a1d", border:"1px solid #ff6b35", borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", marginBottom:14 }}>
              <div><div style={{ fontSize:11, color:"#64748b" }}>Ocena</div><div style={{ fontSize:24, fontWeight:900, color:rc(pr) }}>{pr.toFixed(2)}</div></div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"#64748b" }}>{rnd?"Status":"Zmiana wartości"}</div>
                {rnd
                  ? <div style={{ fontSize:12, fontWeight:700, color:"#94a3b8", maxWidth:150 }}>poza rankingiem i statystykami</div>
                  : <div style={{ fontSize:16, fontWeight:800, color:chg>=0?"#22c55e":"#ef4444" }}>{chg>=0?"+":""}{fv(Math.abs(chg))}</div>}
              </div>
            </div>
            {!rnd && curV>=TOP_TIER_FLOOR && pr<TOP_TIER_MIN_RATING && (
              <div style={{ background:"rgba(239,68,68,.12)", border:"1px solid #ef4444", borderRadius:8, padding:"8px 12px", marginTop:-8, marginBottom:14, fontSize:11, color:"#fca5a5" }}>
                ⚠️ {p?.name} jest blisko limitu {fv(MAX_VALUE)} — przy ocenie poniżej {TOP_TIER_MIN_RATING.toFixed(1)} wartość spada x4 szybciej.
              </div>
            )}
            <button onClick={() => W({ activeP:null })} style={{ width:"100%", padding:"11px", background:"#ff6b35", border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>💾 Zapisz i wróć</button>
          </div>
        </div>
      );
    }
    const gByP = {}, ogByP = {};
    goals.forEach(g => { if (g.scorer) { if (g.type==="ownGoal") ogByP[g.scorer]=(ogByP[g.scorer]||0)+1; else gByP[g.scorer]=(gByP[g.scorer]||0)+1; } });
    return (
      <div style={{ marginTop:16 }}>
        <div style={{ background:"#221640", border:"1px solid #3b1f5c", borderRadius:12, padding:20 }}>
          <StepBar step={step} />
          <div style={{ display:"flex", justifyContent:"center", gap:20, marginBottom:14, padding:"10px", background:"#0c0a1d", borderRadius:8 }}>
            <span style={{ color:"#ffb088", fontWeight:800, fontSize:15 }}>{teamAName||"A"} {scoreA}</span>
            <span style={{ color:"#334155" }}>:</span>
            <span style={{ color:"#7ef5e5", fontWeight:800, fontSize:15 }}>{scoreB} {teamBName||"B"}</span>
          </div>
          {[{ side:"A", ids:teamA, ac:"#ff6b35", tn:teamAName||"Drużyna A" },{ side:"B", ids:teamB, ac:"#00d9c0", tn:teamBName||"Drużyna B" }].map(({ side, ids, ac, tn }) => (
            <div key={side} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:ac, marginBottom:7, letterSpacing:.5 }}>{tn.toUpperCase()}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                {ids.map(id => {
                  const p = ALL_PLAYERS.find(x => x.id===id); if (!p) return null;
                  const hasR = ratings[id] && Object.values(ratings[id].criteria||{}).some(v => parseInt(v)>0);
                  const pG = gByP[id]||0, pOG = ogByP[id]||0, pA = goals.filter(g => g.assist===id).length;
                  const crit = { ...(ratings[id]?.criteria||{}) };
                  goals.forEach(g => applyGoalToCriteria(crit, g, id));
                  const pr = calcMatchRating(crit, criteria);
                  return (
                    <button key={id} onClick={() => W({ activeP:id })}
                      style={{ background:"#0c0a1d", border:`1px solid ${hasR?ac:"#3b1f5c"}`, borderRadius:8, padding:"10px", textAlign:"left", cursor:"pointer" }}>
                      <div style={{ fontWeight:700, fontSize:13, color:"#e2e8f0" }}>{p.name}{p.random && <span style={{ fontSize:9, color:"#94a3b8", marginLeft:4 }}>spoza</span>}</div>
                      <div style={{ fontSize:10, color:"#475569", marginBottom:5 }}>{p.position}</div>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:5 }}>
                        {pG>0 && <span style={{ fontSize:10, background:"rgba(255,107,53,.2)", border:"1px solid #ff6b35", borderRadius:3, padding:"1px 5px", color:"#ffb088" }}>⚽{pG}</span>}
                        {pOG>0 && <span style={{ fontSize:10, background:"rgba(239,68,68,.2)", border:"1px solid #ef4444", borderRadius:3, padding:"1px 5px", color:"#fca5a5" }}>😬{pOG}</span>}
                        {pA>0 && <span style={{ fontSize:10, background:"rgba(20,184,166,.2)", border:"1px solid #14b8a6", borderRadius:3, padding:"1px 5px", color:"#5eead4" }}>🎯{pA}</span>}
                      </div>
                      <div style={{ fontSize:16, fontWeight:900, color:rc(pr) }}>{pr.toFixed(2)}</div>
                      <div style={{ fontSize:9, color:hasR?ac:"#334155", marginTop:2 }}>{hasR?"✓ oceniony":"kliknij →"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button onClick={() => W({ step:"2" })} style={{ padding:"9px 16px", background:"transparent", border:"1px solid #3b1f5c", borderRadius:8, color:"#64748b", fontSize:13, cursor:"pointer" }}>← Wróć</button>
            <button onClick={() => W({ step:"4" })} style={{ flex:1, padding:"11px", background:"#ff6b35", border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Dalej → Podsumowanie</button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4 ───────────────────────────────────────────────────────────────────
  if (step==="4") {
    const allIds = [...teamA, ...teamB];
    const pens = pensOn ? { a:parseInt(pensA)||0, b:parseInt(pensB)||0 } : null;
    return (
      <div style={{ marginTop:16 }}>
        <div style={{ background:"#221640", border:"1px solid #3b1f5c", borderRadius:12, padding:20 }}>
          <StepBar step={step} />
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:24, marginBottom:6, padding:"16px", background:"#0c0a1d", borderRadius:12 }}>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>{teamAName||"A"}</div><div style={{ fontSize:44, fontWeight:900, color:"#ffb088", lineHeight:1 }}>{scoreA}</div></div>
            <div style={{ fontSize:26, color:"#334155", fontWeight:800 }}>:</div>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>{teamBName||"B"}</div><div style={{ fontSize:44, fontWeight:900, color:"#7ef5e5", lineHeight:1 }}>{scoreB}</div></div>
          </div>
          {(extraTime || pens) && (
            <div style={{ textAlign:"center", fontSize:11, color:"#c9a8e0", marginBottom:14 }}>
              {extraTime && <span>po dogrywce</span>}
              {extraTime && pens && <span> · </span>}
              {pens && <span>karne {pens.a}:{pens.b}</span>}
            </div>
          )}
          {goals.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#64748b", marginBottom:8, letterSpacing:.5 }}>GOLE</div>
              {[...goals].sort((a,b) => goalSortVal(a)-goalSortVal(b)).map((g,i) => {
                const isA = g.teamSide==="A";
                const isOG = g.type==="ownGoal";
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:"#0c0a1d", borderRadius:6, marginBottom:4, borderLeft:`3px solid ${isA?"#ff6b35":"#00d9c0"}` }}>
                    <span style={{ fontSize:11, color:"#475569", minWidth:34 }}>{goalLabel(g)}</span>
                    <span style={{ fontSize:9, color:"#475569" }}>{PHASE_LABELS[goalPhase(g)].split(".")[0]}{goalPhase(g)==="ET"?"":"."}</span>
                    <span>{GICO[g.type]||"⚽"}</span>
                    <span style={{ fontWeight:700, fontSize:13, color:"#e2e8f0" }}>{nameOf(g.scorer)}</span>
                    {isOG && <span style={{ fontSize:10, color:"#ef4444" }}>(samobój)</span>}
                    {g.assist && <span style={{ fontSize:11, color:"#5eead4" }}>🎯 {nameOf(g.assist)}</span>}
                    <span style={{ marginLeft:"auto", fontSize:10, color:isA?"#ffb088":"#7ef5e5" }}>{isA?(teamAName||"A"):(teamBName||"B")}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ fontSize:11, fontWeight:700, color:"#64748b", marginBottom:8, letterSpacing:.5 }}>OCENY</div>
          {allIds.map(id => {
            const p = ALL_PLAYERS.find(x => x.id===id); if (!p) return null;
            const r = ratings[id] || { criteria:{}, note:"" };
            const crit = { ...r.criteria };
            goals.forEach(g => applyGoalToCriteria(crit, g, id));
            const rating = calcMatchRating(crit, criteria);
            const inA = teamA.includes(id);
            return (
              <div key={id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 12px", background:"#0c0a1d", borderRadius:6, marginBottom:4, borderLeft:`3px solid ${inA?"#ff6b35":"#00d9c0"}` }}>
                <div><span style={{ fontWeight:700, fontSize:13, color:"#e2e8f0" }}>{p.name}</span><span style={{ fontSize:11, color:"#475569", marginLeft:6 }}>{p.position}{p.random?" · spoza":""}</span></div>
                <span style={{ fontWeight:900, fontSize:18, color:rc(rating) }}>{rating.toFixed(2)}</span>
              </div>
            );
          })}
          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            <button onClick={() => W({ step:"3" })} style={{ padding:"9px 16px", background:"transparent", border:"1px solid #3b1f5c", borderRadius:8, color:"#64748b", fontSize:13, cursor:"pointer" }}>← Wróć</button>
            <button onClick={onSubmit} style={{ flex:1, padding:"13px", background:"linear-gradient(135deg,#ff6b35,#e0289d)", border:"none", borderRadius:8, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer" }}>
              {isEdit ? "💾 Zapisz zmiany w meczu" : "💾 Zapisz mecz dla wszystkich"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// ─── MAPA STRZAŁÓW ────────────────────────────────────────────────────────────
function ShotMap({ shots, goals, onSave, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [home, setHome] = useState(shots?.home||50);
  const [away, setAway] = useState(shots?.away||50);
  const [homeShotsOn, setHomeShotsOn] = useState(shots?.homeShotsOn||0);
  const [awayShotsOn, setAwayShotsOn] = useState(shots?.awayShotsOn||0);
  const [homeShots, setHomeShots] = useState(shots?.homeShots||0);
  const [awayShots, setAwayShots] = useState(shots?.awayShots||0);
  useEffect(() => { if (shots) { setHome(shots.home||50); setAway(shots.away||50); setHomeShotsOn(shots.homeShotsOn||0); setAwayShotsOn(shots.awayShotsOn||0); setHomeShots(shots.homeShots||0); setAwayShots(shots.awayShots||0); } }, [shots]);
  const save = () => { onSave({ home, away, homeShotsOn, awayShotsOn, homeShots, awayShots }); setEditing(false); };
  const Bar = ({ left, right, label, lc="#ff6b35", rc2="#00d9c0" }) => {
    const total = left+right||1;
    return (
      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#64748b", marginBottom:3 }}>
          <span style={{ color:lc, fontWeight:700 }}>{left}</span><span style={{ opacity:.6 }}>{label}</span><span style={{ color:rc2, fontWeight:700 }}>{right}</span>
        </div>
        <div style={{ display:"flex", height:8, borderRadius:4, overflow:"hidden", background:"#3b1f5c" }}>
          <div style={{ width:`${(left/total)*100}%`, background:lc, transition:"width .3s" }} />
          <div style={{ width:`${(right/total)*100}%`, background:rc2 }} />
        </div>
      </div>
    );
  };
  if (!shots && readOnly) return null;
  if (!shots && !editing) return (
    <button onClick={() => setEditing(true)} style={{ width:"100%", marginTop:10, padding:"7px", background:"transparent", border:"1px dashed #3b1f5c", borderRadius:6, color:"#475569", fontSize:11, cursor:"pointer" }}>
      + Dodaj statystyki meczu (posiadanie, strzały...)
    </button>
  );
  if (editing) return (
    <div style={{ marginTop:10, background:"#0c0a1d", borderRadius:8, padding:14, border:"1px solid #3b1f5c" }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#c9a8e0", marginBottom:12 }}>📊 Statystyki meczu</div>
      {[
        ["Posiadanie piłki (%)", home, setHome, away, setAway],
        ["Strzały celne", homeShotsOn, setHomeShotsOn, awayShotsOn, setAwayShotsOn],
        ["Strzały ogółem", homeShots, setHomeShots, awayShots, setAwayShots],
      ].map(([label, lv, ls, rv, rs]) => (
        <div key={label} style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:"#475569", marginBottom:4 }}>{label}</div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <input type="number" value={lv} onChange={e => ls(parseInt(e.target.value)||0)} style={{ width:56, background:"#221640", border:"1px solid #ff6b35", borderRadius:5, color:"#ffb088", padding:"5px 7px", fontSize:13, textAlign:"center" }} />
            <span style={{ color:"#334155", fontSize:12 }}>vs</span>
            <input type="number" value={rv} onChange={e => rs(parseInt(e.target.value)||0)} style={{ width:56, background:"#221640", border:"1px solid #00d9c0", borderRadius:5, color:"#7ef5e5", padding:"5px 7px", fontSize:13, textAlign:"center" }} />
          </div>
        </div>
      ))}
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={save} style={{ flex:1, padding:"8px", background:"#ff6b35", border:"none", borderRadius:6, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>Zapisz</button>
        <button onClick={() => setEditing(false)} style={{ padding:"8px 12px", background:"transparent", border:"1px solid #3b1f5c", borderRadius:6, color:"#64748b", fontSize:12, cursor:"pointer" }}>Anuluj</button>
      </div>
    </div>
  );
  return (
    <div style={{ marginTop:10, background:"#0c0a1d", borderRadius:8, padding:12, border:"1px solid #3b1f5c" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#475569" }}>📊 Statystyki</div>
        {!readOnly && <button onClick={() => setEditing(true)} style={{ background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:11 }}>✏️</button>}
      </div>
      <Bar left={shots.home} right={shots.away} label="Posiadanie %" lc="#ff6b35" rc2="#00d9c0" />
      <Bar left={shots.homeShotsOn} right={shots.awayShotsOn} label="Strzały celne" />
      <Bar left={shots.homeShots} right={shots.awayShots} label="Strzały ogółem" />
      <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:8, fontSize:10 }}>
        <span style={{ color:"#ff6b35" }}>■ {goals.teamAName||"Dom"}</span>
        <span style={{ color:"#00d9c0" }}>■ {goals.teamBName||"Gość"}</span>
      </div>
    </div>
  );
}

// ─── OŚ CZASU GOLI (połowy + przerwa + dogrywka + karne) ──────────────────────
function MatchTimeline({ entry }) {
  const goals = entry.goals || [];
  const pens = entry.penalties;
  const hasPens = pens && (pens.a || pens.b);
  if (!goals.length && !hasPens && !entry.extraTime) return null;

  const phaseGoals = (ph) => goals.filter(g => goalPhase(g)===ph).sort((a,b) => goalSortVal(a)-goalSortVal(b));
  const g1 = phaseGoals("1H"), g2 = phaseGoals("2H"), gE = phaseGoals("ET");
  const htA = g1.filter(g => g.teamSide==="A").length, htB = g1.filter(g => g.teamSide==="B").length;
  const showHalf = g2.length>0 || gE.length>0 || entry.extraTime || g1.length>0;
  const showET = gE.length>0 || entry.extraTime;

  const Row = (g, i) => {
    const isA = g.teamSide==="A";
    const isOG = g.type==="ownGoal";
    return (
      <div key={i} style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 8px", background:"#0c0a1d", borderRadius:5, marginBottom:3, borderLeft:`2px solid ${isA?"#ff6b35":"#00d9c0"}` }}>
        <span style={{ fontSize:11, color:"#475569", minWidth:30 }}>{goalLabel(g)}</span>
        <span style={{ fontSize:12 }}>{GICO[g.type]||"⚽"}</span>
        <span style={{ fontWeight:700, fontSize:12, color:"#e2e8f0" }}>{nameOf(g.scorer)}</span>
        {isOG && <span style={{ fontSize:10, color:"#ef4444" }}>(samobój)</span>}
        {g.assist && <span style={{ fontSize:11, color:"#5eead4" }}>🎯{nameOf(g.assist)}</span>}
      </div>
    );
  };
  const Divider = (text, color="#3b1f5c") => (
    <div style={{ display:"flex", alignItems:"center", gap:8, margin:"7px 0" }}>
      <div style={{ flex:1, height:1, background:"#221640" }} />
      <span style={{ fontSize:9, fontWeight:700, color, letterSpacing:.5, whiteSpace:"nowrap" }}>{text}</span>
      <div style={{ flex:1, height:1, background:"#221640" }} />
    </div>
  );

  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:10, color:"#334155", marginBottom:6, letterSpacing:.5 }}>PRZEBIEG MECZU</div>
      {g1.map(Row)}
      {showHalf && Divider(`PRZERWA · ${htA}:${htB}`, "#c9a8e0")}
      {g2.map(Row)}
      {showET && Divider("DOGRYWKA", "#ffb088")}
      {gE.map(Row)}
      {hasPens && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"7px 8px", background:"#0c0a1d", borderRadius:5, marginTop:4, border:"1px dashed #3b1f5c" }}>
          <span style={{ fontSize:13 }}>🫵</span>
          <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>Rzuty karne</span>
          <span style={{ fontSize:14, fontWeight:900, color:"#e2e8f0" }}>{pens.a}<span style={{ color:"#334155", margin:"0 3px" }}>:</span>{pens.b}</span>
        </div>
      )}
    </div>
  );
}

// ─── KARTA MECZU (wspólna: historia + sezony) ─────────────────────────────────
function MatchCard({ entry, criteria, admin, onShots, onEdit }) {
  const tAN = entry.teamAName || "Drużyna A";
  const tBN = entry.teamBName || "Drużyna B";
  const [sA, sB] = (entry.score || "0:0").split(":").map(Number);
  const pens = entry.penalties;
  const showPens = pens && pens.a !== pens.b && sA === sB;
  const goals = entry.goals || [];
  const noSides = entry.participants.every(pp => pp.side == null);

  const Participant = (pp) => {
    const r = pp.rating;
    const pG = goals.filter(g => g.scorer===pp.id && g.type!=="ownGoal").length;
    const pOG = goals.filter(g => g.scorer===pp.id && g.type==="ownGoal").length;
    const pA = goals.filter(g => g.assist===pp.id).length;
    return (
      <div key={pp.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", borderBottom:"1px solid #221640" }}>
        <div style={{ fontSize:12, color:"#c9a8e0" }}>
          {pp.name}
          {pp.random && <span style={{ fontSize:9, color:"#475569", marginLeft:4 }}>spoza</span>}
          {pG>0 && <span style={{ fontSize:10, color:"#ffb088", marginLeft:4 }}>⚽{pG}</span>}
          {pOG>0 && <span style={{ fontSize:10, color:"#ef4444", marginLeft:4 }}>😬{pOG}</span>}
          {pA>0 && <span style={{ fontSize:10, color:"#5eead4", marginLeft:2 }}>🎯{pA}</span>}
        </div>
        <span style={{ fontSize:13, fontWeight:800, color:rc(r) }}>{r.toFixed(2)}</span>
      </div>
    );
  };

  return (
    <div style={{ background:"#150d2e", border:"1px solid #221640", borderRadius:12, padding:18, marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div>
          <div style={{ fontSize:11, color:"#334155", marginBottom:4 }}>{fmtPL(entry.date)}</div>
          <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{tAN} <span style={{ color:"#334155" }}>vs</span> {tBN}</div>
        </div>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:28, fontWeight:900, letterSpacing:-1 }}>
              <span style={{ color:"#ffb088" }}>{isNaN(sA)?0:sA}</span>
              <span style={{ color:"#334155", margin:"0 4px" }}>:</span>
              <span style={{ color:"#7ef5e5" }}>{isNaN(sB)?0:sB}</span>
            </div>
            {(entry.extraTime || showPens) && (
              <div style={{ fontSize:9, color:"#c9a8e0", marginTop:2 }}>
                {entry.extraTime && "po dogr."}{entry.extraTime && showPens && " · "}{showPens && `k. ${pens.a}:${pens.b}`}
              </div>
            )}
          </div>
          {admin && onEdit && (
            <button onClick={onEdit} title="Edytuj mecz"
              style={{ background:"rgba(255,107,53,.12)", border:"1px solid #ff6b35", borderRadius:7, color:"#ffb088", cursor:"pointer", fontSize:12, padding:"5px 8px", fontWeight:700 }}>
              ✏️
            </button>
          )}
        </div>
      </div>

      {noSides ? (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#64748b", marginBottom:5 }}>SKŁAD</div>
          {[...entry.participants].sort((a,b) => b.rating-a.rating).map(Participant)}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          {[{ side:"A", tN:tAN, ac:"#ffb088" },{ side:"B", tN:tBN, ac:"#7ef5e5" }].map(({ side, tN, ac }) => (
            <div key={side}>
              <div style={{ fontSize:10, fontWeight:700, color:ac, marginBottom:5 }}>{tN}</div>
              {entry.participants.filter(pp => pp.side===side).sort((a,b) => b.rating-a.rating).map(Participant)}
            </div>
          ))}
        </div>
      )}

      <MatchTimeline entry={entry} />

      <ShotMap shots={entry.shots} goals={{ teamAName:tAN, teamBName:tBN }} readOnly={!admin} onSave={onShots} />
    </div>
  );
}

// ─── ODZNAKI Z OSTATNIEGO ZAKOŃCZONEGO SEZONU ────────────────────────────────
function badgesFor(pid, lca) {
  if (!lca) return [];
  const a = lca.awards;
  const has = (arr) => arr && arr.some(p => p.id===pid);
  const out = [];
  if (a.potm && a.potm.id===pid) out.push(["👑","Piłkarz sezonu"]);
  if (has(a.scorer.winners)) out.push(["⚽","Król strzelców"]);
  if (has(a.assist.winners)) out.push(["👟","Król asyst"]);
  if (has(a.mvp.winners)) out.push(["🐐","Król średniej ocen (MVP)"]);
  if (has(a.growth.winners)) out.push(["⬆️⬆️⬆️","Największy wzrost wartości"]);
  return out;
}

// ─── NAGRODY: WIERSZ ──────────────────────────────────────────────────────────
function AwardLine({ icon, label, players, extra, color="#e2e8f0" }) {
  const names = (players && players.length) ? players.map(p => p.name).join(", ") : null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"1px solid #221640" }}>
      <span style={{ fontSize:18, width:26, textAlign:"center" }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:10, color:"#64748b" }}>{label}</div>
        <div style={{ fontSize:13, fontWeight:700, color:names?color:"#334155" }}>{names || "— brak —"}</div>
      </div>
      {names && extra && <div style={{ fontSize:12, fontWeight:800, color:"#ffb088", whiteSpace:"nowrap" }}>{extra}</div>}
    </div>
  );
}

// ─── KARTA SEZONU ─────────────────────────────────────────────────────────────
function SeasonCard({ season, players, criteria, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const a = computeSeasonAwards(season, players);
  const curIdx = seasonIndexOf(todayStr());
  const live = season.index===curIdx && !season.completed;
  const rangeTxt = season.start ? `${fmtPL(season.start)} – ${fmtPL(season.end)}` : `start projektu – ${fmtPL(season.end)}`;
  const rolledOver = season.completed && players.some(p => !p.random && (p.seasonEvents||[]).some(e => e.seasonIdx===season.index && e.type==="divide3"));

  const miniRank = (rows, fmt, unit) => (
    <div style={{ marginBottom:10 }}>
      {rows.slice(0,8).map((x,i) => (
        <div key={x.p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontWeight:800, fontSize:12, color:medalColor(i), width:18 }}>#{i+1}</span>
            <span style={{ fontSize:12, color:"#e2e8f0" }}>{x.p.name}</span>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:"#ffb088" }}>{fmt(x)} <span style={{ color:"#475569", fontWeight:400, fontSize:10 }}>{unit}</span></span>
        </div>
      ))}
      {rows.length===0 && <div style={{ fontSize:11, color:"#334155", fontStyle:"italic" }}>Brak danych</div>}
    </div>
  );

  return (
    <div style={{ background:"#150d2e", border:`1px solid ${live?"#ff6b35":"#221640"}`, borderRadius:12, padding:16, marginBottom:14 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:15, fontWeight:900, color:"#e2e8f0" }}>Sezon {season.index}</span>
            {live && <span style={{ fontSize:9, fontWeight:800, color:"#fff", background:"#ef4444", borderRadius:4, padding:"2px 6px" }}>● NA ŻYWO</span>}
            {!live && season.completed && <span style={{ fontSize:9, fontWeight:700, color:"#475569", border:"1px solid #3b1f5c", borderRadius:4, padding:"2px 6px" }}>zakończony</span>}
            {rolledOver && <span title="Wartości zostały podzielone przez 3, a premie za nagrody naliczone" style={{ fontSize:9, fontWeight:700, color:"#22c55e", border:"1px solid #166534", borderRadius:4, padding:"2px 6px" }}>✓ rozliczony (÷3 + premie)</span>}
          </div>
          <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{rangeTxt} · {season.matches.length} {season.matches.length===1?"mecz":"meczów"}</div>
        </div>
        <span style={{ fontSize:13, color:"#475569" }}>{open?"▲":"▼"}</span>
      </div>

      {/* Piłkarz sezonu */}
      <div style={{ marginTop:12, background:"linear-gradient(135deg,rgba(255,107,53,.12),rgba(224,40,157,.08))", border:"1px solid #7c2d12", borderRadius:10, padding:"12px 14px" }}>
        <div style={{ fontSize:10, color:"#ffb088", letterSpacing:.5, marginBottom:2 }}>👑 PIŁKARZ SEZONU {live?"(prowizorycznie)":""} <span style={{ color:"#22c55e", fontWeight:700 }}>· +{fv(SEASON_BONUSES.potm)}</span></div>
        {a.potm
          ? <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>{a.potm.name} <span style={{ fontSize:12, fontWeight:600, color:"#c9a8e0" }}>· {a.potmWins} {a.potmWins===1?"kategoria":"kategorie"}</span></div>
          : <div style={{ fontSize:14, color:"#94a3b8" }}>— jeszcze nikt nie zagrał —</div>}
      </div>

      {/* Zwycięzcy kategorii */}
      <div style={{ marginTop:12 }}>
        <AwardLine icon="⚽" label={`Król strzelców · +${fv(SEASON_BONUSES.scorer)}`} players={a.scorer.winners} extra={a.scorer.n>0?`${a.scorer.n} goli`:null} />
        <AwardLine icon="👟" label={`Król asyst · +${fv(SEASON_BONUSES.assist)}`} players={a.assist.winners} extra={a.assist.n>0?`${a.assist.n} asyst`:null} />
        <AwardLine icon="🐐" label="Król średniej (MVP)" players={a.mvp.winners} extra={a.mvp.avg!=null?`śr. ${a.mvp.avg.toFixed(2)}`:null} />
        <AwardLine icon="🚀" label={`Król bengerów · +${fv(SEASON_BONUSES.banger)}`} players={a.banger.winners} extra={a.banger.n>0?`${a.banger.n} szt.`:null} />
        <AwardLine icon="⬆️" label={`Największy wzrost wartości · +${fv(SEASON_BONUSES.growth)}`} players={a.growth.winners} extra={a.growth.g!=null&&a.growth.g>0?`+${fv(a.growth.g)}`:null} />
        <AwardLine icon="💎" label="Najwyższa wartość na koniec" players={a.topValue.winners} extra={a.topValue.v!=null?fv(a.topValue.v):null} />
      </div>

      {season.completed && !rolledOver && (
        <div style={{ marginTop:12, fontSize:10, color:"#94a3b8", background:"rgba(148,163,184,.08)", border:"1px solid #334155", borderRadius:8, padding:"8px 10px" }}>
          ⏳ Sezon zakończony — wartości (÷3) i premie zostaną naliczone automatycznie przy najbliższym wejściu administratora.
        </div>
      )}

      {/* Mecz sezonu */}
      {a.matchOfSeason && (
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#ffb088", letterSpacing:.5, marginBottom:8 }}>🏟️ MECZ SEZONU</div>
          <MatchCard entry={a.matchOfSeason} criteria={criteria} admin={false} onShots={() => {}} />
        </div>
      )}

      {open && (
        <div style={{ marginTop:8, paddingTop:12, borderTop:"1px solid #221640" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#ff6b35", marginBottom:8, letterSpacing:.5 }}>⚽ KLASYFIKACJA STRZELCÓW</div>
          {miniRank(a.ranks.scorers, x => x.n, "goli")}
          <div style={{ fontSize:11, fontWeight:700, color:"#14b8a6", marginBottom:8, letterSpacing:.5 }}>🎯 KLASYFIKACJA ASYST</div>
          {miniRank(a.ranks.assists, x => x.n, "asyst")}
          <div style={{ fontSize:11, fontWeight:700, color:"#fbbf24", marginBottom:8, letterSpacing:.5 }}>🐐 ŚREDNIA OCEN</div>
          {miniRank(a.ranks.mvp.filter(x => x.n>0), x => x.avg.toFixed(2), "śr.")}
          <div style={{ fontSize:11, fontWeight:700, color:"#22c55e", marginBottom:8, letterSpacing:.5 }}>📈 WARTOŚĆ NA KONIEC SEZONU</div>
          {miniRank(a.ranks.values, x => fv(x.v), "")}

          {season.matches.length>0 && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:"#c9a8e0", margin:"14px 0 8px", letterSpacing:.5 }}>📅 MECZE W SEZONIE</div>
              {[...season.matches].sort((m1,m2) => m2.date.localeCompare(m1.date)).map((e,i) => (
                <MatchCard key={i} entry={e} criteria={criteria} admin={false} onShots={() => {}} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SeasonsView({ players, criteria }) {
  const seasons = [...buildSeasons(players)].reverse(); // najnowszy u góry
  return (
    <div style={{ marginTop:20 }}>
      <div style={LABEL}>PIŁKARZE SEZONU · NAGRODY</div>
      <div style={{ background:"rgba(255,107,53,.08)", border:"1px solid #7c2d12", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:11, color:"#c9a8e0", lineHeight:1.5 }}>
        Sezony trwają <b style={{ color:"#ffb088" }}>od poniedziałku do niedzieli</b>. Pierwszy sezon kończy się w niedzielę <b style={{ color:"#ffb088" }}>{fmtPL(FIRST_SEASON_END)}</b> (uwaga: w zgłoszeniu padło „27.06", ale to sobota — najbliższa niedziela to 28.06). Po każdym sezonie wyłaniani są zwycięzcy kategorii, a najlepszy zawodnik zostaje <b style={{ color:"#ffb088" }}>Piłkarzem Sezonu</b>.
      </div>
      {seasons.map((s,i) => <SeasonCard key={s.index} season={s} players={players} criteria={criteria} defaultOpen={i===0} />)}
    </div>
  );
}

// ─── INFO / PRZEWODNIK ────────────────────────────────────────────────────────
function InfoView() {
  const H = ({ children }) => <div style={{ fontSize:14, fontWeight:800, color:"#ffb088", marginBottom:8 }}>{children}</div>;
  const P = ({ children }) => <p style={{ fontSize:12.5, color:"#c9a8e0", lineHeight:1.6, margin:"0 0 8px" }}>{children}</p>;
  const Li = ({ ico, children }) => (
    <div style={{ display:"flex", gap:8, marginBottom:6 }}>
      <span style={{ fontSize:14, width:22, textAlign:"center", flexShrink:0 }}>{ico}</span>
      <span style={{ fontSize:12.5, color:"#c9a8e0", lineHeight:1.5 }}>{children}</span>
    </div>
  );
  return (
    <div style={{ marginTop:20 }}>
      <div style={LABEL}>JAK TO DZIAŁA · PRZEWODNIK</div>

      <div style={CARD}>
        <H>👋 O aplikacji</H>
        <P>Wakacje FC to system oceniania zawodników po każdym meczu. Na podstawie ocen liczona jest <b style={{ color:"#ffb088" }}>wartość rynkowa</b> każdego gracza, a co tydzień rozgrywany jest osobny sezon z własnymi nagrodami.</P>
      </div>

      <div style={CARD}>
        <H>👁️ Tryby</H>
        <Li ico="👁️">Tryb <b style={{ color:"#ffb088" }}>Widz</b> — podgląd rankingu, historii, statystyk i sezonów. Bez hasła, bez edycji.</Li>
        <Li ico="🛠️">Tryb <b style={{ color:"#ffb088" }}>Administrator</b> — pełny dostęp: dodawanie meczów, opinii, edycja kryteriów. Wymaga hasła.</Li>
        <Li ico="🔄">Tryb zmienisz w każdej chwili przyciskiem <b>„Zmień tryb"</b> na górze.</Li>
      </div>

      <div style={CARD}>
        <H>⭐ Oceny i wartość</H>
        <Li ico="🎯">Każdy zawodnik startuje od bazowej oceny <b style={{ color:"#ffb088" }}>{BASE_RATING}</b>. Plusy i minusy z kryteriów podnoszą lub obniżają ocenę (od 1 do 10).</Li>
        <Li ico="💰">Wartość rośnie po dobrych meczach i spada po słabych. Im niższa wartość zawodnika, tym większe wahania procentowe.</Li>
        <Li ico="🔥">Seria dobrych występów daje <b style={{ color:"#ffb088" }}>bonus formy +30%</b> do wartości (próg zależy od poziomu zawodnika).</Li>
        <Li ico="💬">Opinie klasy (👍/👎) lekko korygują wartość.</Li>
      </div>

      <div style={CARD}>
        <H>🗓️ Sezony</H>
        <Li ico="📆">Sezon trwa <b style={{ color:"#ffb088" }}>od poniedziałku do niedzieli</b>.</Li>
        <Li ico="1️⃣">Pierwszy sezon: od startu projektu do niedzieli <b style={{ color:"#ffb088" }}>{fmtPL(FIRST_SEASON_END)}</b>. (W zgłoszeniu padło „27.06", lecz to sobota — przyjęto najbliższą niedzielę, 28.06, żeby każdy sezon był pełnym tygodniem.)</Li>
        <Li ico="⏭️">Kolejne sezony to kolejne pełne tygodnie (pon–nd).</Li>
      </div>

      <div style={CARD}>
        <H>🏆 Nagrody na koniec sezonu</H>
        <Li ico="⚽">👑 <b>Król strzelców</b> — najwięcej goli.</Li>
        <Li ico="👟"><b>Król asyst</b> — najwięcej asyst.</Li>
        <Li ico="🐐"><b>Król MVP</b> — najwyższa średnia ocen w sezonie.</Li>
        <Li ico="🚀"><b>Król bengerów</b> — najwięcej goli z dystansu (bengery/screamery).</Li>
        <Li ico="⬆️"><b>Największy przyrost wartości</b> — kto zyskał najwięcej w sezonie.</Li>
        <Li ico="💎"><b>Najwyższa wartość na koniec</b> — najdroższy gracz na zakończenie sezonu.</Li>
        <Li ico="👑"><b>Piłkarz Sezonu</b> — zawodnik z największą liczbą wygranych kategorii. Remis rozstrzyga wyższa średnia ocen w sezonie.</Li>
        <Li ico="🏟️"><b>Mecz Sezonu</b> — spotkanie z najwyższą sumą ocen wszystkich graczy i liczbą goli.</Li>
      </div>

      <div style={CARD}>
        <H>🎖️ Odznaki przy rankingu</H>
        <P>Przy nazwiskach w rankingu pojawiają się odznaki zdobyte w <b style={{ color:"#ffb088" }}>ostatnim zakończonym sezonie</b>:</P>
        <Li ico="👑">Piłkarz Sezonu</Li>
        <Li ico="⚽">Król strzelców</Li>
        <Li ico="👟">Król asyst</Li>
        <Li ico="🐐">Król MVP (średnia)</Li>
        <Li ico="⬆️">Największy przyrost wartości (potrójna zielona strzałka)</Li>
      </div>

      <div style={CARD}>
        <H>🧩 Zawodnicy spoza klasy</H>
        <P>Random 1–4 możesz dodać do meczu i ocenić tak jak każdego. <b style={{ color:"#ffb088" }}>Nie liczą się</b> jednak do rankingu wartości, statystyk ani nagród sezonu — służą tylko do skompletowania składów.</P>
      </div>

      <div style={CARD}>
        <H>⏱️ Przebieg meczu</H>
        <Li ico="🕐">Mecz to <b style={{ color:"#ffb088" }}>dwie połowy po {HALF_MIN} minut</b>. Przy golu możesz podać minutę i czas doliczony (np. 15+2).</Li>
        <Li ico="🟰">Przy golach widać podział na 1. połowę, przerwę z wynikiem do przerwy, 2. połowę oraz ewentualną dogrywkę.</Li>
        <Li ico="🫵"><b>Rzuty karne</b> rozstrzygają zwycięzcę tylko przy remisie po regulaminowym czasie.</Li>
      </div>
    </div>
  );
}

// ─── WYKRES LINIOWY (SVG, bez bibliotek) ──────────────────────────────────────
function LineChart({ lines, bands, yFormat = (v) => String(v), height = 210 }) {
  const W = 620, H = height, padL = 60, padR = 16, padT = 16, padB = 30;
  const all = (lines || []).flatMap(l => l.pts || []);
  if (all.length < 1) return <div style={{ fontSize:12, color:"#475569", padding:"24px 0", textAlign:"center" }}>Brak danych do wykresu</div>;
  const xs = all.map(p => p.x), ys = all.map(p => p.y);
  let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  if (minX === maxX) maxX = minX + 1;
  if (minY === maxY) { minY = minY - 1; maxY = maxY + 1; }
  const yr = maxY - minY; minY -= yr * 0.08; maxY += yr * 0.08;
  const sx = (x) => padL + ((x - minX) / (maxX - minX)) * (W - padL - padR);
  const sy = (y) => padT + (1 - ((y - minY) / (maxY - minY))) * (H - padT - padB);
  const ticks = [0, 1, 2, 3, 4].map(k => minY + (k / 4) * (maxY - minY));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", display:"block" }}>
      {(bands || []).map((b, i) => (
        <rect key={"b" + i} x={sx(b.x0)} y={padT} width={Math.max(0, sx(b.x1) - sx(b.x0))} height={H - padT - padB} fill={b.color} opacity="0.13" />
      ))}
      {ticks.map((t, i) => (
        <g key={"t" + i}>
          <line x1={padL} x2={W - padR} y1={sy(t)} y2={sy(t)} stroke="#221640" strokeWidth="1" />
          <text x={padL - 7} y={sy(t) + 3} textAnchor="end" fontSize="10" fill="#64748b">{yFormat(t)}</text>
        </g>
      ))}
      {(lines || []).map((l, li) => {
        const pts = l.pts || [];
        if (pts.length < 2) return pts.map((p, i) => <circle key={"p" + li + "-" + i} cx={sx(p.x)} cy={sy(p.y)} r="3.5" fill={l.color} />);
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
        return (
          <g key={"l" + li}>
            <path d={d} fill="none" stroke={l.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="2.2" fill={l.color} />)}
          </g>
        );
      })}
      <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="#3b1f5c" strokeWidth="1" />
      <text x={padL} y={H - padB + 16} textAnchor="start" fontSize="10" fill="#475569">mecz {Math.round(minX)}</text>
      <text x={W - padR} y={H - padB + 16} textAnchor="end" fontSize="10" fill="#475569">mecz {Math.round(maxX)}</text>
    </svg>
  );
}

// kolorowe przedziały sezonów wzdłuż osi X
function seasonBands(pts) {
  const g = [];
  pts.forEach(p => { const last = g[g.length - 1]; if (last && last.season === p.season) last.i1 = p.x; else g.push({ season: p.season, i0: p.x, i1: p.x }); });
  return g.map((grp, k) => ({
    x0: k === 0 ? grp.i0 - 0.3 : (g[k - 1].i1 + grp.i0) / 2,
    x1: k === g.length - 1 ? grp.i1 + 0.3 : (grp.i1 + g[k + 1].i0) / 2,
    color: seasonColor(grp.season), season: grp.season,
  }));
}

function PlayerValueChart({ player }) {
  if (!player.matches || player.matches.length === 0) {
    return <div style={{ fontSize:12, color:"#475569", textAlign:"center", padding:"18px 0" }}>Brak meczów — wykres pojawi się po pierwszym meczu.</div>;
  }
  const pts = valueSeries(player);
  const bands = seasonBands(pts);
  const seasonsShown = [...new Set(pts.map(p => p.season))].sort((a, b) => a - b);
  return (
    <div>
      <LineChart lines={[{ name: player.name, color: "#ff6b35", pts }]} bands={bands} yFormat={(v) => fv(v)} />
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:6, justifyContent:"center" }}>
        {seasonsShown.map(s => (
          <span key={s} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:"#94a3b8" }}>
            <span style={{ width:10, height:10, borderRadius:2, background:seasonColor(s), opacity:.7, display:"inline-block" }} />
            Sezon {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── PORÓWNANIE ZAWODNIKÓW ────────────────────────────────────────────────────
const COMPARE_METRICS = [
  { id:"value",   label:"Wycena",       fmt:(v) => fv(v) },
  { id:"avg",     label:"Średnia ocen", fmt:(v) => v.toFixed(2) },
  { id:"goals",   label:"Gole",         fmt:(v) => String(Math.round(v)) },
  { id:"assists", label:"Asysty",       fmt:(v) => String(Math.round(v)) },
  { id:"bangers", label:"Bengery",      fmt:(v) => String(Math.round(v)) },
  { id:"rating",  label:"Ocena/mecz",   fmt:(v) => v.toFixed(2) },
];

function CompareView({ players }) {
  const real = players.filter(p => !p.random);
  const [a, setA] = useState(real[0]?.id || "");
  const [b, setB] = useState(real[1]?.id || "");
  const [metric, setMetric] = useState("value");
  const pa = players.find(p => p.id === a);
  const pb = players.find(p => p.id === b);
  const m = COMPARE_METRICS.find(x => x.id === metric) || COMPARE_METRICS[0];
  const lines = [];
  if (pa) lines.push({ name: pa.name, color: "#ff6b35", pts: metricSeries(pa, metric) });
  if (pb) lines.push({ name: pb.name, color: "#00d9c0", pts: metricSeries(pb, metric) });
  const note = metric === "value" ? "Wartość liczona narastająco z całej historii."
    : metric === "avg" ? "Średnia ocen narastająco po kolejnych meczach."
    : metric === "rating" ? "Ocena z każdego pojedynczego meczu."
    : "Statystyka sumowana narastająco.";
  return (
    <div style={{ marginTop:20 }}>
      <div style={LABEL}>PORÓWNANIE ZAWODNIKÓW</div>
      <div style={CARD}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:10, color:"#ffb088", fontWeight:700, marginBottom:4 }}>● Zawodnik A</div>
            <select value={a} onChange={e => setA(e.target.value)} style={{ ...INP, borderColor:"#7c2d12" }}>
              <option value="">— wybierz —</option>
              {real.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:"#7ef5e5", fontWeight:700, marginBottom:4 }}>● Zawodnik B</div>
            <select value={b} onChange={e => setB(e.target.value)} style={{ ...INP, borderColor:"#0e7490" }}>
              <option value="">— wybierz —</option>
              {real.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
          {COMPARE_METRICS.map(mm => (
            <button key={mm.id} onClick={() => setMetric(mm.id)}
              style={{ padding:"5px 11px", borderRadius:6, border:`1px solid ${metric===mm.id?"#ff6b35":"#3b1f5c"}`, background:metric===mm.id?"rgba(255,107,53,.2)":"transparent", color:metric===mm.id?"#ffb088":"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {mm.label}
            </button>
          ))}
        </div>
        {(pa || pb)
          ? <LineChart lines={lines} yFormat={m.fmt} height={250} />
          : <div style={{ fontSize:12, color:"#475569", textAlign:"center", padding:"24px 0" }}>Wybierz zawodników, żeby porównać wykresy.</div>}
        <div style={{ display:"flex", justifyContent:"center", gap:18, marginTop:8, flexWrap:"wrap" }}>
          {pa && <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#e2e8f0" }}><span style={{ width:11, height:11, borderRadius:3, background:"#ff6b35" }} />{pa.name}</span>}
          {pb && <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#e2e8f0" }}><span style={{ width:11, height:11, borderRadius:3, background:"#00d9c0" }} />{pb.name}</span>}
        </div>
        <div style={{ fontSize:10, color:"#475569", textAlign:"center", marginTop:8 }}>Oś X = kolejne mecze danego zawodnika. {note}</div>
      </div>
    </div>
  );
}

// ─── GŁÓWNA APLIKACJA ─────────────────────────────────────────────────────────
function MainApp({ readOnly, onExit }) {
  const [players, setPlayers] = useState(() => normalizePlayers(DEFAULT_PLAYERS));
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [view, setView] = useState("ranking");
  const [selP, setSelP] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [wiz, setWiz] = useState(EMPTY_WIZ());
  const [opForm, setOpForm] = useState({ playerId:"", text:"", sentiment:"neutral" });
  const [toast, setToast] = useState(null);
  const [editCrit, setEditCrit] = useState(null);
  const [newCrit, setNewCrit] = useState({ label:"", desc:"", points:"0.20", cat:"pos" });
  const [lastSync, setLastSync] = useState(null);
  const lastTs = useRef(null);

  function showToast(msg, col="#ff6b35") { setToast({ msg, col }); setTimeout(() => setToast(null), 2800); }

  async function saveToStorage(p, c) {
    try {
      const ts = Date.now();
      const jsonStr = JSON.stringify({ players:p, criteria:c, ts });
      const sizeKB = (jsonStr.length/1024).toFixed(1);
      const res = await fetch("/api/data", { method:"POST", headers:{ "Content-Type":"application/json" }, body:jsonStr });
      if (!res.ok) { const t = await res.text().catch(() => ""); showToast(`⚠️ Błąd zapisu (${res.status}): ${t.slice(0,80)}`, "#ef4444"); return; }
      lastTs.current = ts;
      setLastSync(new Date(ts).toLocaleTimeString("pl-PL"));
      showToast(`💾 Zapisano! (${sizeKB}KB)`);
    } catch (e) {
      showToast("⚠️ " + (e?.message || "nieznany błąd"), "#ef4444");
    }
  }

  async function loadFromStorage() {
    try {
      const res = await fetch("/api/data");
      if (!res.ok) return;
      const data = await res.json();
      if (data?.players) {
        const loaded = normalizePlayers(data.players);
        const rolled = applySeasonRolloverIfNeeded(loaded);
        setPlayers(rolled);
        // Jeśli rollover coś naliczył i jesteśmy adminem, od razu zapisz wynik na serwer,
        // żeby inni uczestnicy (i kolejne odświeżenia) zobaczyli już przeliczone wartości.
        if (rolled !== loaded && !readOnly) {
          saveToStorage(rolled, data.criteria || criteria);
        }
      }
      if (data?.criteria) setCriteria(data.criteria);
      if (data?.ts) { lastTs.current = data.ts; setLastSync(new Date(data.ts).toLocaleTimeString("pl-PL")); }
    } catch (e) { /* offline ok */ }
  }

  useEffect(() => {
    loadFromStorage();
    const interval = setInterval(loadFromStorage, 5000);
    return () => clearInterval(interval);
  }, []);

  // zapis = ustaw stan + wyślij na serwer (tylko admin wywołuje mutacje)
  function commit(nextPlayers, nextCriteria) {
    const np = nextPlayers !== undefined ? nextPlayers : players;
    const nc = nextCriteria !== undefined ? nextCriteria : criteria;
    setPlayers(np); setCriteria(nc);
    saveToStorage(np, nc);
  }

  function submitMatchWizard() {
    const { date, teamAName, teamBName, teamA, teamB, goals, ratings, extraTime, pensOn, pensA, pensB, editingKey } = wiz;
    const sA = goals.filter(g => g.teamSide==="A").length;
    const sB = goals.filter(g => g.teamSide==="B").length;
    const score = `${sA}:${sB}`;
    const pens = pensOn ? { a:parseInt(pensA)||0, b:parseInt(pensB)||0 } : null;
    const et = extraTime || goals.some(g => g.phase==="ET");
    const resFor = (side) => {
      if (sA !== sB) return side==="A" ? (sA>sB?"Wygrana":"Przegrana") : (sB>sA?"Wygrana":"Przegrana");
      if (pens && pens.a !== pens.b) { const aWin = pens.a>pens.b; return side==="A" ? (aWin?"Wygrana":"Przegrana") : (aWin?"Przegrana":"Wygrana"); }
      return "Remis";
    };
    const mid = Date.now();
    const isEdit = !!editingKey;
    const next = players.map(p => {
      const inA = teamA.includes(p.id), inB = teamB.includes(p.id);
      // przy edycji: najpierw usuń stary wpis tego meczu u każdego zawodnika (jeśli grał poprzednio)
      const baseMatches = isEdit ? p.matches.filter(m => matchKeyOf(m) !== editingKey) : p.matches;
      if (!inA && !inB) return isEdit ? { ...p, matches: baseMatches } : p;
      const side = inA ? "A" : "B";
      const opp = side==="A" ? (teamBName||"Drużyna B") : (teamAName||"Drużyna A");
      const r = ratings[p.id] || { criteria:{}, note:"" };
      const crit = { ...r.criteria };
      goals.forEach(g => applyGoalToCriteria(crit, g, p.id));
      const rating = calcMatchRating(crit, criteria);
      const myGoals = goals.filter(g => g.scorer===p.id || g.assist===p.id);
      return { ...p, matches:[ ...baseMatches, {
        id: mid+Math.random(), date, opponent:opp, score, result:resFor(side), rating, criteria:crit, note:r.note,
        goals: myGoals, teamA, teamB, teamAName, teamBName, shots:null, extraTime:et, penalties:pens,
      } ] };
    });
    commit(next);
    showToast(isEdit ? `✅ Mecz zaktualizowany! ${sA}:${sB}` : `✅ Mecz zapisany! ${sA}:${sB}`);
    setWiz(EMPTY_WIZ());
    setView(isEdit ? "history" : "ranking");
  }

  // ładuje istniejący mecz z powrotem do kreatora, do edycji
  function startEditMatch(entry) {
    const teamA = entry.teamA || [];
    const teamB = entry.teamB || [];
    const ratings = {};
    entry.participants.forEach(pp => {
      ratings[pp.id] = { criteria: { ...(pp.criteria || {}) }, note: pp.match?.note || "" };
    });
    // usuń z kryteriów wkład samych goli/asyst, bo applyGoalToCriteria doda je z powrotem na podstawie `goals`
    const stripGoalContrib = (crit, id) => {
      const c = { ...crit };
      (entry.goals || []).forEach(g => {
        if (g.scorer === id) {
          if (g.type === "ownGoal") c.own_goal = Math.max(0, parseInt(c.own_goal || 0) - 1);
          else if (g.type === "screamer") c.screamer = Math.max(0, parseInt(c.screamer || 0) - 1);
          else if (g.type === "freekick") c.freekick = Math.max(0, parseInt(c.freekick || 0) - 1);
          else if (g.type === "header") c.header = Math.max(0, parseInt(c.header || 0) - 1);
          else c.goal = Math.max(0, parseInt(c.goal || 0) - 1);
        }
        if (g.assist === id) c.assist = Math.max(0, parseInt(c.assist || 0) - 1);
      });
      return c;
    };
    Object.keys(ratings).forEach(id => { ratings[id].criteria = stripGoalContrib(ratings[id].criteria, id); });

    setWiz({
      step: "1",
      date: entry.date,
      teamAName: entry.teamAName || "",
      teamBName: entry.teamBName || "",
      teamA, teamB,
      goals: (entry.goals || []).map(g => ({ ...g, id: g.id != null ? g.id : (Date.now() + Math.random()) })),
      ratings,
      activeP: null,
      extraTime: !!entry.extraTime,
      pensOn: !!(entry.penalties && (entry.penalties.a || entry.penalties.b)),
      pensA: entry.penalties ? String(entry.penalties.a ?? "") : "",
      pensB: entry.penalties ? String(entry.penalties.b ?? "") : "",
      editingKey: entry.key,
    });
    setView("add");
  }

  function setMatchShots(key, shots) {
    const next = players.map(p => ({ ...p, matches:(p.matches||[]).map(m => matchKeyOf(m)===key ? { ...m, shots } : m) }));
    commit(next);
  }

  function addOpinion() {
    if (!opForm.playerId || !opForm.text.trim()) return;
    const next = players.map(p => p.id!==opForm.playerId ? p : { ...p, opinions:[ ...(p.opinions||[]), { date:todayStr(), text:opForm.text, sentiment:opForm.sentiment } ] });
    commit(next);
    showToast("💬 Opinia dodana!");
    setOpForm({ playerId:"", text:"", sentiment:"neutral" });
  }

  // dane pochodne
  const ranked = players.filter(p => !p.random).sort((a,b) => calcValue(b)-calcValue(a));
  const lca = getLastCompletedSeasonAwards(players);
  const matches = getMatches(players);

  const navItems = readOnly
    ? [["ranking","🏆"],["history","📅"],["stats","📊"],["compare","⚖️"],["seasons","👑"],["criteria","📋"],["info","ℹ️"]]
    : [["ranking","🏆"],["history","📅"],["stats","📊"],["compare","⚖️"],["seasons","👑"],["add","➕"],["opinions","💬"],["criteria","📋"],["editor","⚙️"],["info","ℹ️"]];

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#e2e8f0", fontFamily:"'Inter',system-ui,sans-serif", paddingBottom:80 }}>
      {/* TOP BAR */}
      <div style={{ background:"#150d2e", borderBottom:"1px solid #221640", padding:"12px 20px" }}>
        <div style={{ maxWidth:720, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:18, fontWeight:900, letterSpacing:-0.5, background:"linear-gradient(135deg,#ff6b35,#ffb088 40%,#00d9c0)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              🔥 WAKACJE FC
            </div>
            <div style={{ fontSize:10, color:"#334155" }}>sync: {lastSync||"—"}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:10, fontWeight:700, color:readOnly?"#7ef5e5":"#ffb088", border:`1px solid ${readOnly?"#0e7490":"#7c2d12"}`, borderRadius:6, padding:"4px 9px" }}>
              {readOnly?"👁️ Widz":"🛠️ Admin"}
            </span>
            {!readOnly && (
              <button onClick={() => saveToStorage(players, criteria)} style={{ background:"linear-gradient(135deg,#ff6b35,#e0289d)", border:"none", borderRadius:8, color:"#fff", padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                💾 Zapisz
              </button>
            )}
            <button onClick={onExit} style={{ background:"transparent", border:"1px solid #3b1f5c", borderRadius:8, color:"#94a3b8", padding:"8px 10px", fontSize:11, fontWeight:600, cursor:"pointer" }}>
              Zmień tryb
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"0 16px" }}>
        {toast && <div style={{ background:toast.col, borderRadius:8, padding:"10px 16px", marginTop:14, fontSize:13, fontWeight:600 }}>{toast.msg}</div>}

        {/* RANKING */}
        {view==="ranking" && (
          <div style={{ marginTop:20 }}>
            <div style={LABEL}>TABELA WARTOŚCI RYNKOWYCH</div>
            {lca && (
              <div style={{ fontSize:10, color:"#64748b", marginBottom:10 }}>Odznaki z sezonu {lca.season.index} ({fmtPL(lca.season.end)})</div>
            )}
            {ranked.map((p,i) => {
              const avg = getAvgRating(p.matches), val = calcValue(p), trend = getTrend(p.matches), chg = val-p.value;
              const formBonus = checkFormBonus(p);
              const badges = badgesFor(p.id, lca);
              const isOpen = expanded === p.id;
              return (
                <div key={p.id} style={{ marginBottom:8 }}>
                  <div onClick={() => setExpanded(isOpen ? null : p.id)}
                    style={{ background:"#150d2e", border:`1px solid ${isOpen?"#ff6b35":"#221640"}`, borderRadius: isOpen?"10px 10px 0 0":10, padding:"13px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:26, textAlign:"center", fontWeight:900, fontSize:15, color:i<3?["#fbbf24","#c9a8e0","#b45309"][i]:"#3b1f5c" }}>#{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:"#e2e8f0", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span>{p.name} <span style={{ fontSize:11, color:"#334155", fontWeight:400 }}>· {p.position}</span></span>
                        {badges.map(([emoji, title], bi) => <span key={bi} title={title} style={{ fontSize:13 }}>{emoji}</span>)}
                        {formBonus && <span style={{ fontSize:9, background:"rgba(251,191,36,.2)", border:"1px solid #fbbf24", color:"#fbbf24", borderRadius:3, padding:"1px 5px" }}>🔥 FORMA +30%</span>}
                        {val>=TOP_TIER_FLOOR && <span title={`Blisko limitu ${fv(MAX_VALUE)} — wymagana ocena ≥${TOP_TIER_MIN_RATING.toFixed(1)}, inaczej spadek x4`} style={{ fontSize:9, background:"rgba(239,68,68,.18)", border:"1px solid #ef4444", color:"#fca5a5", borderRadius:3, padding:"1px 5px" }}>⚠️ TOP · ≥{TOP_TIER_MIN_RATING.toFixed(1)}</span>}
                      </div>
                      <div style={{ fontSize:11, color:"#334155", marginTop:1 }}>{p.matches.length} meczów · kliknij po wykres</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:22, fontWeight:900, color:avg?rc(avg):"#3b1f5c", lineHeight:1 }}>
                        {avg?avg.toFixed(2):"—"}
                        <span style={{ fontSize:11, marginLeft:3, color:trend==="▲"?"#22c55e":trend==="▼"?"#ef4444":"#334155" }}>{trend}</span>
                      </div>
                      <div style={{ fontSize:10, color:"#334155", marginBottom:2 }}>śr. ocena</div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{fv(val)}</div>
                      <div style={{ fontSize:10, color:chg>=0?"#22c55e":"#ef4444" }}>{chg>=0?"+":""}{fv(Math.abs(chg))}</div>
                    </div>
                    <div style={{ width:12, textAlign:"center", color:isOpen?"#ff6b35":"#475569", fontSize:11 }}>{isOpen?"▲":"▼"}</div>
                  </div>
                  {isOpen && (
                    <div style={{ background:"#0c0a1d", border:"1px solid #ff6b35", borderTop:"none", borderRadius:"0 0 10px 10px", padding:"14px 14px 12px" }}>
                      <div style={{ fontSize:10, color:"#64748b", marginBottom:8, letterSpacing:.5 }}>📈 WYKRES WYCENY · CAŁA HISTORIA</div>
                      <PlayerValueChart player={p} />
                      <button onClick={(e) => { e.stopPropagation(); setSelP(p.id); setView("player"); }}
                        style={{ width:"100%", marginTop:10, padding:"9px", background:"transparent", border:"1px solid #3b1f5c", borderRadius:8, color:"#ffb088", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        Pełna karta zawodnika →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* HISTORIA */}
        {view==="history" && (
          matches.length===0
            ? <div style={{ marginTop:30, textAlign:"center", color:"#334155", fontSize:13 }}>Brak meczów w historii</div>
            : (
              <div style={{ marginTop:20 }}>
                <div style={LABEL}>HISTORIA MECZÓW</div>
                {[...matches].sort((a,b) => b.date.localeCompare(a.date)).map((e,i) => (
                  <MatchCard key={i} entry={e} criteria={criteria} admin={!readOnly} onShots={(s) => setMatchShots(e.key, s)} onEdit={!readOnly ? () => startEditMatch(e) : null} />
                ))}
              </div>
            )
        )}

        {/* STATYSTYKI (bez zawodników spoza klasy) */}
        {view==="stats" && (() => {
          const real = players.filter(p => !p.random);
          const sumC = (player, ...ids) => (player.matches||[]).reduce((t,m) => t + ids.reduce((s,id) => s + parseInt((m.criteria||{})[id]||0), 0), 0);
          const boards = [
            { title:"Strzelcy", emoji:"⚽", col:"#ff6b35", unit:"goli", data:real.map(p => ({ name:p.name, pos:p.position, n:sumC(p,"goal","header","freekick","screamer") })).sort((a,b) => b.n-a.n).filter(x => x.n>0) },
            { title:"Asystenci", emoji:"🎯", col:"#14b8a6", unit:"asyst", data:real.map(p => ({ name:p.name, pos:p.position, n:sumC(p,"assist") })).sort((a,b) => b.n-a.n).filter(x => x.n>0) },
            { title:"Bengery", emoji:"🚀", col:"#f97316", unit:"szt.", data:real.map(p => ({ name:p.name, pos:p.position, n:sumC(p,"screamer") })).sort((a,b) => b.n-a.n).filter(x => x.n>0) },
            { title:"Siatkówki", emoji:"🍑", col:"#a855f7", unit:"szt.", data:real.map(p => ({ name:p.name, pos:p.position, n:sumC(p,"nutmeg") })).sort((a,b) => b.n-a.n).filter(x => x.n>0) },
          ];
          return (
            <div style={{ marginTop:20 }}>
              <div style={LABEL}>STATYSTYKI (bez zawodników spoza klasy)</div>
              {boards.map(b => (
                <div key={b.title} style={CARD}>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:12, color:"#e2e8f0" }}>{b.emoji} {b.title}</div>
                  {b.data.length===0 ? <div style={{ fontSize:12, color:"#334155", fontStyle:"italic" }}>Brak danych</div>
                    : b.data.map((row,i) => {
                      const pct = b.data[0].n>0 ? (row.n/b.data[0].n)*100 : 0;
                      return (
                        <div key={row.name} style={{ marginBottom:8 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                              <span style={{ fontWeight:800, fontSize:13, color:medalColor(i), width:20 }}>#{i+1}</span>
                              <span style={{ fontWeight:700, fontSize:13, color:"#e2e8f0" }}>{row.name}</span>
                              <span style={{ fontSize:11, color:"#334155" }}>{row.pos}</span>
                            </div>
                            <span style={{ fontWeight:900, fontSize:15, color:b.col }}>{row.n} <span style={{ fontSize:11, color:"#475569", fontWeight:400 }}>{b.unit}</span></span>
                          </div>
                          <div style={{ height:5, background:"#221640", borderRadius:3, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:b.col, borderRadius:3 }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
              <div style={{ fontSize:11, color:"#334155", marginBottom:10, letterSpacing:.5 }}>KARTY ZAWODNIKÓW</div>
              {real.filter(p => p.matches.length>0).sort((a,b) => sumC(b,"goal","screamer","freekick","header")-sumC(a,"goal","screamer","freekick","header")).map(p => {
                const avg = getAvgRating(p.matches);
                const stats = [["⚽",sumC(p,"goal","header","freekick","screamer"),"Gole","#ff6b35"],["🎯",sumC(p,"assist"),"Asysty","#14b8a6"],["🚀",sumC(p,"screamer"),"Bengery","#f97316"],["🍑",sumC(p,"nutmeg"),"Siatk.","#a855f7"],["🔥",sumC(p,"clutch"),"Clutch","#fbbf24"],["🤦",sumC(p,"miss","penalty_miss"),"Pudła","#ef4444"],["😬",sumC(p,"own_goal"),"Samob.","#b91c1c"],["💀",sumC(p,"lost_ball_danger"),"Straty","#ef4444"]];
                return (
                  <div key={p.id} style={{ background:"#150d2e", border:"1px solid #221640", borderRadius:10, padding:"13px 14px", marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div><span style={{ fontWeight:800, fontSize:14, color:"#e2e8f0" }}>{p.name}</span><span style={{ fontSize:11, color:"#334155", marginLeft:6 }}>{p.position} · {p.matches.length}M</span></div>
                      <span style={{ fontSize:18, fontWeight:900, color:avg?rc(avg):"#3b1f5c" }}>{avg?avg.toFixed(2):"—"}</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                      {stats.map(([ico,val,label,col]) => (
                        <div key={label} style={{ background:"#0c0a1d", borderRadius:7, padding:"7px 8px", textAlign:"center" }}>
                          <div style={{ fontSize:14 }}>{ico}</div>
                          <div style={{ fontWeight:900, fontSize:17, color:val>0?col:"#3b1f5c", lineHeight:1.1 }}>{val}</div>
                          <div style={{ fontSize:9, color:"#334155", marginTop:2 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* SEZONY */}
        {view==="seasons" && <SeasonsView players={players} criteria={criteria} />}

        {/* PORÓWNANIE */}
        {view==="compare" && <CompareView players={players} />}

        {/* INFO */}
        {view==="info" && <InfoView />}

        {/* DODAJ MECZ (admin) */}
        {view==="add" && !readOnly && (
          <div>
            {wiz.editingKey && (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16 }}>
                <div style={LABEL}>EDYCJA MECZU</div>
                <button onClick={() => { setWiz(EMPTY_WIZ()); setView("history"); }}
                  style={{ background:"transparent", border:"1px solid #3b1f5c", borderRadius:7, color:"#64748b", fontSize:11, padding:"5px 10px", cursor:"pointer" }}>
                  ✕ Anuluj edycję
                </button>
              </div>
            )}
            <MatchWizard wiz={wiz} setWiz={setWiz} players={players} criteria={criteria} onSubmit={submitMatchWizard} />
          </div>
        )}

        {/* OPINIE (admin) */}
        {view==="opinions" && !readOnly && (
          <div style={{ marginTop:20 }}>
            <div style={LABEL}>OPINIE KLASY</div>
            <div style={{ ...CARD, padding:20 }}>
              <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>Zawodnik</label>
              <select value={opForm.playerId} onChange={e => setOpForm(f => ({ ...f, playerId:e.target.value }))} style={{ ...INP, marginBottom:12 }}>
                <option value="">— wybierz —</option>
                {PLAYERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                {[["positive","👍","#22c55e"],["neutral","😐","#64748b"],["negative","👎","#ef4444"]].map(([s,e,c]) => (
                  <button key={s} onClick={() => setOpForm(f => ({ ...f, sentiment:s }))}
                    style={{ flex:1, padding:"8px", borderRadius:6, border:`1px solid ${opForm.sentiment===s?c:"#3b1f5c"}`, background:opForm.sentiment===s?c+"22":"transparent", color:opForm.sentiment===s?c:"#475569", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    {e}
                  </button>
                ))}
              </div>
              <textarea value={opForm.text} onChange={e => setOpForm(f => ({ ...f, text:e.target.value }))} placeholder="Co klasa uważa?" rows={3} style={{ ...INP, resize:"vertical", marginBottom:12 }} />
              <button onClick={addOpinion} style={{ width:"100%", padding:"11px", background:"#ff6b35", border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Dodaj opinię</button>
            </div>
          </div>
        )}

        {/* KRYTERIA (wszyscy) */}
        {view==="criteria" && (
          <div style={{ marginTop:20 }}>
            <div style={LABEL}>KRYTERIA OCENIANIA · start: {BASE_RATING}</div>
            {["pos","gk_pos","neg","gk_neg"].map(cat => (
              <div key={cat} style={{ marginBottom:18 }}>
                <div style={{ fontSize:10, fontWeight:700, color:cat.includes("neg")?"#ef4444":"#ff6b35", marginBottom:8, letterSpacing:.8, textTransform:"uppercase" }}>{CAT_LABELS[cat]}</div>
                {criteria.filter(c => c.cat===cat).map(c => (
                  <div key={c.id} style={{ background:"#150d2e", border:"1px solid #221640", borderRadius:7, padding:"10px 13px", marginBottom:5, display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ fontSize:18, width:26 }}>{c.label.split(" ")[0]}</div>
                    <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:12, color:"#e8d5f5" }}>{c.label.split(" ").slice(1).join(" ")}</div><div style={{ fontSize:10, color:"#334155", marginTop:1 }}>{c.desc}</div></div>
                    <div style={{ fontWeight:800, fontSize:14, color:c.points>0?"#ff6b35":"#ef4444" }}>{c.points>0?"+":""}{c.points}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* EDYTOR (admin) */}
        {view==="editor" && !readOnly && (
          <div style={{ marginTop:20 }}>
            <div style={LABEL}>EDYTOR KRYTERIÓW</div>
            <div style={{ background:"#150d2e", border:"1px solid #ff6b35", borderRadius:12, padding:18, marginBottom:18 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#ffb088", marginBottom:12 }}>➕ Nowe kryterium</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <div><label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:3 }}>Nazwa</label><input value={newCrit.label} onChange={e => setNewCrit(f => ({ ...f, label:e.target.value }))} placeholder="🌟 Nazwa" style={INP} /></div>
                <div><label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:3 }}>Punkty</label><input value={newCrit.points} onChange={e => setNewCrit(f => ({ ...f, points:e.target.value }))} placeholder="0.30" style={INP} /></div>
              </div>
              <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:3 }}>Opis</label>
              <input value={newCrit.desc} onChange={e => setNewCrit(f => ({ ...f, desc:e.target.value }))} placeholder="Opis" style={{ ...INP, marginBottom:8 }} />
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
                {Object.entries({ pos:"⚽+", gk_pos:"🧤+", neg:"🔴−", gk_neg:"🔴BR−" }).map(([k,l]) => (
                  <button key={k} onClick={() => setNewCrit(f => ({ ...f, cat:k }))}
                    style={{ padding:"5px 10px", borderRadius:5, border:`1px solid ${newCrit.cat===k?"#ff6b35":"#3b1f5c"}`, background:newCrit.cat===k?"rgba(255,107,53,.2)":"transparent", color:newCrit.cat===k?"#ffb088":"#475569", fontSize:12, cursor:"pointer" }}>{l}</button>
                ))}
              </div>
              <button onClick={() => { if (!newCrit.label.trim()) return; const pts = parseFloat(newCrit.points); if (isNaN(pts)) return; const nc = [...criteria, { id:"c_"+Date.now(), label:newCrit.label.trim(), desc:newCrit.desc.trim()||"—", points:pts, cat:newCrit.cat }]; commit(undefined, nc); setNewCrit({ label:"", desc:"", points:"0.20", cat:"pos" }); showToast("✅ Dodano!"); }}
                style={{ width:"100%", padding:"10px", background:"#ff6b35", border:"none", borderRadius:7, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Dodaj kryterium</button>
            </div>
            {["pos","gk_pos","neg","gk_neg"].map(cat => (
              <div key={cat} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, color:cat.includes("neg")?"#ef4444":"#ff6b35", marginBottom:7, letterSpacing:.8, textTransform:"uppercase" }}>{CAT_LABELS[cat]}</div>
                {criteria.filter(c => c.cat===cat).map(c => (
                  <div key={c.id} style={{ background:"#150d2e", border:"1px solid #221640", borderRadius:7, padding:"9px 13px", marginBottom:5 }}>
                    {editCrit?.id===c.id ? (
                      <div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:6 }}>
                          <input value={editCrit.label} onChange={e => setEditCrit(f => ({ ...f, label:e.target.value }))} style={{ ...INP, fontSize:12, padding:"5px 8px", border:"1px solid #ff6b35" }} />
                          <input value={editCrit.points} onChange={e => setEditCrit(f => ({ ...f, points:e.target.value }))} style={{ ...INP, fontSize:12, padding:"5px 8px", border:"1px solid #ff6b35" }} />
                        </div>
                        <input value={editCrit.desc} onChange={e => setEditCrit(f => ({ ...f, desc:e.target.value }))} style={{ ...INP, fontSize:12, padding:"5px 8px", marginBottom:7 }} />
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => { const pts = parseFloat(editCrit.points); if (isNaN(pts)) return; const nc = criteria.map(x => x.id===c.id ? { ...editCrit, points:pts } : x); commit(undefined, nc); setEditCrit(null); showToast("✅ Zapisano!"); }} style={{ flex:1, padding:"6px", background:"#ff6b35", border:"none", borderRadius:5, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>Zapisz</button>
                          <button onClick={() => setEditCrit(null)} style={{ padding:"6px 12px", background:"transparent", border:"1px solid #3b1f5c", borderRadius:5, color:"#64748b", fontSize:12, cursor:"pointer" }}>Anuluj</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ fontSize:17, width:24 }}>{c.label.split(" ")[0]}</div>
                        <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:12, color:"#e8d5f5" }}>{c.label.split(" ").slice(1).join(" ")}</div><div style={{ fontSize:10, color:"#334155" }}>{c.desc}</div></div>
                        <div style={{ fontWeight:800, fontSize:13, color:c.points>0?"#ff6b35":"#ef4444", marginRight:6 }}>{c.points>0?"+":""}{c.points}</div>
                        <button onClick={() => setEditCrit({ ...c, points:String(c.points) })} style={{ background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:13, padding:"2px 5px" }}>✏️</button>
                        <button onClick={() => { if (window.confirm(`Usunąć "${c.label}"?`)) { const nc = criteria.filter(x => x.id!==c.id); commit(undefined, nc); showToast("🗑️ Usunięto"); } }} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:13, padding:"2px 5px" }}>🗑️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* SZCZEGÓŁY ZAWODNIKA */}
        {view==="player" && selP && (() => {
          const p = players.find(x => x.id===selP); if (!p) return null;
          const avg = getAvgRating(p.matches), val = calcValue(p), chg = val-p.value, form = checkFormBonus(p);
          const badges = badgesFor(p.id, lca);
          let running = Math.min(p.value, MAX_VALUE);
          const mwv = (p.matches||[]).map(m => {
            const r = safeR(m);
            const pct = getSessionChangePct(running, r-BASE_RATING, r);
            const delta = Math.min(Math.round(running*pct), MAX_VALUE-running);
            const ps = running>0 ? ((delta/running)*100).toFixed(1) : "0";
            running = Math.min(Math.max(running+delta, 100_000), MAX_VALUE);
            return { ...m, rating:r, valDelta:delta, valPct:ps };
          });
          return (
            <div style={{ marginTop:16 }}>
              <button onClick={() => setView("ranking")} style={{ background:"none", border:"none", color:"#ff6b35", cursor:"pointer", fontSize:13, marginBottom:12, padding:0 }}>← Ranking</button>
              <div style={CARD}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:22, fontWeight:900, color:"#e2e8f0", display:"flex", alignItems:"center", gap:7 }}>
                      {p.name}{badges.map(([e,t],bi) => <span key={bi} title={t} style={{ fontSize:16 }}>{e}</span>)}
                    </div>
                    <div style={{ fontSize:12, color:"#475569" }}>{p.position} · {p.matches.length} meczów</div>
                    {form && <div style={{ fontSize:10, background:"rgba(251,191,36,.15)", border:"1px solid #fbbf24", color:"#fbbf24", borderRadius:4, padding:"2px 7px", marginTop:5, display:"inline-block" }}>🔥 FORMA AKTYWNA · +30% wartość</div>}
                    {val>=TOP_TIER_FLOOR && <div style={{ fontSize:10, background:"rgba(239,68,68,.15)", border:"1px solid #ef4444", color:"#fca5a5", borderRadius:4, padding:"2px 7px", marginTop:5, display:"inline-block" }}>⚠️ Blisko limitu {fv(MAX_VALUE)} · wymagana ocena ≥{TOP_TIER_MIN_RATING.toFixed(1)}, inaczej spadek x4</div>}
                    <div style={{ display:"flex", gap:8, marginTop:8 }}>
                      {[["Wygrana","#22c55e","W"],["Remis","#f59e0b","R"],["Przegrana","#ef4444","P"]].map(([res,col,ico]) => { const cnt = p.matches.filter(m => m.result===res).length; return cnt ? <span key={res} style={{ fontSize:11, fontWeight:700, color:col }}>{ico} {cnt}</span> : null; })}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:30, fontWeight:900, color:avg?rc(avg):"#3b1f5c", lineHeight:1 }}>{avg?avg.toFixed(2):"—"}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#e2e8f0", marginTop:2 }}>{fv(val)}</div>
                    <div style={{ fontSize:11, color:chg>=0?"#22c55e":"#ef4444" }}>{chg>=0?"+":""}{fv(Math.abs(chg))} vs baza</div>
                  </div>
                </div>
              </div>
              {p.matches.length>0 && (
                <div style={CARD}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#334155", marginBottom:10, letterSpacing:.5 }}>📈 WYKRES WYCENY</div>
                  <PlayerValueChart player={p} />
                </div>
              )}
              {mwv.length>0 && (
                <div style={CARD}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#334155", marginBottom:12, letterSpacing:.5 }}>HISTORIA MECZÓW</div>
                  {[...mwv].reverse().map((m,i) => {
                    const rc2 = RESULT_COLOR[m.result]||"#475569";
                    return (
                      <div key={i} style={{ background:"#0c0a1d", borderRadius:9, padding:"11px 13px", marginBottom:8, border:`1px solid ${rc2}22` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ width:20, height:20, borderRadius:4, background:rc2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:"#fff" }}>{RESULT_ICON[m.result]}</span>
                            <div><div style={{ fontWeight:700, fontSize:13, color:"#e2e8f0" }}>vs {m.opponent||"—"}</div><div style={{ fontSize:10, color:"#334155" }}>{fmtPL(m.date)} · <span style={{ fontWeight:700, color:rc2 }}>{m.score||"?:?"}</span>{m.extraTime?" · po dogr.":""}</div></div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:20, fontWeight:900, color:rc(m.rating) }}>{m.rating.toFixed(2)}</div>
                            <div style={{ fontSize:10, color:m.valDelta>=0?"#22c55e":"#ef4444" }}>{m.valDelta>=0?"+":""}{fv(Math.abs(m.valDelta))} ({m.valDelta>=0?"+":""}{m.valPct}%)</div>
                          </div>
                        </div>
                        {Array.isArray(m.goals) && m.goals.length>0 && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:5 }}>
                            {m.goals.filter(g => g.scorer===p.id).map((g,gi) => <span key={gi} style={{ background:g.type==="ownGoal"?"rgba(239,68,68,.2)":"rgba(255,107,53,.2)", border:`1px solid ${g.type==="ownGoal"?"#ef4444":"#ff6b35"}`, borderRadius:4, padding:"2px 7px", fontSize:10, color:g.type==="ownGoal"?"#fca5a5":"#ffb088" }}>{GICO[g.type]||"⚽"}{g.minute?" "+goalLabel(g):""}</span>)}
                            {m.goals.filter(g => g.assist===p.id).map((g,gi) => <span key={gi} style={{ background:"rgba(20,184,166,.2)", border:"1px solid #14b8a6", borderRadius:4, padding:"2px 7px", fontSize:10, color:"#5eead4" }}>🎯{g.minute?" "+goalLabel(g):""}</span>)}
                          </div>
                        )}
                        <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                          {criteria.filter(c => parseInt((m.criteria||{})[c.id]||0)>0).map(c => (
                            <span key={c.id} style={{ background:c.points>0?"rgba(255,107,53,.1)":"rgba(239,68,68,.1)", border:`1px solid ${c.points>0?"#ff6b35":"#ef4444"}`, borderRadius:3, padding:"1px 6px", fontSize:10, color:c.points>0?"#ffb088":"#fca5a5" }}>
                              {c.label.split(" ")[0]} ×{m.criteria[c.id]}
                            </span>
                          ))}
                        </div>
                        {m.note && <div style={{ fontSize:11, color:"#334155", marginTop:5, fontStyle:"italic" }}>„{m.note}"</div>}
                      </div>
                    );
                  })}
                </div>
              )}
              {(p.opinions||[]).length>0 && (
                <div style={CARD}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#334155", marginBottom:10, letterSpacing:.5 }}>OPINIE</div>
                  {p.opinions.map((o,i) => (
                    <div key={i} style={{ borderLeft:`3px solid ${o.sentiment==="positive"?"#22c55e":o.sentiment==="negative"?"#ef4444":"#334155"}`, paddingLeft:10, marginBottom:8 }}>
                      <div style={{ fontSize:12, color:"#c9a8e0" }}>{o.text}</div>
                      <div style={{ fontSize:10, color:"#334155", marginTop:1 }}>{fmtPL(o.date)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* DOLNA NAWIGACJA */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#150d2e", borderTop:"1px solid #221640", display:"flex", justifyContent:"center", padding:"8px 0" }}>
        <div style={{ display:"flex", gap:2, maxWidth:720, width:"100%", padding:"0 8px", overflowX:"auto" }}>
          {navItems.map(([v,icon]) => (
            <button key={v} onClick={() => { if (v==="add") setWiz(EMPTY_WIZ()); setView(v); }}
              style={{ flex:"1 0 auto", minWidth:38, padding:"8px 4px", background:view===v?"rgba(255,107,53,.15)":"transparent", border:`1px solid ${view===v?"#ff6b35":"transparent"}`, borderRadius:8, color:view===v?"#ffb088":"#334155", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── WYBÓR TRYBU + BRAMKA ADMINA ──────────────────────────────────────────────
const ADMIN_PASSWORD = "12admin@34";
const MODE_KEY = "wfc-mode";
const ADMIN_KEY = "wfc-admin-authed";

function ModeSelect({ onChoose }) {
  return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',system-ui,sans-serif", padding:20 }}>
      <div style={{ maxWidth:360, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:14 }}>🔥⚽</div>
        <div style={{ fontSize:26, fontWeight:900, marginBottom:6, background:"linear-gradient(135deg,#ff6b35,#ffb088 40%,#00d9c0)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>WAKACJE FC</div>
        <div style={{ fontSize:13, color:"#c9a8e0", marginBottom:28 }}>Wybierz tryb</div>
        <button onClick={() => onChoose("viewer")}
          style={{ width:"100%", padding:"16px", marginBottom:12, background:"#150d2e", border:"1px solid #0e7490", borderRadius:12, color:"#7ef5e5", fontSize:15, fontWeight:800, cursor:"pointer", textAlign:"left" }}>
          👁️ Widz
          <div style={{ fontSize:11, color:"#64748b", fontWeight:400, marginTop:3 }}>Podgląd rankingu, meczów i sezonów. Bez hasła.</div>
        </button>
        <button onClick={() => onChoose("admin")}
          style={{ width:"100%", padding:"16px", background:"#150d2e", border:"1px solid #7c2d12", borderRadius:12, color:"#ffb088", fontSize:15, fontWeight:800, cursor:"pointer", textAlign:"left" }}>
          🛠️ Administrator
          <div style={{ fontSize:11, color:"#64748b", fontWeight:400, marginTop:3 }}>Dodawanie meczów i ocen. Wymaga hasła.</div>
        </button>
      </div>
    </div>
  );
}

function AdminGate({ onSuccess, onBack }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const tryLogin = () => { if (pw===ADMIN_PASSWORD) { try { localStorage.setItem(ADMIN_KEY, "yes"); } catch (e) {} onSuccess(); } else { setErr(true); setPw(""); } };
  return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',system-ui,sans-serif", padding:20 }}>
      <div style={{ maxWidth:340, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:42, marginBottom:14 }}>🛠️</div>
        <div style={{ fontSize:22, fontWeight:900, marginBottom:6, color:"#ffb088" }}>Tryb administratora</div>
        <div style={{ fontSize:13, color:"#c9a8e0", marginBottom:24 }}>Wpisz hasło, żeby wejść</div>
        <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(false); }} onKeyDown={e => { if (e.key==="Enter") tryLogin(); }} placeholder="Hasło..." autoFocus
          style={{ display:"block", width:"100%", marginBottom:12, background:"#150d2e", border:`1px solid ${err?"#ef4444":"#3b1f5c"}`, borderRadius:8, color:"#e2e8f0", padding:"12px 14px", fontSize:15, textAlign:"center", boxSizing:"border-box" }} />
        {err && <div style={{ fontSize:12, color:"#ef4444", marginBottom:12 }}>❌ Złe hasło, spróbuj jeszcze raz</div>}
        <button onClick={tryLogin} style={{ width:"100%", padding:"12px", background:"linear-gradient(135deg,#ff6b35,#e0289d)", border:"none", borderRadius:8, color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer", marginBottom:10 }}>Wejdź</button>
        <button onClick={onBack} style={{ width:"100%", padding:"10px", background:"transparent", border:"1px solid #3b1f5c", borderRadius:8, color:"#94a3b8", fontSize:13, cursor:"pointer" }}>← Wróć do wyboru trybu</button>
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState(() => { try { return localStorage.getItem(MODE_KEY) || null; } catch (e) { return null; } });
  const [authed, setAuthed] = useState(() => { try { return localStorage.getItem(ADMIN_KEY)==="yes"; } catch (e) { return false; } });

  const chooseMode = (m) => { try { localStorage.setItem(MODE_KEY, m); } catch (e) {} setMode(m); };
  const exit = () => { try { localStorage.removeItem(MODE_KEY); } catch (e) {} setMode(null); };

  if (mode==="viewer") return <MainApp readOnly onExit={exit} />;
  if (mode==="admin" && authed) return <MainApp readOnly={false} onExit={exit} />;
  if (mode==="admin" && !authed) return <AdminGate onSuccess={() => setAuthed(true)} onBack={exit} />;
  return <ModeSelect onChoose={chooseMode} />;
}
