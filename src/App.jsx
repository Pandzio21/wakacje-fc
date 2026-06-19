import { useState, useEffect, useRef } from "react";

// ─── PLAYERS ──────────────────────────────────────────────────────────────────
const PLAYERS = [
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
];

const BASE_RATING = 6.7;
const SK_PLAYERS  = "wtm3-players";
const SK_CRITERIA = "wtm3-criteria";
const SK_TS       = "wtm3-ts";

const DEFAULT_CRITERIA = [
  { id:"goal",             label:"⚽ Gol",               desc:"Trafił do siatki",                                              points:0.40,  cat:"pos" },
  { id:"assist",           label:"🎯 Asysta",             desc:"Podał bezpośrednio na gola",                                    points:0.30,  cat:"pos" },
  { id:"nutmeg",           label:"🍑 Siatkówka",          desc:"Przepuścił piłkę między nogami",                                points:0.30,  cat:"pos" },
  { id:"skill",            label:"🪄 Sztuczka",           desc:"Efektowny drybling",                                            points:0.25,  cat:"pos" },
  { id:"screamer",         label:"🚀 Benger",             desc:"Gol z ponad 20m",                                               points:0.50,  cat:"pos" },
  { id:"tackle",           label:"🦵 Wślizg",             desc:"Czysty spektakularny wślizg",                                   points:0.25,  cat:"pos" },
  { id:"dribble_line",     label:"🕺 Minął linię",        desc:"Ominął 3+ zawodników z rzędu",                                 points:0.40,  cat:"pos" },
  { id:"freekick",         label:"🌀 Gol ze stałego",     desc:"Gol z rzutu wolnego / rogu",                                   points:0.45,  cat:"pos" },
  { id:"clutch",           label:"🔥 Clutch",             desc:"Decydujące zagranie przy końcówce",                             points:0.50,  cat:"pos" },
  { id:"rainbow",          label:"🌈 Rainbow flick",      desc:"Rainbow flick skutecznie w grze",                               points:0.35,  cat:"pos" },
  { id:"key_pass",         label:"🔑 Kluczowe podanie",   desc:"Stworzyło stuprocentową sytuację",                              points:0.20,  cat:"pos" },
  { id:"header",           label:"🦁 Gol głową",          desc:"Trafił do siatki głową",                                        points:0.35,  cat:"pos" },
  { id:"save",             label:"🧤 Obrona gola",        desc:"Obronił strzał idący w okienko",                                points:0.40,  cat:"gk_pos" },
  { id:"save_penalty",     label:"🫵 Obrona karnego",     desc:"Obronił penalty",                                               points:0.80,  cat:"gk_pos" },
  { id:"save_rebound",     label:"🏃 Obrona dobitki",     desc:"Wrócił i obronił dobitkę",                                      points:0.35,  cat:"gk_pos" },
  { id:"gk_assist",        label:"🎁 Podanie na gola",    desc:"Uruchomił akcję kończącą się golem",                            points:0.30,  cat:"gk_pos" },
  { id:"gk_rush",          label:"⛔ Wyjście 1 na 1",     desc:"Wybiegł i zatrzymał sam na sam",                                points:0.45,  cat:"gk_pos" },
  { id:"gk_sweeper",       label:"🧹 Obrona nóżkami",     desc:"Wyczyścił sytuację nóżkami",                                    points:0.30,  cat:"gk_pos" },
  { id:"miss",             label:"🤦 Pudło",              desc:"Spudłował z metra / sam na bramkę",                             points:-0.30, cat:"neg" },
  { id:"own_goal",         label:"😬 Samobój",            desc:"Wpakował do własnej siatki",                                    points:-0.40, cat:"neg" },
  { id:"lost_ball_danger", label:"💀 Niebezp. strata",    desc:"Stracił piłkę w groźnym miejscu",                              points:-0.25, cat:"neg" },
  { id:"lost_ball_cheap",  label:"🎁 Głupia strata",      desc:"Łatwa strata w środku pola",                                   points:-0.15, cat:"neg" },
  { id:"foul_danger",      label:"🟥 Faul w polu",        desc:"Sfaulował w polu karnym",                                       points:-0.30, cat:"neg" },
  { id:"lazy_track",       label:"🛋️ Nie wrócił",         desc:"Nie cofnął się do obrony",                                      points:-0.20, cat:"neg" },
  { id:"bad_pass",         label:"🙈 Podanie do rywala",  desc:"Zagrał wprost do nogi przeciwnika",                             points:-0.20, cat:"neg" },
  { id:"penalty_miss",     label:"😱 Pudło z karnego",    desc:"Spudłował rzut karny",                                          points:-0.50, cat:"neg" },
  { id:"gk_blunder",       label:"🫣 Klops bramkarza",    desc:"Wpuścił łatwego gola z winy błędu",                             points:-0.50, cat:"gk_neg" },
  { id:"gk_wrong_pos",     label:"📍 Zła pozycja",        desc:"Stał w złym miejscu – kosztowało gola",                         points:-0.30, cat:"gk_neg" },
  { id:"gk_lost_ball",     label:"🤲 Wybił pod nogi",     desc:"Wybił piłkę prosto pod nogi rywala",                            points:-0.25, cat:"gk_neg" },
];

const DEFAULT_PLAYERS = (()=>{
  const today=new Date().toISOString().slice(0,10);
  const hB={id:1,date:today,score:"8:5",opponent:"Team Śmietanki",result:"Wygrana",  note:"",criteria:{},goals:[],teamA:[],teamB:[]};
  const sB={id:2,date:today,score:"5:8",opponent:"Team Huxa",      result:"Przegrana",note:"",criteria:{},goals:[],teamA:[],teamB:[]};
  const pre={hux:{...hB,rating:10.00},adam:{...hB,rating:6.35},pandzio:{...hB,rating:7.70},tazzy:{...hB,rating:6.00},
             smietan:{...sB,rating:9.85},maniak:{...sB,rating:7.80},natan:{...sB,rating:7.50}};
  return PLAYERS.map(p=>({...p,matches:pre[p.id]?[pre[p.id]]:[],opinions:[]}));
})();

const GOAL_TYPES=[
  {id:"normal",  label:"⚽ Normalny"},
  {id:"screamer",label:"🚀 Benger"},
  {id:"header",  label:"🦁 Głową"},
  {id:"freekick",label:"🌀 Wolny"},
  {id:"penalty", label:"🫵 Karny"},
  {id:"noAssist",label:"🔵 Bez asysty"},
];
const RESULT_COLOR={Wygrana:"#22c55e",Remis:"#f59e0b",Przegrana:"#ef4444"};
const RESULT_ICON ={Wygrana:"W",Remis:"R",Przegrana:"P"};
const CAT_LABELS={pos:"⚽ Pozytywne – pole",gk_pos:"🧤 Pozytywne – bramkarz",neg:"🔴 Negatywne – pole",gk_neg:"🔴 Negatywne – bramkarz"};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
const fv=v=>v>=1e6?`€${(v/1e6).toFixed(1)}M`:`€${(v/1e3).toFixed(0)}K`;
const rc=r=>r>=8?"#22c55e":r>=7?"#84cc16":r>=6.5?"#f59e0b":r>=5.5?"#f97316":"#ef4444";
const safeR=m=>typeof m.rating==="number"?m.rating:parseFloat(m.rating)||BASE_RATING;

function calcMatchRating(cmap,clist){
  if(!clist||!cmap) return BASE_RATING;
  let d=0; clist.forEach(c=>{const n=parseInt(cmap[c.id]||0);if(n)d+=c.points*n;});
  return clamp(BASE_RATING+d,1,10);
}
function getAvgRating(matches){
  if(!matches?.length) return null;
  const v=matches.map(safeR);
  return v.reduce((a,b)=>a+b,0)/v.length;
}

// Form bonus: 30% value boost if criteria met
function checkFormBonus(player){
  const ms=player.matches; const v=player.value;
  if(ms.length<2) return false;
  function recentN(n){return ms.slice(-n);}
  function hasGoalOrAssist(m){
    const c=m.criteria||{};
    return (parseInt(c.goal||0)+parseInt(c.screamer||0)+parseInt(c.freekick||0)+parseInt(c.header||0)+parseInt(c.assist||0))>=1;
  }
  function hasDoubleContrib(m){
    const c=m.criteria||{};
    return (parseInt(c.goal||0)+parseInt(c.screamer||0)+parseInt(c.freekick||0)+parseInt(c.header||0)+parseInt(c.assist||0))>=2;
  }
  function hasHattrickContrib(m){
    const c=m.criteria||{};
    return (parseInt(c.goal||0)+parseInt(c.screamer||0)+parseInt(c.freekick||0)+parseInt(c.header||0)+parseInt(c.assist||0))>=3;
  }
  if(v<=10e6){
    const r=recentN(2);
    return r.length===2&&r.every(m=>hasGoalOrAssist(m)||safeR(m)>7.5);
  } else if(v<=30e6){
    const r=recentN(3);
    return r.length===3&&r.every(m=>hasGoalOrAssist(m)||safeR(m)>7.5);
  } else if(v<=100e6){
    const r=recentN(3);
    return r.length===3&&r.every(m=>hasDoubleContrib(m)||safeR(m)>8.2);
  } else {
    const r=recentN(3);
    return r.length===3&&r.every(m=>hasHattrickContrib(m)||safeR(m)>9.2);
  }
}

function getSessionChangePct(cur,rd){
  // Tiered: lower value = bigger % swing, hard cap at 20M absolute
  const tier=Math.log10(Math.max(cur,100_000)/300_000+1);
  const base=0.08/tier; // reduced from 0.12
  const pct=clamp(base*rd,-0.20,0.20);
  // Absolute cap: 20M
  const abs=cur*pct;
  if(Math.abs(abs)>20_000_000) return (20_000_000*Math.sign(abs))/cur;
  return pct;
}

function calcValue(player){
  const{matches=[],opinions=[],value:base}=player;
  if(!matches.length&&!opinions.length) return base;
  let cur=base;
  matches.forEach(m=>{
    const rd=safeR(m)-BASE_RATING;
    const pct=getSessionChangePct(cur,rd);
    cur=Math.max(cur+Math.round(cur*pct),100_000);
  });
  // Form bonus +30%
  if(checkFormBonus({...player,matches})){
    cur=Math.round(cur*1.30);
  }
  // Recent form micro-nudge (last 3)
  const rec=matches.slice(-3);
  if(rec.length){
    const ra=rec.reduce((s,m)=>s+safeR(m),0)/rec.length;
    cur=Math.max(Math.round(cur*(1+clamp((ra-BASE_RATING)*0.005,-0.02,0.02))),100_000);
  }
  let op=0; opinions.forEach(o=>{if(o.sentiment==="positive")op+=0.02;if(o.sentiment==="negative")op-=0.02;});
  return Math.max(Math.round(cur*(1+clamp(op,-0.10,0.10))),100_000);
}

function getTrend(matches){
  if(matches.length<2) return "—";
  const d=safeR(matches[matches.length-1])-safeR(matches[matches.length-2]);
  return d>0.1?"▲":d<-0.1?"▼":"→";
}

const EMPTY_WIZ=()=>({step:"1",date:new Date().toISOString().slice(0,10),teamAName:"",teamBName:"",teamA:[],teamB:[],goals:[],ratings:{},activeP:null});

// ─── STEP BAR ─────────────────────────────────────────────────────────────────
function StepBar({step}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:20}}>
      {[["1","Skład"],["2","Gole"],["3","Oceny"],["4","Gotowe"]].map(([s,lbl],i)=>(
        <div key={s} style={{display:"flex",alignItems:"center",gap:6}}>
          {i>0&&<div style={{width:16,height:2,background:parseInt(step)>i?"#ff6b35":"#3b1f5c"}}/>}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,
              background:step===s?"#ff6b35":parseInt(step)>parseInt(s)?"#7c2d12":"#3b1f5c",
              color:step===s?"#fff":parseInt(step)>parseInt(s)?"#ffb088":"#475569"}}>
              {parseInt(step)>parseInt(s)?"✓":s}
            </div>
            <div style={{fontSize:9,color:step===s?"#ffb088":"#475569"}}>{lbl}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MATCH WIZARD ─────────────────────────────────────────────────────────────
function MatchWizard({wiz,setWiz,players,criteria,onSubmit}){
  const{step,date,teamAName,teamBName,teamA,teamB,goals,ratings,activeP}=wiz;
  const W=upd=>setWiz(w=>({...w,...upd}));
  const scoreA=goals.filter(g=>g.teamSide==="A").length;
  const scoreB=goals.filter(g=>g.teamSide==="B").length;
  const inp={width:"100%",background:"#221640",border:"1px solid #3b1f5c",borderRadius:6,color:"#e2e8f0",padding:"8px 10px",fontSize:13,boxSizing:"border-box"};
  const lbl={fontSize:12,color:"#64748b",display:"block",marginBottom:4};

  // STEP 1 ────────────────────────────────────────────────────────────────────
  if(step==="1") return(
    <div style={{marginTop:16}}>
      <p style={{fontSize:12,color:"#64748b",margin:"0 0 16px"}}>Wybierz datę, nazwij drużyny i dodaj zawodników.</p>
      <div style={{background:"#221640",border:"1px solid #3b1f5c",borderRadius:12,padding:20}}>
        <StepBar step={step}/>
        <label style={lbl}>Data meczu</label>
        <input type="date" value={date} onChange={e=>W({date:e.target.value})} style={{...inp,marginBottom:16}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[
            {side:"A",name:teamAName,setName:v=>W({teamAName:v}),ids:teamA,other:teamB,setIds:v=>W({teamA:v}),ac:"#ff6b35",ab:"rgba(255,107,53,.15)",ph:"Team Huxa"},
            {side:"B",name:teamBName,setName:v=>W({teamBName:v}),ids:teamB,other:teamA,setIds:v=>W({teamB:v}),ac:"#00d9c0",ab:"rgba(0,217,192,.15)",ph:"Team Śmietanki"},
          ].map(({side,name,setName,ids,other,setIds,ac,ab,ph})=>(
            <div key={side}>
              <label style={lbl}>Drużyna {side}</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder={ph} style={{...inp,marginBottom:10,borderColor:ac+"66"}}/>
              <label style={lbl}>Zawodnicy</label>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {PLAYERS.map(p=>{
                  const inThis=ids.includes(p.id),inOther=other.includes(p.id);
                  return(
                    <button key={p.id} onClick={()=>{if(inOther)return;setIds(inThis?ids.filter(x=>x!==p.id):[...ids,p.id]);}}
                      style={{padding:"6px 10px",borderRadius:6,border:`1px solid ${inThis?ac:"#3b1f5c"}`,textAlign:"left",cursor:inOther?"not-allowed":"pointer",fontSize:12,fontWeight:600,
                        background:inThis?ab:"transparent",color:inThis?ac:inOther?"#334155":"#64748b",opacity:inOther?0.4:1}}>
                      {inThis?"✓ ":""}{p.name} <span style={{fontWeight:400,opacity:.6}}>· {p.position}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{fontSize:11,color:ac,marginTop:5,opacity:ids.length?1:0.3}}>{ids.length} zawodników</div>
            </div>
          ))}
        </div>
        <button onClick={()=>{if(teamA.length&&teamB.length)W({step:"2"});}}
          disabled={!teamA.length||!teamB.length}
          style={{width:"100%",marginTop:16,padding:"11px",background:teamA.length&&teamB.length?"#ff6b35":"#3b1f5c",border:"none",borderRadius:8,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          Dalej → Gole
        </button>
      </div>
    </div>
  );

  // STEP 2 ────────────────────────────────────────────────────────────────────
  if(step==="2"){
    const add=side=>W({goals:[...goals,{id:Date.now()+Math.random(),teamSide:side,scorer:"",assist:"",minute:"",type:"normal"}]});
    const upd=(id,u)=>W({goals:goals.map(g=>g.id===id?{...g,...u}:g)});
    const rm=id=>W({goals:goals.filter(g=>g.id!==id)});
    const sel={background:"#221640",border:"1px solid #3b1f5c",borderRadius:5,color:"#e2e8f0",padding:"5px 7px",fontSize:12,width:"100%"};
    const tA=teamA.map(id=>PLAYERS.find(p=>p.id===id)).filter(Boolean);
    const tB=teamB.map(id=>PLAYERS.find(p=>p.id===id)).filter(Boolean);
    return(
      <div style={{marginTop:16}}>
        <div style={{background:"#221640",border:"1px solid #3b1f5c",borderRadius:12,padding:20}}>
          <StepBar step={step}/>
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:20,marginBottom:18,padding:"14px",background:"#0c0a1d",borderRadius:10}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#64748b",marginBottom:2}}>{teamAName||"A"}</div><div style={{fontSize:38,fontWeight:900,color:"#ff6b35"}}>{scoreA}</div></div>
            <div style={{fontSize:20,color:"#334155",fontWeight:800}}>:</div>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#64748b",marginBottom:2}}>{teamBName||"B"}</div><div style={{fontSize:38,fontWeight:900,color:"#00d9c0"}}>{scoreB}</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            <button onClick={()=>add("A")} style={{padding:"9px",background:"rgba(255,107,53,.15)",border:"1px solid #ff6b35",borderRadius:8,color:"#ffb088",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Gol {teamAName||"A"}</button>
            <button onClick={()=>add("B")} style={{padding:"9px",background:"rgba(0,217,192,.15)",border:"1px solid #00d9c0",borderRadius:8,color:"#7ef5e5",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Gol {teamBName||"B"}</button>
          </div>
          {goals.length===0&&<div style={{fontSize:12,color:"#334155",textAlign:"center",padding:"16px 0",fontStyle:"italic"}}>Brak goli – dodaj powyżej lub przejdź dalej</div>}
          {goals.map((g,gi)=>{
            const isA=g.teamSide==="A";
            const pool=isA?tA:tB;
            const noA=g.type==="penalty"||g.type==="noAssist";
            return(
              <div key={g.id} style={{background:"#0c0a1d",border:`1px solid ${isA?"#ff6b35":"#00d9c0"}33`,borderRadius:10,padding:"12px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontWeight:700,fontSize:12,color:isA?"#ffb088":"#7ef5e5"}}>{isA?"●":"●"} Gol {gi+1} · {isA?(teamAName||"A"):(teamBName||"B")}</div>
                  <button onClick={()=>rm(g.id)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:16}}>✕</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 72px",gap:8,marginBottom:8}}>
                  <div>
                    <label style={lbl}>Strzelec</label>
                    <select value={g.scorer} onChange={e=>upd(g.id,{scorer:e.target.value})} style={sel}>
                      <option value="">— —</option>
                      {pool.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Asysta</label>
                    <select value={g.assist} onChange={e=>upd(g.id,{assist:e.target.value})} disabled={noA} style={{...sel,opacity:noA?0.35:1}}>
                      <option value="">— brak —</option>
                      {pool.filter(p=>p.id!==g.scorer).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Min.</label>
                    <input type="number" min="1" max="120" placeholder="23" value={g.minute} onChange={e=>upd(g.id,{minute:e.target.value})} style={{...sel,padding:"5px 6px"}}/>
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {GOAL_TYPES.map(t=>(
                    <button key={t.id} onClick={()=>upd(g.id,{type:t.id,assist:(t.id==="penalty"||t.id==="noAssist")?"":g.assist})}
                      style={{padding:"3px 9px",borderRadius:4,border:"1px solid",fontSize:11,fontWeight:600,cursor:"pointer",
                        background:g.type===t.id?"#ff6b35":"transparent",borderColor:g.type===t.id?"#ff6b35":"#3b1f5c",color:g.type===t.id?"#fff":"#64748b"}}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={()=>W({step:"1"})} style={{padding:"9px 16px",background:"transparent",border:"1px solid #3b1f5c",borderRadius:8,color:"#64748b",fontSize:13,cursor:"pointer"}}>← Wróć</button>
            <button onClick={()=>W({step:"3"})} style={{flex:1,padding:"11px",background:"#ff6b35",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Dalej → Oceny</button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3 ────────────────────────────────────────────────────────────────────
  if(step==="3"){
    if(activeP){
      const p=PLAYERS.find(x=>x.id===activeP);
      const r=ratings[activeP]||{criteria:{},note:""};
      const setR=u=>W({ratings:{...ratings,[activeP]:{...r,...u}}});
      const updC=(cid,n)=>setR({criteria:{...r.criteria,[cid]:Math.max(0,n)}});
      const myGoals=goals.filter(g=>g.scorer===activeP);
      const myAssists=goals.filter(g=>g.assist===activeP);
      const pc={...r.criteria};
      myGoals.forEach(g=>{const t=g.type;if(t==="screamer")pc.screamer=(parseInt(pc.screamer||0)+1);else if(t==="freekick")pc.freekick=(parseInt(pc.freekick||0)+1);else if(t==="header")pc.header=(parseInt(pc.header||0)+1);else pc.goal=(parseInt(pc.goal||0)+1);});
      myAssists.forEach(()=>{pc.assist=(parseInt(pc.assist||0)+1);});
      const pr=calcMatchRating(pc,criteria);
      const curPl=players.find(x=>x.id===activeP)||{value:0,matches:[],opinions:[]};
      const curV=calcValue(curPl);
      const rd=pr-BASE_RATING;
      const chg=Math.round(curV*getSessionChangePct(curV,rd));
      const gico={screamer:"🚀",header:"🦁",freekick:"🌀",penalty:"🫵",normal:"⚽",noAssist:"⚽"};
      return(
        <div style={{marginTop:16}}>
          <button onClick={()=>W({activeP:null})} style={{background:"none",border:"none",color:"#ff6b35",cursor:"pointer",fontSize:13,marginBottom:12,padding:0}}>← Wróć do składu</button>
          <div style={{background:"#221640",border:"1px solid #3b1f5c",borderRadius:12,padding:20}}>
            <StepBar step={step}/>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4,color:"#e2e8f0"}}>{p?.name} <span style={{fontSize:12,color:"#64748b",fontWeight:400}}>· {p?.position}</span></div>
            {(myGoals.length>0||myAssists.length>0)&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>
                {myGoals.map((g,i)=><span key={i} style={{background:"rgba(255,107,53,.2)",border:"1px solid #ff6b35",borderRadius:4,padding:"2px 8px",fontSize:11,color:"#ffb088"}}>{gico[g.type]||"⚽"}{g.minute?" "+g.minute+"'":""}</span>)}
                {myAssists.map((g,i)=><span key={i} style={{background:"rgba(20,184,166,.2)",border:"1px solid #14b8a6",borderRadius:4,padding:"2px 8px",fontSize:11,color:"#5eead4"}}>🎯{g.minute?" "+g.minute+"'":""}</span>)}
              </div>
            )}
            {["pos","gk_pos","neg","gk_neg"].map(cat=>(
              <div key={cat} style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:cat.includes("neg")?"#ef4444":"#ff6b35",letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>{CAT_LABELS[cat]}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                  {criteria.filter(c=>c.cat===cat).map(c=>{
                    const v=parseInt((r.criteria||{})[c.id]||0);
                    return(
                      <div key={c.id} style={{background:"#0c0a1d",borderRadius:7,padding:"8px 10px",border:`1px solid ${c.points>0?"#1e3a5f":"#3f1f2f"}`}}>
                        <div style={{fontSize:11,fontWeight:600,color:"#e8d5f5",marginBottom:1}}>{c.label}</div>
                        <div style={{fontSize:9,color:"#475569",marginBottom:5}}>{c.desc}</div>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <button onClick={()=>updC(c.id,v-1)} style={{width:22,height:22,borderRadius:4,background:"#3b1f5c",border:"none",color:"#c9a8e0",cursor:"pointer",fontSize:13,fontWeight:700}}>−</button>
                          <span style={{minWidth:16,textAlign:"center",fontWeight:800,fontSize:13,color:v?(c.points>0?"#ff6b35":"#ef4444"):"#334155"}}>{v}</span>
                          <button onClick={()=>updC(c.id,v+1)} style={{width:22,height:22,borderRadius:4,background:c.points>0?"rgba(255,107,53,.2)":"rgba(239,68,68,.2)",border:"none",color:c.points>0?"#ffb088":"#fca5a5",cursor:"pointer",fontSize:13,fontWeight:700}}>+</button>
                          <span style={{fontSize:9,color:c.points>0?"#ff6b35":"#ef4444"}}>{c.points>0?"+":""}{c.points}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <label style={{fontSize:12,color:"#64748b",display:"block",marginTop:4}}>Notatka</label>
            <input value={r.note||""} onChange={e=>setR({note:e.target.value})} placeholder="opcjonalnie..."
              style={{width:"100%",background:"#0c0a1d",border:"1px solid #3b1f5c",borderRadius:6,color:"#e2e8f0",padding:"7px 10px",fontSize:13,marginTop:4,marginBottom:14,boxSizing:"border-box"}}/>
            <div style={{background:"#0c0a1d",border:"1px solid #ff6b35",borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <div><div style={{fontSize:11,color:"#64748b"}}>Ocena</div><div style={{fontSize:24,fontWeight:900,color:rc(pr)}}>{pr.toFixed(2)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#64748b"}}>Zmiana wartości</div><div style={{fontSize:16,fontWeight:800,color:chg>=0?"#22c55e":"#ef4444"}}>{chg>=0?"+":""}{fv(Math.abs(chg))}</div></div>
            </div>
            <button onClick={()=>W({activeP:null})} style={{width:"100%",padding:"11px",background:"#ff6b35",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>💾 Zapisz i wróć</button>
          </div>
        </div>
      );
    }
    // Player grid
    const gByP={};goals.forEach(g=>{if(g.scorer)gByP[g.scorer]=(gByP[g.scorer]||0)+1;});
    return(
      <div style={{marginTop:16}}>
        <div style={{background:"#221640",border:"1px solid #3b1f5c",borderRadius:12,padding:20}}>
          <StepBar step={step}/>
          <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:14,padding:"10px",background:"#0c0a1d",borderRadius:8}}>
            <span style={{color:"#ffb088",fontWeight:800,fontSize:15}}>{teamAName||"A"} {scoreA}</span>
            <span style={{color:"#334155"}}>:</span>
            <span style={{color:"#7ef5e5",fontWeight:800,fontSize:15}}>{scoreB} {teamBName||"B"}</span>
          </div>
          {[{side:"A",ids:teamA,ac:"#ff6b35",tn:teamAName||"Drużyna A"},{side:"B",ids:teamB,ac:"#00d9c0",tn:teamBName||"Drużyna B"}].map(({side,ids,ac,tn})=>(
            <div key={side} style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:ac,marginBottom:7,letterSpacing:.5}}>{tn.toUpperCase()}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                {ids.map(id=>{
                  const p=PLAYERS.find(x=>x.id===id);if(!p)return null;
                  const hasR=ratings[id]&&Object.values(ratings[id].criteria||{}).some(v=>parseInt(v)>0);
                  const pG=gByP[id]||0,pA=goals.filter(g=>g.assist===id).length;
                  const crit={...(ratings[id]?.criteria||{})};
                  goals.forEach(g=>{if(g.scorer===id){const t=g.type;if(t==="screamer")crit.screamer=(parseInt(crit.screamer||0)+1);else if(t==="freekick")crit.freekick=(parseInt(crit.freekick||0)+1);else if(t==="header")crit.header=(parseInt(crit.header||0)+1);else crit.goal=(parseInt(crit.goal||0)+1);}if(g.assist===id)crit.assist=(parseInt(crit.assist||0)+1);});
                  const pr=calcMatchRating(crit,criteria);
                  return(
                    <button key={id} onClick={()=>W({activeP:id})}
                      style={{background:"#0c0a1d",border:`1px solid ${hasR?ac:"#3b1f5c"}`,borderRadius:8,padding:"10px",textAlign:"left",cursor:"pointer"}}>
                      <div style={{fontWeight:700,fontSize:13,color:"#e2e8f0"}}>{p.name}</div>
                      <div style={{fontSize:10,color:"#475569",marginBottom:5}}>{p.position}</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:5}}>
                        {pG>0&&<span style={{fontSize:10,background:"rgba(255,107,53,.2)",border:"1px solid #ff6b35",borderRadius:3,padding:"1px 5px",color:"#ffb088"}}>⚽{pG}</span>}
                        {pA>0&&<span style={{fontSize:10,background:"rgba(20,184,166,.2)",border:"1px solid #14b8a6",borderRadius:3,padding:"1px 5px",color:"#5eead4"}}>🎯{pA}</span>}
                      </div>
                      <div style={{fontSize:16,fontWeight:900,color:rc(pr)}}>{pr.toFixed(2)}</div>
                      <div style={{fontSize:9,color:hasR?ac:"#334155",marginTop:2}}>{hasR?"✓ oceniony":"kliknij →"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={()=>W({step:"2"})} style={{padding:"9px 16px",background:"transparent",border:"1px solid #3b1f5c",borderRadius:8,color:"#64748b",fontSize:13,cursor:"pointer"}}>← Wróć</button>
            <button onClick={()=>W({step:"4"})} style={{flex:1,padding:"11px",background:"#ff6b35",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Dalej → Podsumowanie</button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4 ────────────────────────────────────────────────────────────────────
  if(step==="4"){
    const allIds=[...teamA,...teamB];
    const gico={screamer:"🚀",header:"🦁",freekick:"🌀",penalty:"🫵",normal:"⚽",noAssist:"⚽"};
    return(
      <div style={{marginTop:16}}>
        <div style={{background:"#221640",border:"1px solid #3b1f5c",borderRadius:12,padding:20}}>
          <StepBar step={step}/>
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:24,marginBottom:18,padding:"16px",background:"#0c0a1d",borderRadius:12}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>{teamAName||"A"}</div><div style={{fontSize:44,fontWeight:900,color:"#ffb088",lineHeight:1}}>{scoreA}</div></div>
            <div style={{fontSize:26,color:"#334155",fontWeight:800}}>:</div>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>{teamBName||"B"}</div><div style={{fontSize:44,fontWeight:900,color:"#7ef5e5",lineHeight:1}}>{scoreB}</div></div>
          </div>
          {goals.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8,letterSpacing:.5}}>GOLE</div>
              {[...goals].sort((a,b)=>(parseInt(a.minute)||99)-(parseInt(b.minute)||99)).map((g,i)=>{
                const sc=PLAYERS.find(p=>p.id===g.scorer),as=PLAYERS.find(p=>p.id===g.assist);
                const isA=g.teamSide==="A";
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"#0c0a1d",borderRadius:6,marginBottom:4,borderLeft:`3px solid ${isA?"#ff6b35":"#00d9c0"}`}}>
                    <span style={{fontSize:11,color:"#475569",minWidth:28}}>{g.minute?g.minute+"'":"—"}</span>
                    <span>{gico[g.type]||"⚽"}</span>
                    <span style={{fontWeight:700,fontSize:13,color:"#e2e8f0"}}>{sc?.name||"?"}</span>
                    {as&&<span style={{fontSize:11,color:"#5eead4"}}>🎯 {as.name}</span>}
                    <span style={{marginLeft:"auto",fontSize:10,color:isA?"#ffb088":"#7ef5e5"}}>{isA?(teamAName||"A"):(teamBName||"B")}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8,letterSpacing:.5}}>OCENY</div>
          {allIds.map(id=>{
            const p=PLAYERS.find(x=>x.id===id);if(!p)return null;
            const r=ratings[id]||{criteria:{},note:""};
            const crit={...r.criteria};
            goals.forEach(g=>{if(g.scorer===id){const t=g.type;if(t==="screamer")crit.screamer=(parseInt(crit.screamer||0)+1);else if(t==="freekick")crit.freekick=(parseInt(crit.freekick||0)+1);else if(t==="header")crit.header=(parseInt(crit.header||0)+1);else crit.goal=(parseInt(crit.goal||0)+1);}if(g.assist===id)crit.assist=(parseInt(crit.assist||0)+1);});
            const rating=calcMatchRating(crit,criteria);
            const inA=teamA.includes(id);
            return(
              <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:"#0c0a1d",borderRadius:6,marginBottom:4,borderLeft:`3px solid ${inA?"#ff6b35":"#00d9c0"}`}}>
                <div><span style={{fontWeight:700,fontSize:13,color:"#e2e8f0"}}>{p.name}</span><span style={{fontSize:11,color:"#475569",marginLeft:6}}>{p.position}</span></div>
                <span style={{fontWeight:900,fontSize:18,color:rc(rating)}}>{rating.toFixed(2)}</span>
              </div>
            );
          })}
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <button onClick={()=>W({step:"3"})} style={{padding:"9px 16px",background:"transparent",border:"1px solid #3b1f5c",borderRadius:8,color:"#64748b",fontSize:13,cursor:"pointer"}}>← Wróć</button>
            <button onClick={onSubmit} style={{flex:1,padding:"13px",background:"linear-gradient(135deg,#ff6b35,#e0289d)",border:"none",borderRadius:8,color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer"}}>
              💾 Zapisz mecz dla wszystkich
            </button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// ─── SHOT MAP COMPONENT ───────────────────────────────────────────────────────
function ShotMap({shots,goals,onSave,readOnly}){
  const[editing,setEditing]=useState(false);
  const[home,setHome]=useState(shots?.home||50);
  const[away,setAway]=useState(shots?.away||50);
  const[homeShotsOn,setHomeShotsOn]=useState(shots?.homeShotsOn||0);
  const[awayShotsOn,setAwayShotsOn]=useState(shots?.awayShotsOn||0);
  const[homeShots,setHomeShots]=useState(shots?.homeShots||0);
  const[awayShots,setAwayShots]=useState(shots?.awayShots||0);
  useEffect(()=>{if(shots){setHome(shots.home||50);setAway(shots.away||50);setHomeShotsOn(shots.homeShotsOn||0);setAwayShotsOn(shots.awayShotsOn||0);setHomeShots(shots.homeShots||0);setAwayShots(shots.awayShots||0);}},[shots]);
  const save=()=>{onSave({home,away,homeShotsOn,awayShotsOn,homeShots,awayShots});setEditing(false);};
  const Bar=({left,right,label,lc="#ff6b35",rc2="#00d9c0"})=>{
    const total=left+right||1;
    return(
      <div style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#64748b",marginBottom:3}}>
          <span style={{color:lc,fontWeight:700}}>{left}</span><span style={{opacity:.6}}>{label}</span><span style={{color:rc2,fontWeight:700}}>{right}</span>
        </div>
        <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",background:"#3b1f5c"}}>
          <div style={{width:`${(left/total)*100}%`,background:lc,transition:"width .3s"}}/>
          <div style={{width:`${(right/total)*100}%`,background:rc2}}/>
        </div>
      </div>
    );
  };
  if(!shots&&readOnly) return null;
  if(!shots&&!editing) return(
    <button onClick={()=>setEditing(true)} style={{width:"100%",marginTop:10,padding:"7px",background:"transparent",border:"1px dashed #3b1f5c",borderRadius:6,color:"#475569",fontSize:11,cursor:"pointer"}}>
      + Dodaj statystyki meczu (ataki, strzały...)
    </button>
  );
  if(editing) return(
    <div style={{marginTop:10,background:"#0c0a1d",borderRadius:8,padding:14,border:"1px solid #3b1f5c"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#c9a8e0",marginBottom:12}}>📊 Statystyki meczu</div>
      {[
        ["Posiadanie piłki (%)",home,setHome,away,setAway],
        ["Strzały celne",homeShotsOn,setHomeShotsOn,awayShotsOn,setAwayShotsOn],
        ["Strzały ogółem",homeShots,setHomeShots,awayShots,setAwayShots],
      ].map(([label,lv,ls,rv,rs])=>(
        <div key={label} style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#475569",marginBottom:4}}>{label}</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="number" value={lv} onChange={e=>ls(parseInt(e.target.value)||0)} style={{width:56,background:"#221640",border:"1px solid #ff6b35",borderRadius:5,color:"#ffb088",padding:"5px 7px",fontSize:13,textAlign:"center"}}/>
            <span style={{color:"#334155",fontSize:12}}>vs</span>
            <input type="number" value={rv} onChange={e=>rs(parseInt(e.target.value)||0)} style={{width:56,background:"#221640",border:"1px solid #00d9c0",borderRadius:5,color:"#7ef5e5",padding:"5px 7px",fontSize:13,textAlign:"center"}}/>
          </div>
        </div>
      ))}
      <div style={{display:"flex",gap:6}}>
        <button onClick={save} style={{flex:1,padding:"8px",background:"#ff6b35",border:"none",borderRadius:6,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Zapisz</button>
        <button onClick={()=>setEditing(false)} style={{padding:"8px 12px",background:"transparent",border:"1px solid #3b1f5c",borderRadius:6,color:"#64748b",fontSize:12,cursor:"pointer"}}>Anuluj</button>
      </div>
    </div>
  );
  // Display mode
  const total=shots.home+shots.away||1;
  return(
    <div style={{marginTop:10,background:"#0c0a1d",borderRadius:8,padding:12,border:"1px solid #3b1f5c"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:700,color:"#475569"}}>📊 Statystyki</div>
        {!readOnly&&<button onClick={()=>setEditing(true)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:11}}>✏️</button>}
      </div>
      <Bar left={shots.home} right={shots.away} label="Posiadanie %" lc="#ff6b35" rc2="#00d9c0"/>
      <Bar left={shots.homeShotsOn} right={shots.awayShotsOn} label="Strzały celne"/>
      <Bar left={shots.homeShots} right={shots.awayShots} label="Strzały ogółem"/>
      <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:8,fontSize:10}}>
        <span style={{color:"#ff6b35"}}>■ {goals.teamAName||"Dom"}</span>
        <span style={{color:"#00d9c0"}}>■ {goals.teamBName||"Gość"}</span>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function MainApp(){
  const[players,setPlayers]=useState(DEFAULT_PLAYERS);
  const[criteria,setCriteria]=useState(DEFAULT_CRITERIA);
  const[view,setView]=useState("ranking");
  const[selP,setSelP]=useState(null);
  const[wiz,setWiz]=useState(EMPTY_WIZ());
  const[opForm,setOpForm]=useState({playerId:"",text:"",sentiment:"neutral"});
  const[toast,setToast]=useState(null);
  const[editCrit,setEditCrit]=useState(null);
  const[newCrit,setNewCrit]=useState({label:"",desc:"",points:"0.20",cat:"pos"});
  const[lastSync,setLastSync]=useState(null);
  const pollRef=useRef(null);
  const lastTs=useRef(null);
  const mounted=useRef(false);

  function showToast(msg,col="#ff6b35"){setToast({msg,col});setTimeout(()=>setToast(null),2800);}

  async function saveToStorage(p,c){
    try{
      const ts=Date.now();
      const payload = { players: p, criteria: c, ts };
      const jsonStr = JSON.stringify(payload);
      const sizeKB = (jsonStr.length / 1024).toFixed(1);

      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonStr,
      });

      if(!res.ok){
        const errText = await res.text().catch(()=>"");
        showToast(`⚠️ Błąd zapisu (${res.status}): ${errText.slice(0,80)}`, "#ef4444");
        return;
      }

      lastTs.current=ts;
      setLastSync(new Date(ts).toLocaleTimeString("pl-PL"));
      showToast(`💾 Zapisano! (${sizeKB}KB)`);
    }catch(e){
      console.error("Save error:", e);
      const msg = e?.message || "nieznany błąd";
      showToast("⚠️ "+msg, "#ef4444");
    }
  }

  async function loadFromStorage(){
    try{
      const res = await fetch("/api/data");
      if(!res.ok) return; // no data yet, that's fine
      const data = await res.json();
      if(data?.players) setPlayers(data.players);
      if(data?.criteria) setCriteria(data.criteria);
      if(data?.ts){
        lastTs.current = data.ts;
        setLastSync(new Date(data.ts).toLocaleTimeString("pl-PL"));
      }
    }catch(e){
      console.error("Load error:", e);
    }
  }

  useEffect(()=>{
    loadFromStorage();
    const interval = setInterval(loadFromStorage, 5000);
    return () => clearInterval(interval);
  },[]);

  function submitMatchWizard(){
    const{date,teamAName,teamBName,teamA,teamB,goals,ratings}=wiz;
    const sA=goals.filter(g=>g.teamSide==="A").length;
    const sB=goals.filter(g=>g.teamSide==="B").length;
    const score=`${sA}:${sB}`;
    const resFor=side=>{if(sA===sB)return"Remis";if(side==="A")return sA>sB?"Wygrana":"Przegrana";return sB>sA?"Wygrana":"Przegrana";};
    const mid=Date.now();
    setPlayers(prev=>prev.map(p=>{
      const inA=teamA.includes(p.id),inB=teamB.includes(p.id);
      if(!inA&&!inB)return p;
      const side=inA?"A":"B";
      const opp=side==="A"?(teamBName||"Drużyna B"):(teamAName||"Drużyna A");
      const r=ratings[p.id]||{criteria:{},note:""};
      const crit={...r.criteria};
      goals.forEach(g=>{if(g.scorer===p.id){const t=g.type;if(t==="screamer")crit.screamer=(parseInt(crit.screamer||0)+1);else if(t==="freekick")crit.freekick=(parseInt(crit.freekick||0)+1);else if(t==="header")crit.header=(parseInt(crit.header||0)+1);else crit.goal=(parseInt(crit.goal||0)+1);}if(g.assist===p.id)crit.assist=(parseInt(crit.assist||0)+1);});
      const rating=calcMatchRating(crit,criteria);
      return{...p,matches:[...p.matches,{id:mid+Math.random(),date,opponent:opp,score,result:resFor(side),rating,criteria:crit,note:r.note,goals:goals.filter(g=>g.scorer===p.id||g.assist===p.id),teamA,teamB,teamAName,teamBName,shots:null}]};
    }));
    showToast(`✅ Mecz zapisany! ${sA}:${sB}`);
    setWiz(EMPTY_WIZ());
    setView("ranking");
  }

  function updateMatchShots(playerId,matchId,shots){
    setPlayers(prev=>prev.map(p=>{
      if(p.id!==playerId)return p;
      return{...p,matches:p.matches.map(m=>m.id===matchId?{...m,shots}:m)};
    }));
  }

  const sorted=[...players].sort((a,b)=>calcValue(b)-calcValue(a));
  const inp={background:"#221640",border:"1px solid #3b1f5c",borderRadius:6,color:"#e2e8f0",padding:"7px 10px",fontSize:13,width:"100%",boxSizing:"border-box"};

  // ── NAV ────────────────────────────────────────────────────────────────────
  const navItems=[["ranking","🏆"],["history","📅"],["stats","📊"],["add","➕"],["opinions","💬"],["criteria","📋"],["editor","⚙️"]];

  return(
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at top,#1a0f2e 0%,#0c0a1d 60%)",color:"#e2e8f0",fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:80}}>
      {/* TOP BAR */}
      <div style={{background:"#150d2e",borderBottom:"1px solid #221640",padding:"12px 20px"}}>
        <div style={{maxWidth:720,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,letterSpacing:-0.5,background:"linear-gradient(135deg,#ff6b35,#ffb088 40%,#00d9c0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              🔥 WAKACJE FC
            </div>
            <div style={{fontSize:10,color:"#334155"}}>sync: {lastSync||"—"}</div>
          </div>
          <button onClick={()=>saveToStorage(players,criteria)}
            style={{background:"linear-gradient(135deg,#ff6b35,#e0289d)",border:"none",borderRadius:8,color:"#fff",padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            💾 Zapisz
          </button>
        </div>
      </div>

      <div style={{maxWidth:720,margin:"0 auto",padding:"0 16px"}}>
        {toast&&<div style={{background:toast.col,borderRadius:8,padding:"10px 16px",marginTop:14,fontSize:13,fontWeight:600}}>{toast.msg}</div>}

        {/* ── RANKING ── */}
        {view==="ranking"&&(
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,color:"#334155",marginBottom:14,letterSpacing:.5}}>TABELA WARTOŚCI RYNKOWYCH</div>
            {sorted.map((p,i)=>{
              const avg=getAvgRating(p.matches),val=calcValue(p),trend=getTrend(p.matches),chg=val-p.value;
              const formBonus=checkFormBonus(p);
              return(
                <div key={p.id} onClick={()=>{setSelP(p.id);setView("player");}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#ff6b35"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#221640"}
                  style={{background:"#150d2e",border:"1px solid #221640",borderRadius:10,padding:"13px 16px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"border-color .15s"}}>
                  <div style={{width:26,textAlign:"center",fontWeight:900,fontSize:15,color:i<3?["#fbbf24","#c9a8e0","#b45309"][i]:"#3b1f5c"}}>#{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:"#e2e8f0"}}>{p.name} <span style={{fontSize:11,color:"#334155",fontWeight:400}}>· {p.position}</span>
                      {formBonus&&<span style={{fontSize:9,background:"rgba(251,191,36,.2)",border:"1px solid #fbbf24",color:"#fbbf24",borderRadius:3,padding:"1px 5px",marginLeft:6}}>🔥 FORMA +30%</span>}
                    </div>
                    <div style={{fontSize:11,color:"#334155",marginTop:1}}>{p.matches.length} meczów</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:22,fontWeight:900,color:avg?rc(avg):"#3b1f5c",lineHeight:1}}>
                      {avg?avg.toFixed(2):"—"}
                      <span style={{fontSize:11,marginLeft:3,color:trend==="▲"?"#22c55e":trend==="▼"?"#ef4444":"#334155"}}>{trend}</span>
                    </div>
                    <div style={{fontSize:10,color:"#334155",marginBottom:2}}>śr. {p.matches.length} meczów</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{fv(val)}</div>
                    <div style={{fontSize:10,color:chg>=0?"#22c55e":"#ef4444"}}>{chg>=0?"+":""}{fv(Math.abs(chg))}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── MATCH HISTORY ── */}
        {view==="history"&&(()=>{
          // Collect all unique matches (by date+score+opponent)
          const allMatches=[];
          const seen=new Set();
          players.forEach(p=>p.matches.forEach(m=>{
            const key=`${m.date}|${m.score}|${m.opponent}`;
            if(!seen.has(key)){seen.add(key);allMatches.push({...m,playersList:[]});}
          }));
          // Now enrich each match with all players who played
          const enriched=allMatches.map(bm=>{
            const key=`${bm.date}|${bm.score}|${bm.opponent}`;
            const inMatch=players.filter(p=>p.matches.some(m=>`${m.date}|${m.score}|${m.opponent}`===key));
            return{...bm,inMatch};
          }).sort((a,b)=>b.date.localeCompare(a.date));

          const gico={screamer:"🚀",header:"🦁",freekick:"🌀",penalty:"🫵",normal:"⚽",noAssist:"⚽"};
          if(!enriched.length) return <div style={{marginTop:30,textAlign:"center",color:"#334155",fontSize:13}}>Brak meczów w historii</div>;
          return(
            <div style={{marginTop:20}}>
              <div style={{fontSize:11,color:"#334155",marginBottom:14,letterSpacing:.5}}>HISTORIA MECZÓW</div>
              {enriched.map((m,mi)=>{
                // Get all goals from any player that played this match
                const matchKey=`${m.date}|${m.score}|${m.opponent}`;
                let allGoals=[];
                players.forEach(p=>{
                  const pm=p.matches.find(x=>`${x.date}|${x.score}|${x.opponent}`===matchKey);
                  if(pm&&pm.goals) allGoals=[...allGoals,...pm.goals.filter(g=>g.scorer===p.id)];
                });
                const uniqueGoals=[...new Map(allGoals.map(g=>[g.id,g])).values()].sort((a,b)=>(parseInt(a.minute)||99)-(parseInt(b.minute)||99));
                const tAN=m.teamAName||"Drużyna A",tBN=m.teamBName||"Drużyna B";
                const [sA,sB]=m.score?.split(":")?.map(Number)||[0,0];
                // Shot map from first player's match data
                const firstPlayer=m.inMatch[0];
                const pm0=firstPlayer?.matches.find(x=>`${x.date}|${x.score}|${x.opponent}`===matchKey);
                const shots=pm0?.shots||null;
                return(
                  <div key={mi} style={{background:"#150d2e",border:"1px solid #221640",borderRadius:12,padding:18,marginBottom:14}}>
                    {/* Header */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                      <div>
                        <div style={{fontSize:11,color:"#334155",marginBottom:4}}>{m.date}</div>
                        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{tAN} <span style={{color:"#334155"}}>vs</span> {tBN}</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>
                          <span style={{color:"#ffb088"}}>{sA}</span>
                          <span style={{color:"#334155",margin:"0 4px"}}>:</span>
                          <span style={{color:"#7ef5e5"}}>{sB}</span>
                        </div>
                      </div>
                    </div>
                    {/* Squads */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                      {[{tN:tAN,side:"A",ac:"#ffb088"},{tN:tBN,side:"B",ac:"#7ef5e5"}].map(({tN,side,ac})=>{
                        const tIds=side==="A"?(m.teamA||[]):(m.teamB||[]);
                        const sidePlayers=tIds.length?tIds.map(id=>PLAYERS.find(p=>p.id===id)).filter(Boolean):m.inMatch.filter(p=>{const pm=p.matches.find(x=>`${x.date}|${x.score}|${x.opponent}`===matchKey);return pm?.result===(side==="A"?"Wygrana":"Przegrana")||pm?.result==="Remis";});
                        return(
                          <div key={side}>
                            <div style={{fontSize:10,fontWeight:700,color:ac,marginBottom:5}}>{tN}</div>
                            {m.inMatch.filter(p=>{const pm=p.matches.find(x=>`${x.date}|${x.score}|${x.opponent}`===matchKey);return pm;}).filter(p=>tIds.length?tIds.includes(p.id):true).map(p=>{
                              const pm=p.matches.find(x=>`${x.date}|${x.score}|${x.opponent}`===matchKey);
                              if(!pm)return null;
                              const r=safeR(pm);
                              const pG=uniqueGoals.filter(g=>g.scorer===p.id).length;
                              const pA=uniqueGoals.filter(g=>g.assist===p.id).length;
                              return(
                                <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid #221640"}}>
                                  <div style={{fontSize:12,color:"#c9a8e0"}}>
                                    {p.name}
                                    {pG>0&&<span style={{fontSize:10,color:"#ffb088",marginLeft:4}}>⚽{pG}</span>}
                                    {pA>0&&<span style={{fontSize:10,color:"#5eead4",marginLeft:2}}>🎯{pA}</span>}
                                  </div>
                                  <span style={{fontSize:13,fontWeight:800,color:rc(r)}}>{r.toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                    {/* Goal timeline */}
                    {uniqueGoals.length>0&&(
                      <div style={{marginBottom:10}}>
                        <div style={{fontSize:10,color:"#334155",marginBottom:6,letterSpacing:.5}}>GOLE</div>
                        {uniqueGoals.map((g,gi)=>{
                          const sc=PLAYERS.find(p=>p.id===g.scorer),as=PLAYERS.find(p=>p.id===g.assist);
                          const isA=g.teamSide==="A";
                          return(
                            <div key={gi} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 8px",background:"#0c0a1d",borderRadius:5,marginBottom:3,borderLeft:`2px solid ${isA?"#ff6b35":"#00d9c0"}`}}>
                              <span style={{fontSize:11,color:"#475569",minWidth:24}}>{g.minute?g.minute+"'":"—"}</span>
                              <span style={{fontSize:12}}>{gico[g.type]||"⚽"}</span>
                              <span style={{fontWeight:700,fontSize:12,color:"#e2e8f0"}}>{sc?.name||"?"}</span>
                              {as&&<span style={{fontSize:11,color:"#5eead4"}}>🎯{as.name}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Shot map */}
                    <ShotMap shots={shots} goals={{teamAName:tAN,teamBName:tBN}}
                      readOnly={false}
                      onSave={newShots=>{
                        const firstPId=m.inMatch[0]?.id;
                        const firstM=m.inMatch[0]?.matches.find(x=>`${x.date}|${x.score}|${x.opponent}`===matchKey);
                        if(firstPId&&firstM) updateMatchShots(firstPId,firstM.id,newShots);
                      }}/>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── STATS ── */}
        {view==="stats"&&(()=>{
          function sumC(player,...ids){return player.matches.reduce((t,m)=>t+ids.reduce((s,id)=>s+parseInt((m.criteria||{})[id]||0),0),0);}
          const boards=[
            {title:"Strzelcy",emoji:"⚽",col:"#ff6b35",unit:"goli",data:[...players].map(p=>({name:p.name,pos:p.position,n:sumC(p,"goal","header","freekick","screamer")})).sort((a,b)=>b.n-a.n).filter(x=>x.n>0)},
            {title:"Asystenci",emoji:"🎯",col:"#14b8a6",unit:"asyst",data:[...players].map(p=>({name:p.name,pos:p.position,n:sumC(p,"assist")})).sort((a,b)=>b.n-a.n).filter(x=>x.n>0)},
            {title:"Bengery",emoji:"🚀",col:"#f97316",unit:"szt.",data:[...players].map(p=>({name:p.name,pos:p.position,n:sumC(p,"screamer")})).sort((a,b)=>b.n-a.n).filter(x=>x.n>0)},
            {title:"Siatkówki",emoji:"🍑",col:"#a855f7",unit:"szt.",data:[...players].map(p=>({name:p.name,pos:p.position,n:sumC(p,"nutmeg")})).sort((a,b)=>b.n-a.n).filter(x=>x.n>0)},
          ];
          return(
            <div style={{marginTop:20}}>
              <div style={{fontSize:11,color:"#334155",marginBottom:14,letterSpacing:.5}}>STATYSTYKI</div>
              {boards.map(b=>(
                <div key={b.title} style={{background:"#150d2e",border:"1px solid #221640",borderRadius:12,padding:16,marginBottom:12}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:12,color:"#e2e8f0"}}>{b.emoji} {b.title}</div>
                  {b.data.length===0?<div style={{fontSize:12,color:"#334155",fontStyle:"italic"}}>Brak danych</div>
                  :b.data.map((row,i)=>{
                    const pct=b.data[0].n>0?(row.n/b.data[0].n)*100:0;
                    return(
                      <div key={row.name} style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <div style={{display:"flex",alignItems:"center",gap:7}}>
                            <span style={{fontWeight:800,fontSize:13,color:i===0?"#fbbf24":i===1?"#c9a8e0":i===2?"#b45309":"#3b1f5c",width:20}}>#{i+1}</span>
                            <span style={{fontWeight:700,fontSize:13,color:"#e2e8f0"}}>{row.name}</span>
                            <span style={{fontSize:11,color:"#334155"}}>{row.pos}</span>
                          </div>
                          <span style={{fontWeight:900,fontSize:15,color:b.col}}>{row.n} <span style={{fontSize:11,color:"#475569",fontWeight:400}}>{b.unit}</span></span>
                        </div>
                        <div style={{height:5,background:"#221640",borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:b.col,borderRadius:3}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* Player cards */}
              <div style={{fontSize:11,color:"#334155",marginBottom:10,letterSpacing:.5}}>KARTY ZAWODNIKÓW</div>
              {[...players].filter(p=>p.matches.length>0).sort((a,b)=>sumC(b,"goal","screamer","freekick","header")-sumC(a,"goal","screamer","freekick","header")).map(p=>{
                const avg=getAvgRating(p.matches);
                const stats=[["⚽",sumC(p,"goal","header","freekick","screamer"),"Gole","#ff6b35"],["🎯",sumC(p,"assist"),"Asysty","#14b8a6"],["🚀",sumC(p,"screamer"),"Bengery","#f97316"],["🍑",sumC(p,"nutmeg"),"Siatk.","#a855f7"],["🔥",sumC(p,"clutch"),"Clutch","#fbbf24"],["🤦",sumC(p,"miss","penalty_miss"),"Pudła","#ef4444"],["😬",sumC(p,"own_goal"),"Samob.","#b91c1c"],["💀",sumC(p,"lost_ball_danger"),"Straty","#ef4444"]];
                return(
                  <div key={p.id} style={{background:"#150d2e",border:"1px solid #221640",borderRadius:10,padding:"13px 14px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div><span style={{fontWeight:800,fontSize:14,color:"#e2e8f0"}}>{p.name}</span><span style={{fontSize:11,color:"#334155",marginLeft:6}}>{p.position} · {p.matches.length}M</span></div>
                      <span style={{fontSize:18,fontWeight:900,color:avg?rc(avg):"#3b1f5c"}}>{avg?avg.toFixed(2):"—"}</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                      {stats.map(([ico,val,label,col])=>(
                        <div key={label} style={{background:"#0c0a1d",borderRadius:7,padding:"7px 8px",textAlign:"center"}}>
                          <div style={{fontSize:14}}>{ico}</div>
                          <div style={{fontWeight:900,fontSize:17,color:val>0?col:"#3b1f5c",lineHeight:1.1}}>{val}</div>
                          <div style={{fontSize:9,color:"#334155",marginTop:2}}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── ADD MATCH ── */}
        {view==="add"&&<MatchWizard wiz={wiz} setWiz={setWiz} players={players} criteria={criteria} onSubmit={submitMatchWizard}/>}

        {/* ── OPINIONS ── */}
        {view==="opinions"&&(
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,color:"#334155",marginBottom:14,letterSpacing:.5}}>OPINIE KLASY</div>
            <div style={{background:"#150d2e",border:"1px solid #221640",borderRadius:12,padding:20}}>
              <label style={{fontSize:12,color:"#64748b",display:"block",marginBottom:4}}>Zawodnik</label>
              <select value={opForm.playerId} onChange={e=>setOpForm(f=>({...f,playerId:e.target.value}))}
                style={{...inp,marginBottom:12}}>
                <option value="">— wybierz —</option>
                {PLAYERS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {[["positive","👍","#22c55e"],["neutral","😐","#64748b"],["negative","👎","#ef4444"]].map(([s,e,c])=>(
                  <button key={s} onClick={()=>setOpForm(f=>({...f,sentiment:s}))}
                    style={{flex:1,padding:"8px",borderRadius:6,border:`1px solid ${opForm.sentiment===s?c:"#3b1f5c"}`,background:opForm.sentiment===s?c+"22":"transparent",color:opForm.sentiment===s?c:"#475569",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                    {e}
                  </button>
                ))}
              </div>
              <textarea value={opForm.text} onChange={e=>setOpForm(f=>({...f,text:e.target.value}))} placeholder="Co klasa uważa?" rows={3}
                style={{...inp,resize:"vertical",marginBottom:12}}/>
              <button onClick={()=>{if(!opForm.playerId||!opForm.text.trim())return;setPlayers(prev=>prev.map(p=>{if(p.id!==opForm.playerId)return p;return{...p,opinions:[...p.opinions,{date:new Date().toISOString().slice(0,10),text:opForm.text,sentiment:opForm.sentiment}]};}));showToast("💬 Opinia dodana!");setOpForm({playerId:"",text:"",sentiment:"neutral"});}}
                style={{width:"100%",padding:"11px",background:"#ff6b35",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Dodaj opinię
              </button>
            </div>
          </div>
        )}

        {/* ── CRITERIA ── */}
        {view==="criteria"&&(
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,color:"#334155",marginBottom:14,letterSpacing:.5}}>KRYTERIA OCENIANIA · start: {BASE_RATING}</div>
            {["pos","gk_pos","neg","gk_neg"].map(cat=>(
              <div key={cat} style={{marginBottom:18}}>
                <div style={{fontSize:10,fontWeight:700,color:cat.includes("neg")?"#ef4444":"#ff6b35",marginBottom:8,letterSpacing:.8,textTransform:"uppercase"}}>{CAT_LABELS[cat]}</div>
                {criteria.filter(c=>c.cat===cat).map(c=>(
                  <div key={c.id} style={{background:"#150d2e",border:"1px solid #221640",borderRadius:7,padding:"10px 13px",marginBottom:5,display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontSize:18,width:26}}>{c.label.split(" ")[0]}</div>
                    <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12,color:"#e8d5f5"}}>{c.label.split(" ").slice(1).join(" ")}</div><div style={{fontSize:10,color:"#334155",marginTop:1}}>{c.desc}</div></div>
                    <div style={{fontWeight:800,fontSize:14,color:c.points>0?"#ff6b35":"#ef4444"}}>{c.points>0?"+":""}{c.points}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── EDITOR ── */}
        {view==="editor"&&(
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,color:"#334155",marginBottom:14,letterSpacing:.5}}>EDYTOR KRYTERIÓW</div>
            <div style={{background:"#150d2e",border:"1px solid #ff6b35",borderRadius:12,padding:18,marginBottom:18}}>
              <div style={{fontSize:13,fontWeight:700,color:"#ffb088",marginBottom:12}}>➕ Nowe kryterium</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Nazwa</label><input value={newCrit.label} onChange={e=>setNewCrit(f=>({...f,label:e.target.value}))} placeholder="🌟 Nazwa" style={inp}/></div>
                <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Punkty</label><input value={newCrit.points} onChange={e=>setNewCrit(f=>({...f,points:e.target.value}))} placeholder="0.30" style={inp}/></div>
              </div>
              <label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Opis</label>
              <input value={newCrit.desc} onChange={e=>setNewCrit(f=>({...f,desc:e.target.value}))} placeholder="Opis" style={{...inp,marginBottom:8}}/>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                {Object.entries({pos:"⚽+",gk_pos:"🧤+",neg:"🔴−",gk_neg:"🔴BR−"}).map(([k,l])=>(
                  <button key={k} onClick={()=>setNewCrit(f=>({...f,cat:k}))}
                    style={{padding:"5px 10px",borderRadius:5,border:`1px solid ${newCrit.cat===k?"#ff6b35":"#3b1f5c"}`,background:newCrit.cat===k?"rgba(255,107,53,.2)":"transparent",color:newCrit.cat===k?"#ffb088":"#475569",fontSize:12,cursor:"pointer"}}>{l}</button>
                ))}
              </div>
              <button onClick={()=>{if(!newCrit.label.trim())return;const pts=parseFloat(newCrit.points);if(isNaN(pts))return;setCriteria(prev=>[...prev,{id:"c_"+Date.now(),label:newCrit.label.trim(),desc:newCrit.desc.trim()||"—",points:pts,cat:newCrit.cat}]);setNewCrit({label:"",desc:"",points:"0.20",cat:"pos"});showToast("✅ Dodano!");}}
                style={{width:"100%",padding:"10px",background:"#ff6b35",border:"none",borderRadius:7,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Dodaj kryterium</button>
            </div>
            {["pos","gk_pos","neg","gk_neg"].map(cat=>(
              <div key={cat} style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:cat.includes("neg")?"#ef4444":"#ff6b35",marginBottom:7,letterSpacing:.8,textTransform:"uppercase"}}>{CAT_LABELS[cat]}</div>
                {criteria.filter(c=>c.cat===cat).map(c=>(
                  <div key={c.id} style={{background:"#150d2e",border:"1px solid #221640",borderRadius:7,padding:"9px 13px",marginBottom:5}}>
                    {editCrit?.id===c.id?(
                      <div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
                          <input value={editCrit.label} onChange={e=>setEditCrit(f=>({...f,label:e.target.value}))} style={{...inp,fontSize:12,padding:"5px 8px",border:"1px solid #ff6b35"}}/>
                          <input value={editCrit.points} onChange={e=>setEditCrit(f=>({...f,points:e.target.value}))} style={{...inp,fontSize:12,padding:"5px 8px",border:"1px solid #ff6b35"}}/>
                        </div>
                        <input value={editCrit.desc} onChange={e=>setEditCrit(f=>({...f,desc:e.target.value}))} style={{...inp,fontSize:12,padding:"5px 8px",marginBottom:7}}/>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>{const pts=parseFloat(editCrit.points);if(isNaN(pts))return;setCriteria(prev=>prev.map(x=>x.id===c.id?{...editCrit,points:pts}:x));setEditCrit(null);showToast("✅ Zapisano!");}} style={{flex:1,padding:"6px",background:"#ff6b35",border:"none",borderRadius:5,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Zapisz</button>
                          <button onClick={()=>setEditCrit(null)} style={{padding:"6px 12px",background:"transparent",border:"1px solid #3b1f5c",borderRadius:5,color:"#64748b",fontSize:12,cursor:"pointer"}}>Anuluj</button>
                        </div>
                      </div>
                    ):(
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{fontSize:17,width:24}}>{c.label.split(" ")[0]}</div>
                        <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12,color:"#e8d5f5"}}>{c.label.split(" ").slice(1).join(" ")}</div><div style={{fontSize:10,color:"#334155"}}>{c.desc}</div></div>
                        <div style={{fontWeight:800,fontSize:13,color:c.points>0?"#ff6b35":"#ef4444",marginRight:6}}>{c.points>0?"+":""}{c.points}</div>
                        <button onClick={()=>setEditCrit({...c,points:String(c.points)})} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:13,padding:"2px 5px"}}>✏️</button>
                        <button onClick={()=>{if(window.confirm(`Usunąć "${c.label}"?`)){setCriteria(prev=>prev.filter(x=>x.id!==c.id));showToast("🗑️ Usunięto");}}} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:13,padding:"2px 5px"}}>🗑️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── PLAYER DETAIL ── */}
        {view==="player"&&selP&&(()=>{
          const p=players.find(x=>x.id===selP);if(!p)return null;
          const avg=getAvgRating(p.matches),val=calcValue(p),chg=val-p.value,form=checkFormBonus(p);
          const gico={screamer:"🚀",header:"🦁",freekick:"🌀",penalty:"🫵",normal:"⚽",noAssist:"⚽"};
          let running=p.value;
          const mwv=p.matches.map(m=>{
            const r=safeR(m);
            const pct=getSessionChangePct(running,r-BASE_RATING);
            const delta=Math.round(running*pct);
            const ps=running>0?((delta/running)*100).toFixed(1):"0";
            running=Math.max(running+delta,100_000);
            return{...m,rating:r,valDelta:delta,valPct:ps};
          });
          return(
            <div style={{marginTop:16}}>
              <button onClick={()=>setView("ranking")} style={{background:"none",border:"none",color:"#ff6b35",cursor:"pointer",fontSize:13,marginBottom:12,padding:0}}>← Ranking</button>
              <div style={{background:"#150d2e",border:"1px solid #221640",borderRadius:12,padding:18,marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:22,fontWeight:900,color:"#e2e8f0"}}>{p.name}</div>
                    <div style={{fontSize:12,color:"#475569"}}>{p.position} · {p.matches.length} meczów</div>
                    {form&&<div style={{fontSize:10,background:"rgba(251,191,36,.15)",border:"1px solid #fbbf24",color:"#fbbf24",borderRadius:4,padding:"2px 7px",marginTop:5,display:"inline-block"}}>🔥 FORMA AKTYWNA · +30% wartość</div>}
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      {[["Wygrana","#22c55e","W"],["Remis","#f59e0b","R"],["Przegrana","#ef4444","P"]].map(([res,col,ico])=>{const cnt=p.matches.filter(m=>m.result===res).length;return cnt?<span key={res} style={{fontSize:11,fontWeight:700,color:col}}>{ico} {cnt}</span>:null;})}
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:30,fontWeight:900,color:avg?rc(avg):"#3b1f5c",lineHeight:1}}>{avg?avg.toFixed(2):"—"}</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginTop:2}}>{fv(val)}</div>
                    <div style={{fontSize:11,color:chg>=0?"#22c55e":"#ef4444"}}>{chg>=0?"+":""}{fv(Math.abs(chg))} vs baza</div>
                  </div>
                </div>
              </div>
              {mwv.length>0&&(
                <div style={{background:"#150d2e",border:"1px solid #221640",borderRadius:12,padding:18,marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#334155",marginBottom:12,letterSpacing:.5}}>HISTORIA MECZÓW</div>
                  {[...mwv].reverse().map((m,i)=>{
                    const rc2=RESULT_COLOR[m.result]||"#475569";
                    return(
                      <div key={i} style={{background:"#0c0a1d",borderRadius:9,padding:"11px 13px",marginBottom:8,border:`1px solid ${rc2}22`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{width:20,height:20,borderRadius:4,background:rc2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff"}}>{RESULT_ICON[m.result]}</span>
                            <div><div style={{fontWeight:700,fontSize:13,color:"#e2e8f0"}}>vs {m.opponent||"—"}</div><div style={{fontSize:10,color:"#334155"}}>{m.date} · <span style={{fontWeight:700,color:rc2}}>{m.score||"?:?"}</span></div></div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:20,fontWeight:900,color:rc(m.rating)}}>{m.rating.toFixed(2)}</div>
                            <div style={{fontSize:10,color:m.valDelta>=0?"#22c55e":"#ef4444"}}>{m.valDelta>=0?"+":""}{fv(Math.abs(m.valDelta))} ({m.valDelta>=0?"+":""}{m.valPct}%)</div>
                          </div>
                        </div>
                        {Array.isArray(m.goals)&&m.goals.length>0&&(
                          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:5}}>
                            {m.goals.filter(g=>g.scorer===p.id).map((g,gi)=><span key={gi} style={{background:"rgba(255,107,53,.2)",border:"1px solid #ff6b35",borderRadius:4,padding:"2px 7px",fontSize:10,color:"#ffb088"}}>{gico[g.type]||"⚽"}{g.minute?" "+g.minute+"'":""}</span>)}
                            {m.goals.filter(g=>g.assist===p.id).map((g,gi)=><span key={gi} style={{background:"rgba(20,184,166,.2)",border:"1px solid #14b8a6",borderRadius:4,padding:"2px 7px",fontSize:10,color:"#5eead4"}}>🎯{g.minute?" "+g.minute+"'":""}</span>)}
                          </div>
                        )}
                        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                          {criteria.filter(c=>parseInt((m.criteria||{})[c.id]||0)>0).map(c=>(
                            <span key={c.id} style={{background:c.points>0?"rgba(255,107,53,.1)":"rgba(239,68,68,.1)",border:`1px solid ${c.points>0?"#ff6b35":"#ef4444"}`,borderRadius:3,padding:"1px 6px",fontSize:10,color:c.points>0?"#ffb088":"#fca5a5"}}>
                              {c.label.split(" ")[0]} ×{m.criteria[c.id]}
                            </span>
                          ))}
                        </div>
                        {m.note&&<div style={{fontSize:11,color:"#334155",marginTop:5,fontStyle:"italic"}}>"{m.note}"</div>}
                      </div>
                    );
                  })}
                </div>
              )}
              {p.opinions.length>0&&(
                <div style={{background:"#150d2e",border:"1px solid #221640",borderRadius:12,padding:18}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#334155",marginBottom:10,letterSpacing:.5}}>OPINIE</div>
                  {p.opinions.map((o,i)=>(
                    <div key={i} style={{borderLeft:`3px solid ${o.sentiment==="positive"?"#22c55e":o.sentiment==="negative"?"#ef4444":"#334155"}`,paddingLeft:10,marginBottom:8}}>
                      <div style={{fontSize:12,color:"#c9a8e0"}}>{o.text}</div>
                      <div style={{fontSize:10,color:"#334155",marginTop:1}}>{o.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#150d2e",borderTop:"1px solid #221640",display:"flex",justifyContent:"center",padding:"8px 0"}}>
        <div style={{display:"flex",gap:2,maxWidth:720,width:"100%",padding:"0 8px"}}>
          {navItems.map(([v,icon])=>(
            <button key={v} onClick={()=>{if(v==="add")setWiz(EMPTY_WIZ());setView(v);}}
              style={{flex:1,padding:"8px 4px",background:view===v?"rgba(255,107,53,.15)":"transparent",border:`1px solid ${view===v?"#ff6b35":"transparent"}`,borderRadius:8,color:view===v?"#ffb088":"#334155",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PASSWORD GATE ────────────────────────────────────────────────────────────
// Zmień hasło poniżej na swoje własne!
const SITE_PASSWORD = "wakacje2026";
const AUTH_KEY = "wtm-authed";

export default function App(){
  const[authed,setAuthed]=useState(()=>{
    try{ return localStorage.getItem(AUTH_KEY) === "yes"; }
    catch(e){ return false; }
  });
  const[pw,setPw]=useState("");
  const[err,setErr]=useState(false);

  function tryLogin(){
    if(pw === SITE_PASSWORD){
      try{ localStorage.setItem(AUTH_KEY, "yes"); }catch(e){}
      setAuthed(true);
      setErr(false);
    } else {
      setErr(true);
      setPw("");
    }
  }

  if(authed) return <MainApp/>;

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at top,#1a0f2e 0%,#0c0a1d 60%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif",padding:20}}>
      <div style={{maxWidth:340,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🔥⚽</div>
        <div style={{fontSize:24,fontWeight:900,marginBottom:6,background:"linear-gradient(135deg,#ff6b35,#ffb088 40%,#00d9c0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          WAKACJE FC
        </div>
        <div style={{fontSize:13,color:"#c9a8e0",marginBottom:28}}>Wpisz hasło żeby wejść</div>
        <input
          type="password"
          value={pw}
          onChange={e=>{setPw(e.target.value);setErr(false);}}
          onKeyDown={e=>{ if(e.key==="Enter") tryLogin(); }}
          placeholder="Hasło..."
          autoFocus
          style={{
            display:"block",width:"100%",marginBottom:12,
            background:"#150d2e",border:`1px solid ${err?"#ef4444":"#3b1f5c"}`,
            borderRadius:8,color:"#e2e8f0",padding:"12px 14px",fontSize:15,
            textAlign:"center",boxSizing:"border-box"
          }}
        />
        {err && <div style={{fontSize:12,color:"#ef4444",marginBottom:12}}>❌ Złe hasło, spróbuj jeszcze raz</div>}
        <button onClick={tryLogin}
          style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#ff6b35,#e0289d)",border:"none",borderRadius:8,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>
          Wejdź
        </button>
      </div>
    </div>
  );
}

