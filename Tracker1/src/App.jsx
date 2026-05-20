import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_HABITS = [
  { id: "h1", emoji: "🚭", name: "Keine Zigarette", type: "daily" },
  { id: "h2", emoji: "🍺", name: "Kein Alkohol", type: "daily" },
  { id: "h3", emoji: "💻", name: "1h Programmiert", type: "daily" },
  { id: "h4", emoji: "🏃", name: "1h Bewegung", type: "daily" },
  { id: "h5", emoji: "🏋️", name: "Fitness", type: "weekly", targetDays: 3 },
  { id: "h6", emoji: "💧", name: "2L Wasser", type: "daily" },
  { id: "h7", emoji: "📖", name: "30 Min Lesen", type: "daily" },
];

const DEFAULT_REWARDS = [
  { id: "r1", period: "week",  pct: 75,  emoji: "🍕", title: "Pizza-Abend",        desc: "Gönn dir eine richtig gute Pizza!" },
  { id: "r2", period: "week",  pct: 100, emoji: "🎮", title: "Gaming-Abend",        desc: "Zock so lange du willst!" },
  { id: "r3", period: "month", pct: 75,  emoji: "🍽️", title: "Lieblingsrestaurant", desc: "Essen gehen, wo du willst!" },
  { id: "r4", period: "month", pct: 100, emoji: "🧖", title: "Wellness-Tag",         desc: "Sauna, Massage oder faulenzen." },
  { id: "r5", period: "year",  pct: 75,  emoji: "🎉", title: "Großes Erlebnis",     desc: "Event, Konzert oder Ausflug." },
  { id: "r6", period: "year",  pct: 100, emoji: "✈️", title: "Traumreise",           desc: "Buch die Reise deines Lebens!" },
];

const DEFAULT_STREAK_REWARDS = [
  { id: "sr1", habitId: "h1", days: 7,   emoji: "💪", title: "1 Woche rauchfrei!",    desc: "Deine Lunge dankt es dir." },
  { id: "sr2", habitId: "h1", days: 30,  emoji: "🌟", title: "1 Monat rauchfrei!",    desc: "Enormer Meilenstein!" },
  { id: "sr3", habitId: "h1", days: 100, emoji: "🏆", title: "100 Tage rauchfrei!",   desc: "Gönn dir etwas richtig Großes." },
  { id: "sr4", habitId: "h1", days: 365, emoji: "🚀", title: "1 Jahr rauchfrei!",     desc: "Du bist ein neuer Mensch!" },
  { id: "sr5", habitId: "h2", days: 7,   emoji: "💧", title: "1 Woche kein Alkohol!", desc: "Dein Körper erholt sich." },
  { id: "sr6", habitId: "h2", days: 30,  emoji: "🌙", title: "1 Monat kein Alkohol!", desc: "Besser schlafen, mehr Energie!" },
  { id: "sr7", habitId: "h2", days: 100, emoji: "🎯", title: "100 Tage clean!",       desc: "Absoluter Respekt!" },
  { id: "sr8", habitId: "h2", days: 365, emoji: "👑", title: "1 Jahr kein Alkohol!",  desc: "Lebensveränderung pur." },
];

const PRESET_HABITS = [
  { emoji: "🧘", name: "Meditation", type: "daily" },
  { emoji: "🛌", name: "8h Schlafen", type: "daily" },
  { emoji: "🥗", name: "Gesund gegessen", type: "daily" },
  { emoji: "🚿", name: "Kalt geduscht", type: "daily" },
  { emoji: "📝", name: "Tagebuch", type: "daily" },
  { emoji: "📵", name: "Kein Social Media", type: "daily" },
  { emoji: "☀️", name: "Draußen gewesen", type: "daily" },
  { emoji: "🏊", name: "Schwimmen", type: "weekly", targetDays: 2 },
  { emoji: "📞", name: "Familie angerufen", type: "weekly", targetDays: 2 },
  { emoji: "💰", name: "Finanzen gecheckt", type: "weekly", targetDays: 1 },
];

const EMOJIS = ["🏆","🥇","🎯","🔥","💪","⭐","🌟","💎","👑","🎖️","🚀","🎉","🥂","🍾","🎁","❤️","💙","✅","🙌","💯","🤩","😎","🦁","🐯","⚡","🌈","🏅","🧠","📈","💰","🛡️","🌙","☀️","🌊","🍀","🎨","🔑","🦋"];

const DAY_LABELS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const MONTH_NAMES = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
const PERIOD_LABEL = { week: "Woche", month: "Monat", year: "Jahr" };
const MOTIVATIONS = ["Jeder Tag zählt. 💫","Du schaffst das! 🔥","Konsistenz schlägt Perfektion. 💎","Kleine Schritte, große Wirkung. 🚀","Heute ist dein Tag. ⭐","Mach es. Jetzt. 💪"];
const ONBOARDING = [
  { emoji:"🎯", title:"Willkommen bei TRACKER", sub:"Dein persönlicher Begleiter für bessere Gewohnheiten — jeden Tag.", accent:"#2563eb" },
  { emoji:"🔥", title:"Baue Streaks auf",        sub:"Hake täglich ab und sieh wie dein Streak wächst. Kein Tag aussetzen!", accent:"#f59e0b" },
  { emoji:"🏆", title:"Verdiene Belohnungen",    sub:"Setze dir Ziele und feiere dich selbst — mit Belohnungen die du dir wirklich wünschst.", accent:"#10b981" },
];

// Accent colors per habit index for variety
const HABIT_ACCENTS = ["#2563eb","#10b981","#f59e0b","#ec4899","#8b5cf6","#06b6d4","#ef4444","#14b8a6"];

const getDateKey = d => d.toISOString().split("T")[0];

function getWeekDates(ref) {
  const d = new Date(ref), diff = d.getDay()===0?-6:1-d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate()+diff);
  return Array.from({length:7},(_,i)=>{ const x=new Date(mon); x.setDate(mon.getDate()+i); return x; });
}

function calcStreak(habitId, completions) {
  let s=0; const d=new Date();
  while(completions[`${getDateKey(d)}__${habitId}`]){ s++; d.setDate(d.getDate()-1); }
  return s;
}

function calcPeriodPct(period, habits, completions) {
  const now=new Date(); let dates=[];
  if(period==="week") dates=getWeekDates(now).filter(d=>d<=now);
  else if(period==="month") for(let d=1;d<=now.getDate();d++) dates.push(new Date(now.getFullYear(),now.getMonth(),d));
  else for(let m=0;m<=now.getMonth();m++){const dm=m<now.getMonth()?new Date(now.getFullYear(),m+1,0).getDate():now.getDate();for(let d=1;d<=dm;d++)dates.push(new Date(now.getFullYear(),m,d));}
  if(!dates.length||!habits.length) return 0;
  let total=0,possible=0;
  dates.forEach(date=>habits.forEach(h=>{possible++;if(completions[`${getDateKey(date)}__${h.id}`])total++;}));
  return possible?Math.round((total/possible)*100):0;
}

function getPeriodKey(period) {
  const now=new Date();
  if(period==="week") return `week-${getDateKey(getWeekDates(now)[0])}`;
  if(period==="month") return `month-${now.getFullYear()}-${now.getMonth()}`;
  return `year-${now.getFullYear()}`;
}

const fmtDays = d => d>=365&&d%365===0?`${d/365} Jahr${d/365>1?"e":""}`:d>=365?`${Math.floor(d/365)}J ${d%365}T`:`${d} Tage`;

// ─── CONFETTI ────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const ref=useRef(null), animRef=useRef(null);
  useEffect(()=>{
    if(!active) return;
    const canvas=ref.current; if(!canvas) return;
    const ctx=canvas.getContext("2d");
    canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight;
    const colors=["#2563eb","#10b981","#f59e0b","#ec4899","#8b5cf6","#06b6d4","#ef4444"];
    const pieces=Array.from({length:160},()=>({x:Math.random()*canvas.width,y:Math.random()*-canvas.height,r:Math.random()*8+3,d:Math.random()*80+20,color:colors[Math.floor(Math.random()*colors.length)],tiltAngle:0,tiltSpeed:Math.random()*0.12+0.04}));
    let frame=0;
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p=>{
        p.tiltAngle+=p.tiltSpeed; p.y+=(Math.cos(frame*0.01+p.d)+2+p.r/2)*1.3; p.x+=Math.sin(frame*0.01)*0.8;
        if(p.y>canvas.height){p.y=-10;p.x=Math.random()*canvas.width;}
        const t=Math.sin(p.tiltAngle)*15;
        ctx.beginPath(); ctx.fillStyle=p.color; ctx.globalAlpha=0.9;
        ctx.moveTo(p.x+t+p.r/4,p.y); ctx.lineTo(p.x+t,p.y+t+p.r/4); ctx.lineTo(p.x+t-p.r/4,p.y+t); ctx.closePath(); ctx.fill();
      });
      frame++; animRef.current=requestAnimationFrame(draw);
    };
    draw(); return ()=>cancelAnimationFrame(animRef.current);
  },[active]);
  if(!active) return null;
  return <canvas ref={ref} style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:500}} />;
}

// ─── CELEBRATION ─────────────────────────────────────────────────────────────
function CelebrationPopup({ rewards, onClose }) {
  const [idx,setIdx]=useState(0);
  const r=rewards[idx]; const isStreak=!!r.days;
  const accent=isStreak?"#f59e0b":"#2563eb";
  return (
    <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.6)",backdropFilter:"blur(16px)"}} onClick={onClose} />
      <div style={{position:"relative",background:"white",borderRadius:32,padding:"40px 28px 32px",maxWidth:360,width:"100%",textAlign:"center",boxShadow:`0 32px 80px ${accent}30`,animation:"celebPop 0.5s cubic-bezier(0.34,1.56,0.64,1)",border:`2px solid ${accent}20`}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:6,borderRadius:"32px 32px 0 0",background:`linear-gradient(90deg,${accent},${accent}99)`}} />
        <div style={{fontSize:80,marginBottom:12,lineHeight:1,animation:"float 3s ease-in-out infinite"}}>{r.emoji}</div>
        <div style={{display:"inline-block",padding:"5px 16px",borderRadius:20,marginBottom:16,background:`${accent}15`,color:accent,fontSize:12,fontWeight:800,letterSpacing:"0.08em"}}>
          {isStreak?`🔥 ${fmtDays(r.days).toUpperCase()} STREAK`:`${PERIOD_LABEL[r.period]?.toUpperCase()} · ${r.pct}% ERREICHT`}
        </div>
        <div style={{fontSize:26,fontWeight:900,color:"#0f172a",marginBottom:10,fontFamily:"'Sora',sans-serif"}}>{r.title}</div>
        <div style={{fontSize:15,color:"#64748b",lineHeight:1.6,marginBottom:28}}>{r.desc}</div>
        {rewards.length>1&&<div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:20}}>{rewards.map((_,i)=><div key={i} onClick={()=>setIdx(i)} style={{width:i===idx?24:6,height:6,borderRadius:3,background:i===idx?accent:"#e2e8f0",cursor:"pointer",transition:"all 0.3s"}} />)}</div>}
        {idx<rewards.length-1
          ?<div style={{display:"flex",gap:10}}>
            <button onClick={()=>setIdx(idx+1)} style={{flex:1,padding:14,borderRadius:14,background:accent,border:"none",color:"white",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:`0 8px 24px ${accent}50`}}>Nächste 🎁</button>
            <button onClick={onClose} style={{padding:"14px 18px",borderRadius:14,background:"#f1f5f9",border:"none",color:"#64748b",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer"}}>✕</button>
          </div>
          :<button onClick={onClose} style={{width:"100%",padding:14,borderRadius:14,background:accent,border:"none",color:"white",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:`0 8px 24px ${accent}50`}}>Weiter so! 💪</button>
        }
      </div>
    </div>
  );
}

// ─── ONBOARDING ──────────────────────────────────────────────────────────────
function OnboardingScreen({ onDone }) {
  const [step,setStep]=useState(0);
  const s=ONBOARDING[step];
  return (
    <div style={{position:"fixed",inset:0,zIndex:600,background:"white",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
      <div style={{position:"absolute",inset:0,overflow:"hidden"}}>
        <div style={{position:"absolute",top:"5%",right:"5%",width:280,height:280,borderRadius:"50%",background:`${s.accent}12`,transition:"all 0.8s",filter:"blur(40px)"}} />
        <div style={{position:"absolute",bottom:"15%",left:"0%",width:200,height:200,borderRadius:"50%",background:`${s.accent}10`,transition:"all 0.8s",filter:"blur(30px)"}} />
      </div>
      <div style={{position:"relative",textAlign:"center",maxWidth:340,animation:"fadeSlideUp 0.5s ease"}} key={step}>
        <div style={{width:100,height:100,borderRadius:32,background:`${s.accent}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 28px",fontSize:52,border:`2px solid ${s.accent}20`}}>{s.emoji}</div>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:30,fontWeight:900,color:"#0f172a",marginBottom:14,lineHeight:1.2}}>{s.title}</div>
        <div style={{fontSize:16,color:"#64748b",lineHeight:1.7,marginBottom:48}}>{s.sub}</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:32}}>
          {ONBOARDING.map((_,i)=><div key={i} style={{width:i===step?28:8,height:8,borderRadius:4,background:i===step?s.accent:"#e2e8f0",transition:"all 0.3s"}} />)}
        </div>
        {step<ONBOARDING.length-1
          ?<button onClick={()=>setStep(step+1)} style={{width:"100%",padding:"18px",borderRadius:16,background:s.accent,border:"none",color:"white",fontFamily:"inherit",fontSize:16,fontWeight:800,cursor:"pointer",boxShadow:`0 12px 32px ${s.accent}40`}}>Weiter →</button>
          :<button onClick={onDone} style={{width:"100%",padding:"18px",borderRadius:16,background:s.accent,border:"none",color:"white",fontFamily:"inherit",fontSize:16,fontWeight:800,cursor:"pointer",boxShadow:`0 12px 32px ${s.accent}40`}}>Los geht's! 🚀</button>
        }
      </div>
    </div>
  );
}

// ─── EMOJI PICKER ─────────────────────────────────────────────────────────────
function EmojiPicker({ value, onChange }) {
  const [open,setOpen]=useState(false);
  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(!open)} style={{width:54,height:50,borderRadius:14,border:"2px solid #e2e8f0",background:"#f8fafc",fontSize:22,cursor:"pointer",transition:"all 0.2s"}}>{value}</button>
      {open&&(
        <div style={{position:"absolute",top:58,left:0,background:"white",borderRadius:16,padding:12,border:"2px solid #e2e8f0",boxShadow:"0 16px 48px rgba(0,0,0,0.12)",zIndex:20,display:"flex",flexWrap:"wrap",gap:4,width:240}}>
          {EMOJIS.map(em=><button key={em} onClick={()=>{onChange(em);setOpen(false);}} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",padding:4,borderRadius:8,lineHeight:1,transition:"transform 0.1s"}}>{em}</button>)}
        </div>
      )}
    </div>
  );
}

// ─── RING PROGRESS ───────────────────────────────────────────────────────────
function RingProgress({ pct, size=72, stroke=7, color="#2563eb", children }) {
  const r=(size-stroke)/2, circ=2*Math.PI*r, offset=circ-(pct/100)*circ;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{transition:"stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)"}} />
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{children}</div>
    </div>
  );
}

// ─── HABIT CARD ───────────────────────────────────────────────────────────────
function HabitCard({ habit, done, streak, justDone, onClick, onEdit, onDelete, accentColor }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",gap:12,borderRadius:20,padding:"14px 16px",
      transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",userSelect:"none",
      background: done ? `${accentColor}12` : "white",
      border: done ? `2px solid ${accentColor}40` : "2px solid #f1f5f9",
      boxShadow: done ? `0 4px 20px ${accentColor}20` : "0 2px 8px rgba(0,0,0,0.04)",
      animation: justDone ? "habitPop 0.4s cubic-bezier(0.34,1.56,0.64,1)" : "none",
    }}>
      {/* Tap zone */}
      <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0,cursor:"pointer"}}>
        <div style={{width:46,height:46,borderRadius:14,background:done?`${accentColor}20`:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,transition:"all 0.3s",transform:done?"scale(1.05)":"scale(1)"}}>
          {habit.emoji}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:700,color:done?accentColor:"#0f172a",transition:"color 0.3s",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{habit.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
            {habit.type==="weekly"&&<span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>Ziel: {habit.targetDays}× / Woche</span>}
            {streak>0&&<span style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"white",padding:"1px 8px",borderRadius:10,fontSize:11,fontWeight:800}}>🔥 {streak}T</span>}
          </div>
        </div>
        {/* Check */}
        <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",background:done?accentColor:"white",border:done?"none":`2px solid #e2e8f0`,boxShadow:done?`0 4px 12px ${accentColor}50`:"none",transform:done?"scale(1.1)":"scale(1)"}}>
          {done&&<span style={{color:"white",fontSize:15,fontWeight:900}}>✓</span>}
        </div>
      </div>
      {/* Actions */}
      <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0,marginLeft:4}}>
        <button onClick={e=>{e.stopPropagation();onEdit();}} style={{width:26,height:26,borderRadius:8,background:"#f1f5f9",border:"none",color:"#64748b",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>✎</button>
        <button onClick={e=>{e.stopPropagation();onDelete();}} style={{width:26,height:26,borderRadius:8,background:"#fff1f2",border:"none",color:"#f43f5e",cursor:"pointer",fontSize:13,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>×</button>
      </div>
    </div>
  );
}

// ─── EDIT HABIT PANEL ────────────────────────────────────────────────────────
function EditHabitPanel({ habit, streakRewards, completions, habits, onSave, onClose, onUpdateStreakRewards, save }) {
  const [form,setForm]=useState({...habit});
  const [newMs,setNewMs]=useState({days:30,emoji:"🏆",title:"",desc:""});
  const habitSRs=streakRewards.filter(sr=>sr.habitId===habit.id).sort((a,b)=>a.days-b.days);
  const streak=calcStreak(habit.id,completions);

  const addMs=()=>{
    if(!newMs.title.trim()) return;
    const next=[...streakRewards,{...newMs,habitId:habit.id,id:"sr"+Date.now()}];
    onUpdateStreakRewards(next); save(habits,completions,null,next);
    setNewMs({days:30,emoji:"🏆",title:"",desc:""});
  };
  const delMs=id=>{const next=streakRewards.filter(r=>r.id!==id);onUpdateStreakRewards(next);save(habits,completions,null,next);};

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel" onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,borderRadius:2,background:"#2563eb",margin:"0 auto 24px"}} />
        <div className="panel-title">Habit bearbeiten</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <EmojiPicker value={form.emoji} onChange={em=>setForm({...form,emoji:em})} />
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name" className="inp" style={{flex:1}} />
        </div>
        <div style={{marginBottom:16}}>
          <div className="lbl">Häufigkeit</div>
          <div className="tog-row">
            <button className={`tog${form.type==="daily"?" tog-on":""}`} onClick={()=>setForm({...form,type:"daily"})}>Jeden Tag</button>
            <button className={`tog${form.type==="weekly"?" tog-on":""}`} onClick={()=>setForm({...form,type:"weekly",targetDays:form.targetDays||3})}>X-mal / Woche</button>
          </div>
        </div>
        {form.type==="weekly"&&(
          <div style={{marginBottom:20}}>
            <div className="lbl">Tage pro Woche</div>
            <div style={{display:"flex",gap:8}}>{[1,2,3,4,5,6,7].map(n=><button key={n} onClick={()=>setForm({...form,targetDays:n})} className={`dnum${form.targetDays===n?" dnum-on":""}`}>{n}</button>)}</div>
          </div>
        )}
        {form.type==="daily"&&<div style={{marginBottom:20,padding:"10px 14px",background:"#eff6ff",borderRadius:12,border:"1px solid #bfdbfe"}}><div style={{fontSize:13,color:"#2563eb",fontWeight:700}}>✓ Täglich — 7 von 7 Tagen</div></div>}
        <button className="btn-p" disabled={!form.name.trim()} onClick={()=>onSave(form)}>Habit speichern</button>

        <div style={{marginTop:28,paddingTop:20,borderTop:"2px solid #f1f5f9"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>🔥 Streak-Meilensteine</div>
            <span style={{background:streak>0?"linear-gradient(135deg,#f59e0b,#d97706)":"#f1f5f9",color:streak>0?"white":"#94a3b8",padding:"3px 10px",borderRadius:10,fontSize:11,fontWeight:800}}>{streak} Tage</span>
          </div>
          {habitSRs.length===0&&<div style={{fontSize:12,color:"#94a3b8",marginBottom:14,padding:"10px 14px",background:"#f8fafc",borderRadius:10}}>Noch keine Meilensteine. Füge unten welche hinzu.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {habitSRs.map(sr=>{
              const achieved=streak>=sr.days;
              return (
                <div key={sr.id} style={{display:"flex",alignItems:"center",gap:10,background:achieved?"#fffbeb":"#f8fafc",borderRadius:14,padding:"12px 14px",border:`1.5px solid ${achieved?"#fde68a":"#f1f5f9"}`}}>
                  <span style={{fontSize:22}}>{sr.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:800,color:"#0f172a"}}>{sr.title}</div>
                    <div style={{fontSize:11,color:achieved?"#f59e0b":"#94a3b8",fontWeight:600}}>{fmtDays(sr.days)}{achieved?" ✓ Erreicht!":""}</div>
                    {sr.desc&&<div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{sr.desc}</div>}
                  </div>
                  <button onClick={()=>delMs(sr.id)} style={{width:28,height:28,borderRadius:8,background:"#fff1f2",border:"none",color:"#f43f5e",cursor:"pointer",fontSize:14,fontWeight:800}}>×</button>
                </div>
              );
            })}
          </div>

          <div style={{background:"#f8fafc",borderRadius:16,padding:16,border:"2px solid #f1f5f9"}}>
            <div className="lbl" style={{marginBottom:14}}>Neuer Meilenstein</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <EmojiPicker value={newMs.emoji} onChange={em=>setNewMs({...newMs,emoji:em})} />
              <input value={newMs.title} onChange={e=>setNewMs({...newMs,title:e.target.value})} placeholder="Bezeichnung" className="inp" style={{flex:1}} />
            </div>
            <input value={newMs.desc} onChange={e=>setNewMs({...newMs,desc:e.target.value})} placeholder="Belohnung (optional)" className="inp" style={{marginBottom:12}} />
            <div className="lbl" style={{marginBottom:6}}>Schnellauswahl</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
              {[7,10,21,30,50,100,200,300,365,500,1000,1825,3650,36500].map(d=>{
                const lbl=d===36500?"100J":d>=365&&d%365===0?`${d/365}J`:`${d}T`;
                return <button key={d} onClick={()=>setNewMs({...newMs,days:d})} className={`chip${newMs.days===d?" chip-on":""}`}>{lbl}</button>;
              })}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{flex:1}}><div className="lbl" style={{marginBottom:4}}>Tage</div><input type="number" min={1} max={100000} value={newMs.days} onChange={e=>setNewMs({...newMs,days:Math.max(1,parseInt(e.target.value)||1)})} className="inp" /></div>
              <div style={{flex:1}}><div className="lbl" style={{marginBottom:4}}>Jahre</div><input type="number" min={0} max={274} step={0.5} value={parseFloat((newMs.days/365).toFixed(2))} onChange={e=>setNewMs({...newMs,days:Math.round(parseFloat(e.target.value||0)*365)||1})} className="inp" /></div>
            </div>
            <div style={{fontSize:12,color:"#f59e0b",fontWeight:800,marginBottom:12}}>Ziel: {fmtDays(newMs.days)} 🔥</div>
            <button onClick={addMs} disabled={!newMs.title.trim()} style={{width:"100%",padding:13,borderRadius:12,border:"none",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:newMs.title.trim()?"pointer":"not-allowed",background:newMs.title.trim()?"linear-gradient(135deg,#f59e0b,#d97706)":"#e2e8f0",color:newMs.title.trim()?"white":"#94a3b8",boxShadow:newMs.title.trim()?"0 4px 16px rgba(245,158,11,0.4)":"none",transition:"all 0.2s"}}>
              🔥 Meilenstein hinzufügen
            </button>
          </div>
        </div>
        <button onClick={onClose} style={{width:"100%",marginTop:14,padding:14,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:14,color:"#64748b",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}>Schließen</button>
      </div>
    </div>
  );
}

// ─── HELP VIEW ───────────────────────────────────────────────────────────────
function HelpView() {
  const sections=[
    {emoji:"📋",title:"Heute — Habits abhaken",text:"Tippe auf eine Karte um sie abzuhaken. Mit ✎ bearbeitest du die Habit direkt, mit × löschst du sie. Der Ring oben zeigt deinen Tagesstand."},
    {emoji:"📅",title:"Wochenkalender",text:"Die 7 Tage oben sind anklickbar — so kannst du vergangene Tage nachträglich eintragen."},
    {emoji:"📊",title:"Woche — Statistik",text:"Gesamtperformance in Prozent, Heatmap und Balken pro Habit."},
    {emoji:"🏆",title:"Belohnungen — Zeitraum",text:"Lege Belohnungen für Woche, Monat und Jahr fest. Beim App-Öffnen wird mit Konfetti gefeiert."},
    {emoji:"🔥",title:"Streak-Meilensteine",text:"Direkt beim Habit bearbeiten (✎) kannst du Meilensteine setzen: z.B. 10T, 100T, 1000T."},
    {emoji:"💾",title:"Speichern",text:"Alles wird automatisch gespeichert — '✓' oben rechts bestätigt es."},
  ];
  return (
    <div style={{padding:"18px 16px",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",borderRadius:20,padding:"22px 20px",marginBottom:4,boxShadow:"0 8px 32px rgba(37,99,235,0.3)"}}>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,color:"white",marginBottom:6}}>Wie funktioniert TRACKER?</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>Alles was du brauchst um die App optimal zu nutzen.</div>
      </div>
      {sections.map((s,i)=>(
        <div key={i} style={{background:"white",borderRadius:18,padding:"16px 18px",border:"2px solid #f1f5f9",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{fontSize:22}}>{s.emoji}</span>
            <div style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{s.title}</div>
          </div>
          <div style={{fontSize:13,color:"#64748b",lineHeight:1.6}}>{s.text}</div>
        </div>
      ))}
      <div style={{textAlign:"center",padding:"8px 0",fontSize:12,color:"#94a3b8",fontWeight:600}}>TRACKER — Dein täglicher Begleiter 💙</div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [habits,setHabits]=useState(DEFAULT_HABITS);
  const [completions,setCompletions]=useState({});
  const [rewards,setRewards]=useState(DEFAULT_REWARDS);
  const [streakRewards,setStreakRewards]=useState(DEFAULT_STREAK_REWARDS);
  const [seenRewards,setSeenRewards]=useState({});
  const [celebrationQueue,setCelebrationQueue]=useState([]);
  const [showConfetti,setShowConfetti]=useState(false);
  const [selectedDate,setSelectedDate]=useState(new Date());
  const [view,setView]=useState("day");
  const [rewardTab,setRewardTab]=useState("period");
  const [loaded,setLoaded]=useState(false);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [showAddPanel,setShowAddPanel]=useState(false);
  const [newHabit,setNewHabit]=useState({emoji:"⭐",name:"",type:"daily",targetDays:3});
  const [addMode,setAddMode]=useState("preset");
  const [pendingHabit,setPendingHabit]=useState(null);
  const [saveStatus,setSaveStatus]=useState("");
  const [justChecked,setJustChecked]=useState(null);
  const [editingReward,setEditingReward]=useState(null);
  const [showRewardPanel,setShowRewardPanel]=useState(false);
  const [rewardPanelType,setRewardPanelType]=useState("period");
  const [newReward,setNewReward]=useState({period:"week",pct:80,emoji:"🎁",title:"",desc:""});
  const [newStreakReward,setNewStreakReward]=useState({habitId:"",days:30,emoji:"🔥",title:"",desc:""});
  const [editingHabit,setEditingHabit]=useState(null);
  const [allDoneAnim,setAllDoneAnim]=useState(false);
  const motivation=MOTIVATIONS[new Date().getDay()%MOTIVATIONS.length];

  useEffect(()=>{
    async function load(){
      try{
        const keys=["tracker-habits","tracker-completions","tracker-rewards","tracker-seen","tracker-streak-rewards","tracker-onboarded"];
        const results=await Promise.all(keys.map(k=>window.storage.get(k).catch(()=>null)));
        if(results[0]) setHabits(JSON.parse(results[0].value));
        if(results[1]) setCompletions(JSON.parse(results[1].value));
        if(results[2]) setRewards(JSON.parse(results[2].value));
        if(results[3]) setSeenRewards(JSON.parse(results[3].value));
        if(results[4]) setStreakRewards(JSON.parse(results[4].value));
        if(!results[5]) setShowOnboarding(true);
      }catch(e){setShowOnboarding(true);}
      setLoaded(true);
    }
    load();
  },[]);

  useEffect(()=>{
    if(!loaded) return;
    const due=[];
    rewards.forEach(r=>{const pk=getPeriodKey(r.period),sk=`${r.id}-${pk}`;if(seenRewards[sk])return;if(calcPeriodPct(r.period,habits,completions)>=r.pct)due.push({...r,seenKey:sk});});
    streakRewards.forEach(sr=>{const sk=`streak-${sr.id}-${sr.days}`;if(seenRewards[sk])return;if(calcStreak(sr.habitId,completions)>=sr.days)due.push({...sr,seenKey:sk});});
    if(due.length){setCelebrationQueue(due);setShowConfetti(true);setTimeout(()=>setShowConfetti(false),6000);}
  },[loaded]);

  const dismissCelebration=()=>{
    const next={...seenRewards};celebrationQueue.forEach(r=>{next[r.seenKey]=true;});
    setSeenRewards(next);setCelebrationQueue([]);
    window.storage.set("tracker-seen",JSON.stringify(next)).catch(()=>{});
  };

  const save=useCallback(async(h,c,r,sr)=>{
    try{
      const ops=[window.storage.set("tracker-habits",JSON.stringify(h)),window.storage.set("tracker-completions",JSON.stringify(c))];
      if(r!==null) ops.push(window.storage.set("tracker-rewards",JSON.stringify(r)));
      if(sr!==null) ops.push(window.storage.set("tracker-streak-rewards",JSON.stringify(sr)));
      await Promise.all(ops);
      setSaveStatus("saved");setTimeout(()=>setSaveStatus(""),1500);
    }catch(e){setSaveStatus("error");}
  },[]);

  const toggleCompletion=(habitId,dateKey)=>{
    const key=`${dateKey}__${habitId}`,next={...completions,[key]:!completions[key]};
    if(next[key]){setJustChecked(key);setTimeout(()=>setJustChecked(null),500);}
    setCompletions(next);save(habits,next,null,null);
    const doneCount=habits.filter(h=>next[`${dateKey}__${h.id}`]).length;
    if(doneCount===habits.length&&habits.length>0){setAllDoneAnim(true);setTimeout(()=>setAllDoneAnim(false),3000);}
  };

  const addHabit=habit=>{const next=[...habits,{...habit,id:"h"+Date.now()}];setHabits(next);save(next,completions,null,null);setShowAddPanel(false);setPendingHabit(null);setNewHabit({emoji:"⭐",name:"",type:"daily",targetDays:3});};
  const deleteHabit=id=>{const next=habits.filter(h=>h.id!==id);setHabits(next);save(next,completions,null,null);};
  const saveHabit=habit=>{const next=habits.map(h=>h.id===habit.id?habit:h);setHabits(next);save(next,completions,null,null);setEditingHabit(null);};
  const savePeriodReward=r=>{const next=r.id?rewards.map(x=>x.id===r.id?r:x):[...rewards,{...r,id:"r"+Date.now()}];setRewards(next);save(habits,completions,next,null);setEditingReward(null);setShowRewardPanel(false);};
  const deletePeriodReward=id=>{const next=rewards.filter(r=>r.id!==id);setRewards(next);save(habits,completions,next,null);};
  const saveStreakReward=sr=>{const next=sr.id?streakRewards.map(x=>x.id===sr.id?sr:x):[...streakRewards,{...sr,id:"sr"+Date.now()}];setStreakRewards(next);save(habits,completions,null,next);setEditingReward(null);setShowRewardPanel(false);};
  const deleteStreakReward=id=>{const next=streakRewards.filter(r=>r.id!==id);setStreakRewards(next);save(habits,completions,null,next);};

  const weekDates=getWeekDates(selectedDate);
  const todayKey=getDateKey(new Date());
  const selectedKey=getDateKey(selectedDate);
  const weekStats=habits.map(h=>{const done=weekDates.filter(d=>completions[`${getDateKey(d)}__${h.id}`]).length,target=h.type==="weekly"?h.targetDays:7;return{...h,done,target,pct:Math.round((done/target)*100)};});
  const totalPct=weekStats.length?Math.round(weekStats.reduce((s,h)=>s+Math.min(h.pct,100),0)/weekStats.length):0;
  const doneToday=habits.filter(h=>completions[`${selectedKey}__${h.id}`]).length;
  const progressPct=habits.length?Math.round((doneToday/habits.length)*100):0;
  const periodPcts={week:calcPeriodPct("week",habits,completions),month:calcPeriodPct("month",habits,completions),year:calcPeriodPct("year",habits,completions)};
  const weekLabel=()=>{const f=weekDates[0],l=weekDates[6];return`${f.getDate()}. ${MONTH_NAMES[f.getMonth()]} – ${l.getDate()}. ${MONTH_NAMES[l.getMonth()]}`;};
  const rewardForm=editingReward||(rewardPanelType==="period"?newReward:newStreakReward);
  const setRewardForm=v=>editingReward?setEditingReward(v):rewardPanelType==="period"?setNewReward(v):setNewStreakReward(v);

  if(!loaded) return (
    <div style={{background:"#f8fafc",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:"#94a3b8",fontFamily:"system-ui",fontSize:14}}>Laden…</div>
    </div>
  );

  return (
    <div style={{background:"#f1f5f9",minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",color:"#0f172a",maxWidth:480,margin:"0 auto",paddingBottom:90}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=sora@700,800,900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }

        @keyframes celebPop { from{transform:scale(0.6) translateY(30px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes habitPop { 0%{transform:scale(1)} 45%{transform:scale(1.04)} 100%{transform:scale(1)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes tabIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes allDone { 0%{background:#f1f5f9} 40%{background:#eff6ff} 100%{background:#f1f5f9} }
        @keyframes popIn { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }

        .inp { background:white; border:2px solid #e2e8f0; color:#0f172a; font-family:inherit; font-size:14px; font-weight:600; padding:12px 14px; border-radius:13px; width:100%; outline:none; transition:all 0.2s; }
        .inp:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
        .inp::placeholder { color:#94a3b8; font-weight:500; }
        textarea.inp { resize:none; line-height:1.5; }
        input[type=range] { padding:0; background:none; border:none; box-shadow:none; cursor:pointer; accent-color:#2563eb; width:100%; }
        select.inp option { background:white; color:#0f172a; }

        .panel-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.3); z-index:100; display:flex; align-items:flex-end; backdrop-filter:blur(8px); }
        .panel { background:white; border-radius:28px 28px 0 0; width:100%; max-width:480px; margin:0 auto; padding:20px 20px 40px; max-height:92vh; overflow-y:auto; animation:slideUp 0.35s cubic-bezier(0.32,0.72,0,1); box-shadow:0 -8px 40px rgba(0,0,0,0.12); border-top:1px solid #f1f5f9; }
        .panel-title { font-family:'Sora',sans-serif; font-size:24px; font-weight:900; margin-bottom:22px; color:#0f172a; }

        .tog-row { display:flex; background:#f1f5f9; border-radius:14px; padding:4px; gap:3px; }
        .tog { flex:1; padding:9px 6px; background:none; border:none; color:#64748b; cursor:pointer; font-family:inherit; font-size:13px; font-weight:700; border-radius:11px; transition:all 0.2s; }
        .tog-on { background:white; color:#2563eb; box-shadow:0 2px 8px rgba(0,0,0,0.08); }

        .dnum { flex:1; aspect-ratio:1; border-radius:12px; border:2px solid #e2e8f0; cursor:pointer; font-family:inherit; font-size:15px; font-weight:800; transition:all 0.2s; background:white; color:#64748b; }
        .dnum-on { background:#2563eb; border-color:#2563eb; color:white; box-shadow:0 3px 12px rgba(37,99,235,0.35); }

        .btn-p { width:100%; padding:15px; border-radius:14px; background:#2563eb; border:none; color:white; font-family:inherit; font-size:15px; font-weight:800; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 16px rgba(37,99,235,0.3); }
        .btn-p:hover { background:#1d4ed8; transform:translateY(-1px); box-shadow:0 8px 24px rgba(37,99,235,0.4); }
        .btn-p:disabled { background:#e2e8f0; color:#94a3b8; cursor:not-allowed; transform:none; box-shadow:none; }

        .lbl { font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; margin-bottom:8px; }

        .chip { padding:6px 12px; border-radius:10px; border:2px solid #e2e8f0; cursor:pointer; font-family:inherit; font-size:12px; font-weight:800; background:white; color:#64748b; transition:all 0.15s; }
        .chip-on { background:#f59e0b; border-color:#f59e0b; color:white; box-shadow:0 2px 10px rgba(245,158,11,0.35); }

        .day-pill { flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; padding:8px 3px; border-radius:14px; background:none; border:none; cursor:pointer; transition:all 0.2s; -webkit-tap-highlight-color:transparent; }
        .day-pill.sel { background:#2563eb; box-shadow:0 4px 16px rgba(37,99,235,0.35); }
        .day-pill:not(.sel):hover { background:rgba(37,99,235,0.08); }

        .preset-tag { padding:8px 14px; border-radius:22px; background:white; border:2px solid #e2e8f0; color:#475569; cursor:pointer; font-family:inherit; font-size:13px; font-weight:700; transition:all 0.15s; }
        .preset-tag:hover { border-color:#2563eb; color:#2563eb; background:#eff6ff; }

        .pct-btn { flex:1; padding:10px 4px; border-radius:10px; border:2px solid #e2e8f0; background:white; color:#64748b; font-family:inherit; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.15s; text-align:center; }
        .pct-btn.on { background:#2563eb; border-color:#2563eb; color:white; box-shadow:0 2px 8px rgba(37,99,235,0.3); }

        .reward-card { background:white; border:2px solid #f1f5f9; border-radius:18px; padding:14px 16px; transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
        .manage-card { display:flex; align-items:center; gap:14px; background:white; border:2px solid #f1f5f9; border-radius:18px; padding:14px 16px; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
        .add-btn { width:100%; padding:16px; border-radius:18px; background:white; border:2px dashed #cbd5e1; color:#94a3b8; cursor:pointer; font-family:inherit; font-size:14px; font-weight:700; transition:all 0.2s; }
        .add-btn:hover { border-color:#2563eb; color:#2563eb; background:#eff6ff; }

        .tab-content { animation:tabIn 0.25s ease; }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#f1f5f9; }
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }
      `}</style>

      {showOnboarding&&<OnboardingScreen onDone={()=>{setShowOnboarding(false);window.storage.set("tracker-onboarded","1").catch(()=>{});}} />}
      <Confetti active={showConfetti} />
      {celebrationQueue.length>0&&<CelebrationPopup rewards={celebrationQueue} onClose={dismissCelebration} />}

      {/* ── HEADER ── */}
      <div style={{padding:"22px 20px 0",position:"sticky",top:0,zIndex:50,background:"rgba(241,245,249,0.95)",backdropFilter:"blur(16px)",borderBottom:"1px solid #e2e8f0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:32,fontWeight:900,letterSpacing:"-1px",lineHeight:1,color:"#0f172a"}}>
              TRACK<span style={{color:"#2563eb"}}>ER</span>
            </div>
            <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginTop:3}}>{new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {saveStatus==="saved"&&<div style={{fontSize:11,color:"#10b981",fontWeight:700,animation:"popIn 0.3s ease"}}>✓</div>}
            {view==="day"&&(
              <RingProgress pct={progressPct} size={68} stroke={7} color="#2563eb">
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:900,color:"#0f172a",lineHeight:1}}>{doneToday}</div>
                  <div style={{fontSize:9,color:"#94a3b8",fontWeight:700}}>/{habits.length}</div>
                </div>
              </RingProgress>
            )}
          </div>
        </div>

        {view==="day"&&<div style={{fontSize:12,color:"#64748b",fontWeight:600,marginBottom:14,fontStyle:"italic"}}>{motivation}</div>}

        {/* Week strip */}
        <div style={{display:"flex",gap:3,marginBottom:6}}>
          {weekDates.map((date,i)=>{
            const key=getDateKey(date),isSel=key===selectedKey,isToday=key===todayKey;
            const done=habits.filter(h=>completions[`${key}__${h.id}`]).length,pct=habits.length?done/habits.length:0;
            return (
              <button key={i} className={`day-pill${isSel?" sel":""}`} onClick={()=>{setSelectedDate(date);setView("day");}}>
                <div style={{fontSize:10,fontWeight:700,color:isSel?"rgba(255,255,255,0.75)":"#94a3b8"}}>{DAY_LABELS[i]}</div>
                <div style={{width:32,height:32,borderRadius:"50%",background:isSel?"rgba(255,255,255,0.2)":pct>0?"#dbeafe":"white",border:isToday&&!isSel?"2.5px solid #2563eb":"2.5px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:isSel?"white":isToday?"#2563eb":"#0f172a",boxShadow:!isSel?"0 1px 4px rgba(0,0,0,0.06)":"none"}}>{date.getDate()}</div>
                <div style={{width:5,height:5,borderRadius:"50%",background:pct===1&&done>0&&!isSel?"#10b981":"transparent"}} />
              </button>
            );
          })}
        </div>

        {/* Nav */}
        <div style={{display:"flex",borderTop:"2px solid #f1f5f9",margin:"4px -20px 0"}}>
          {[["day","Heute"],["week","Woche"],["rewards","🏆"],["manage","Habits"],["help","Hilfe"]].map(([v,label])=>(
            <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"12px 0",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:800,color:view===v?"#2563eb":"#94a3b8",borderBottom:view===v?"3px solid #2563eb":"3px solid transparent",transition:"all 0.2s"}}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── DAY VIEW ── */}
      {view==="day"&&(
        <div className="tab-content" style={{padding:"18px 16px",display:"flex",flexDirection:"column",gap:10,animation:allDoneAnim?"allDone 3s ease":"none"}}>
          {allDoneAnim&&(
            <div style={{textAlign:"center",padding:"14px",background:"linear-gradient(135deg,#eff6ff,#dbeafe)",borderRadius:16,border:"2px solid #bfdbfe",marginBottom:4,animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}>
              <span style={{fontSize:20}}>🎉</span> <span style={{fontWeight:900,color:"#2563eb",fontSize:14}}>Alle Habits erledigt! Ausgezeichnet!</span>
            </div>
          )}
          {habits.length===0&&(
            <div style={{textAlign:"center",color:"#94a3b8",fontSize:14,fontWeight:600,padding:"56px 0"}}>
              <div style={{fontSize:48,marginBottom:14}}>💙</div>Noch keine Habits.<br/>Tippe auf + um zu starten.
            </div>
          )}
          {habits.map((habit,idx)=>{
            const compKey=`${selectedKey}__${habit.id}`,done=!!completions[compKey],streak=calcStreak(habit.id,completions);
            const accent=HABIT_ACCENTS[idx%HABIT_ACCENTS.length];
            return <HabitCard key={habit.id} habit={habit} done={done} streak={streak} justDone={justChecked===compKey} accentColor={accent}
              onClick={()=>toggleCompletion(habit.id,selectedKey)} onEdit={()=>setEditingHabit(habit)} onDelete={()=>deleteHabit(habit.id)} />;
          })}
          <button className="add-btn" onClick={()=>setShowAddPanel(true)} style={{marginTop:4}}>+ Habit hinzufügen</button>
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {view==="week"&&(
        <div className="tab-content" style={{padding:"18px 16px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",borderRadius:24,padding:"24px 24px 22px",boxShadow:"0 12px 40px rgba(37,99,235,0.3)"}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",fontWeight:700,marginBottom:8,letterSpacing:"0.06em"}}>{weekLabel().toUpperCase()}</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:18}}>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:76,fontWeight:900,color:"white",lineHeight:1}}>{totalPct}<span style={{fontSize:34}}>%</span></div>
              <div style={{paddingBottom:8}}>
                <div style={{display:"inline-block",padding:"6px 14px",borderRadius:20,background:"rgba(255,255,255,0.2)",color:"white",fontSize:13,fontWeight:700}}>{totalPct>=90?"Ausnahmeform 🔥":totalPct>=70?"Starke Woche 💪":totalPct>=50?"Solide 👍":totalPct>=30?"Ausbaufähig 📈":"Neustart 🌱"}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:6,fontWeight:600}}>{weekStats.filter(h=>h.pct>=100).length} von {habits.length} erfüllt</div>
              </div>
            </div>
          </div>

          <div style={{background:"white",borderRadius:20,padding:18,border:"2px solid #f1f5f9",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
            <div className="lbl" style={{marginBottom:14}}>Tagesübersicht</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
              {weekDates.map((date,i)=>{
                const key=getDateKey(date),done=habits.filter(h=>completions[`${key}__${h.id}`]).length,pct=habits.length?done/habits.length:0,isToday=key===todayKey;
                const bg=pct===0?"#f8fafc":pct<0.4?"#dbeafe":pct<0.75?"#93c5fd":"#2563eb";
                return (
                  <div key={i} style={{textAlign:"center"}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:6}}>{DAY_LABELS[i]}</div>
                    <div style={{height:48,borderRadius:12,background:bg,border:isToday?"2.5px solid #2563eb":"2.5px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:pct>0.7?"0 4px 12px rgba(37,99,235,0.3)":"none"}}>
                      <span style={{fontSize:12,fontWeight:800,color:pct>0.35?"white":"#94a3b8"}}>{done>0?done:"–"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {weekStats.map((h,idx)=>{
              const accent=HABIT_ACCENTS[idx%HABIT_ACCENTS.length];
              const bc=h.pct>=100?accent:h.pct>=60?"#f59e0b":h.pct>0?"#f97316":"#e2e8f0";
              return (
                <div key={h.id} style={{background:"white",borderRadius:18,padding:"14px 16px",border:"2px solid #f1f5f9",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{h.emoji}</span><span style={{fontSize:14,fontWeight:700}}>{h.name}</span></div>
                    <span style={{fontSize:12,fontWeight:800,color:h.pct>=100?accent:"#94a3b8",background:h.pct>=100?`${accent}15`:"#f8fafc",padding:"3px 10px",borderRadius:20}}>{h.done}/{h.target}</span>
                  </div>
                  <div style={{height:7,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,background:bc,width:`${Math.min(h.pct,100)}%`,transition:"width 0.6s cubic-bezier(0.4,0,0.2,1)"}} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REWARDS VIEW ── */}
      {view==="rewards"&&(
        <div className="tab-content" style={{padding:"18px 16px",display:"flex",flexDirection:"column",gap:14}}>
          <div className="tog-row">
            <button className={`tog${rewardTab==="period"?" tog-on":""}`} onClick={()=>setRewardTab("period")}>📅 Zeitraum</button>
            <button className={`tog${rewardTab==="streak"?" tog-on":""}`} onClick={()=>setRewardTab("streak")}>🔥 Streak</button>
          </div>

          {rewardTab==="period"&&(
            <>
              {["week","month","year"].map(period=>{
                const pct=periodPcts[period],prs=rewards.filter(r=>r.period===period).sort((a,b)=>a.pct-b.pct),nextR=prs.find(r=>pct<r.pct);
                return (
                  <div key={period} style={{background:"white",borderRadius:20,padding:"18px 18px 16px",border:"2px solid #f1f5f9",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                      <div style={{fontSize:13,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.05em",color:"#475569"}}>{PERIOD_LABEL[period]}</div>
                      <div style={{fontSize:22,fontWeight:900,color:"#2563eb"}}>{pct}%</div>
                    </div>
                    <div style={{position:"relative",marginBottom:nextR?20:14}}>
                      <div style={{height:10,background:"#f1f5f9",borderRadius:5,overflow:"hidden"}}><div style={{height:"100%",borderRadius:5,background:"linear-gradient(90deg,#3b82f6,#2563eb)",width:`${pct}%`,transition:"width 0.6s"}} /></div>
                      {prs.map(r=><div key={r.id} style={{position:"absolute",top:-4,left:`${Math.min(r.pct,99)}%`,transform:"translateX(-50%)"}}>
                        <div style={{width:2,height:18,background:pct>=r.pct?"#2563eb":"#e2e8f0"}} />
                        <div style={{fontSize:9,fontWeight:800,color:pct>=r.pct?"#2563eb":"#94a3b8",whiteSpace:"nowrap",transform:"translateX(-50%)",marginTop:2}}>{r.pct}%</div>
                      </div>)}
                    </div>
                    {nextR&&<div style={{fontSize:12,color:"#64748b",fontWeight:600,marginBottom:10}}>Noch <span style={{color:"#2563eb",fontWeight:800}}>{nextR.pct-pct}%</span> bis: {nextR.emoji} {nextR.title}</div>}
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {prs.map(r=>{
                        const achieved=pct>=r.pct;
                        return (
                          <div key={r.id} className="reward-card" style={{opacity:achieved?1:0.65,borderColor:achieved?"#bfdbfe":"#f1f5f9",background:achieved?"#eff6ff":"white"}}>
                            <div style={{display:"flex",alignItems:"center",gap:12}}>
                              <div style={{fontSize:28}}>{r.emoji}</div>
                              <div style={{flex:1}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
                                  <span style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{r.title}</span>
                                  <span style={{fontSize:11,fontWeight:700,color:achieved?"#2563eb":"#94a3b8",background:achieved?"#dbeafe":"#f8fafc",padding:"2px 8px",borderRadius:10}}>{r.pct}%</span>
                                  {achieved&&<span style={{fontSize:11,fontWeight:800,color:"#10b981"}}>✓</span>}
                                </div>
                                <div style={{fontSize:12,color:"#64748b"}}>{r.desc}</div>
                              </div>
                              <div style={{display:"flex",gap:6}}>
                                <button style={{width:28,height:28,borderRadius:8,background:"#f1f5f9",border:"none",color:"#64748b",cursor:"pointer",fontSize:12}} onClick={()=>{setEditingReward(r);setRewardPanelType("period");setShowRewardPanel(true);}}>✎</button>
                                <button style={{width:28,height:28,borderRadius:8,background:"#fff1f2",border:"none",color:"#f43f5e",cursor:"pointer",fontSize:13,fontWeight:800}} onClick={()=>deletePeriodReward(r.id)}>×</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <button className="add-btn" onClick={()=>{setRewardPanelType("period");setEditingReward(null);setNewReward({period:"week",pct:80,emoji:"🎁",title:"",desc:""});setShowRewardPanel(true);}}>+ Belohnung hinzufügen</button>
            </>
          )}

          {rewardTab==="streak"&&(
            <>
              {habits.map(habit=>{
                const hSRs=streakRewards.filter(sr=>sr.habitId===habit.id).sort((a,b)=>a.days-b.days),streak=calcStreak(habit.id,completions),nextSR=hSRs.find(sr=>streak<sr.days);
                return (
                  <div key={habit.id} style={{background:"white",borderRadius:20,padding:"18px 18px 16px",border:"2px solid #f1f5f9",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>{habit.emoji}</span><span style={{fontSize:13,fontWeight:800,color:"#0f172a"}}>{habit.name}</span></div>
                      <span style={{background:streak>0?"linear-gradient(135deg,#f59e0b,#d97706)":"#f1f5f9",color:streak>0?"white":"#94a3b8",padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:800}}>🔥 {streak} Tage</span>
                    </div>
                    {nextSR&&<div style={{fontSize:12,color:"#64748b",fontWeight:600,marginBottom:12}}>Noch <span style={{color:"#f59e0b",fontWeight:800}}>{nextSR.days-streak} Tage</span> bis: {nextSR.emoji} {nextSR.title}</div>}
                    {hSRs.length===0&&<div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>Unter ✎ Meilensteine hinzufügen.</div>}
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {hSRs.map(sr=>{
                        const achieved=streak>=sr.days;
                        return (
                          <div key={sr.id} className="reward-card" style={{opacity:achieved?1:0.65,borderColor:achieved?"#fde68a":"#f1f5f9",background:achieved?"#fffbeb":"white"}}>
                            <div style={{display:"flex",alignItems:"center",gap:12}}>
                              <div style={{fontSize:26}}>{sr.emoji}</div>
                              <div style={{flex:1}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}>
                                  <span style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{sr.title}</span>
                                  <span style={{fontSize:11,fontWeight:700,color:achieved?"#f59e0b":"#94a3b8",background:achieved?"#fef3c7":"#f8fafc",padding:"2px 8px",borderRadius:10}}>{fmtDays(sr.days)}</span>
                                  {achieved&&<span style={{fontSize:11,fontWeight:800,color:"#f59e0b"}}>✓🔥</span>}
                                </div>
                                <div style={{fontSize:12,color:"#64748b"}}>{sr.desc}</div>
                              </div>
                              <button style={{width:28,height:28,borderRadius:8,background:"#fff1f2",border:"none",color:"#f43f5e",cursor:"pointer",fontSize:13,fontWeight:800}} onClick={()=>deleteStreakReward(sr.id)}>×</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <button className="add-btn" onClick={()=>{setRewardPanelType("streak");setEditingReward(null);setNewStreakReward({habitId:habits[0]?.id||"",days:30,emoji:"🔥",title:"",desc:""});setShowRewardPanel(true);}}>+ Streak-Belohnung hinzufügen</button>
            </>
          )}
        </div>
      )}

      {/* ── MANAGE VIEW ── */}
      {view==="manage"&&(
        <div className="tab-content" style={{padding:"18px 16px",display:"flex",flexDirection:"column",gap:10}}>
          <div className="lbl" style={{marginBottom:2}}>{habits.length} Habits aktiv</div>
          {habits.map(habit=>(
            <div key={habit.id} className="manage-card">
              <span style={{fontSize:24}}>{habit.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{habit.name}</div>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginTop:2}}>{habit.type==="daily"?"Täglich":`${habit.targetDays}× pro Woche`}</div>
              </div>
              <button style={{width:30,height:30,borderRadius:50,background:"#eff6ff",border:"none",color:"#2563eb",cursor:"pointer",fontSize:14,marginRight:6}} onClick={()=>setEditingHabit(habit)}>✎</button>
              <button style={{width:30,height:30,borderRadius:50,background:"#fff1f2",border:"none",color:"#f43f5e",cursor:"pointer",fontSize:16,fontWeight:800}} onClick={()=>deleteHabit(habit.id)}>×</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>setShowAddPanel(true)} style={{marginTop:6}}>+ Habit hinzufügen</button>
        </div>
      )}

      {/* ── HELP VIEW ── */}
      {view==="help"&&<HelpView />}

      {/* ── BOTTOM NAV ── */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(16px)",borderTop:"2px solid #f1f5f9",display:"flex",paddingBottom:10,boxShadow:"0 -4px 20px rgba(0,0,0,0.06)"}}>
        {[["day","📋","Heute"],["week","📊","Woche"],["rewards","🏆","Rewards"],["manage","⚙️","Habits"],["help","❓","Hilfe"]].map(([v,icon,label])=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 2px 6px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
            <span style={{fontSize:17}}>{icon}</span>
            <span style={{fontSize:9,fontWeight:800,color:view===v?"#2563eb":"#94a3b8"}}>{label}</span>
            <div style={{width:16,height:3,borderRadius:2,background:view===v?"#2563eb":"transparent",marginTop:1,transition:"all 0.2s"}} />
          </button>
        ))}
      </div>

      {/* ── ADD HABIT PANEL ── */}
      {showAddPanel&&(
        <div className="panel-overlay" onClick={()=>{setShowAddPanel(false);setPendingHabit(null);}}>
          <div className="panel" onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,borderRadius:2,background:"#2563eb",margin:"0 auto 24px"}} />
            {!pendingHabit?(
              <>
                <div className="panel-title">Habit hinzufügen</div>
                <div className="tog-row" style={{marginBottom:20}}>
                  <button className={`tog${addMode==="preset"?" tog-on":""}`} onClick={()=>setAddMode("preset")}>Vorlagen</button>
                  <button className={`tog${addMode==="custom"?" tog-on":""}`} onClick={()=>setAddMode("custom")}>Eigener</button>
                </div>
                {addMode==="preset"&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {PRESET_HABITS.filter(p=>!habits.find(h=>h.name===p.name)).map((p,i)=><button key={i} className="preset-tag" onClick={()=>setPendingHabit({...p,targetDays:p.targetDays||3})}>{p.emoji} {p.name}</button>)}
                    {PRESET_HABITS.filter(p=>!habits.find(h=>h.name===p.name)).length===0&&<div style={{color:"#94a3b8",fontSize:13}}>Alle Vorlagen bereits aktiv.</div>}
                  </div>
                )}
                {addMode==="custom"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div style={{display:"flex",gap:8}}>
                      <input value={newHabit.emoji} onChange={e=>setNewHabit({...newHabit,emoji:e.target.value})} className="inp" style={{width:64,textAlign:"center",fontSize:22}} maxLength={2} placeholder="🎯" />
                      <input value={newHabit.name} onChange={e=>setNewHabit({...newHabit,name:e.target.value})} placeholder="Name des Habits" className="inp" style={{flex:1}} />
                    </div>
                    <button className="btn-p" disabled={!newHabit.name.trim()} onClick={()=>setPendingHabit({...newHabit,targetDays:3})}>Weiter →</button>
                  </div>
                )}
              </>
            ):(
              <>
                <button onClick={()=>setPendingHabit(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b",fontFamily:"inherit",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6,marginBottom:20,padding:0}}>← Zurück</button>
                <div style={{display:"flex",alignItems:"center",gap:12,background:"#eff6ff",border:"2px solid #bfdbfe",borderRadius:16,padding:"14px 16px",marginBottom:24}}>
                  <span style={{fontSize:28}}>{pendingHabit.emoji}</span>
                  <div><div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>{pendingHabit.name}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>Häufigkeit festlegen</div></div>
                </div>
                <div style={{marginBottom:16}}>
                  <div className="lbl">Wie oft?</div>
                  <div className="tog-row">
                    <button className={`tog${pendingHabit.type==="daily"?" tog-on":""}`} onClick={()=>setPendingHabit({...pendingHabit,type:"daily"})}>Jeden Tag</button>
                    <button className={`tog${pendingHabit.type==="weekly"?" tog-on":""}`} onClick={()=>setPendingHabit({...pendingHabit,type:"weekly",targetDays:pendingHabit.targetDays||3})}>X-mal / Woche</button>
                  </div>
                </div>
                {pendingHabit.type==="weekly"&&(
                  <div style={{marginBottom:24}}>
                    <div className="lbl">Tage pro Woche</div>
                    <div style={{display:"flex",gap:8}}>{[1,2,3,4,5,6,7].map(n=><button key={n} onClick={()=>setPendingHabit({...pendingHabit,targetDays:n})} className={`dnum${pendingHabit.targetDays===n?" dnum-on":""}`}>{n}</button>)}</div>
                  </div>
                )}
                {pendingHabit.type==="daily"&&<div style={{marginBottom:24,padding:"12px 16px",background:"#eff6ff",borderRadius:12,border:"2px solid #bfdbfe"}}><div style={{fontSize:13,color:"#2563eb",fontWeight:700}}>✓ Täglich</div></div>}
                <button className="btn-p" onClick={()=>addHabit(pendingHabit)}>Habit hinzufügen</button>
              </>
            )}
            <button onClick={()=>{setShowAddPanel(false);setPendingHabit(null);}} style={{width:"100%",marginTop:14,padding:14,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:14,color:"#64748b",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* ── REWARD PANEL ── */}
      {showRewardPanel&&(
        <div className="panel-overlay" onClick={()=>{setShowRewardPanel(false);setEditingReward(null);}}>
          <div className="panel" onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,borderRadius:2,background:"#2563eb",margin:"0 auto 24px"}} />
            <div className="panel-title">{editingReward?"Belohnung bearbeiten":rewardPanelType==="streak"?"Streak-Belohnung":"Belohnung hinzufügen"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",gap:8}}>
                <EmojiPicker value={rewardForm.emoji} onChange={em=>setRewardForm({...rewardForm,emoji:em})} />
                <input value={rewardForm.title} onChange={e=>setRewardForm({...rewardForm,title:e.target.value})} placeholder="Titel" className="inp" style={{flex:1}} />
              </div>
              <textarea value={rewardForm.desc} onChange={e=>setRewardForm({...rewardForm,desc:e.target.value})} placeholder="Beschreibung (optional)" className="inp" rows={2} />
              {rewardPanelType==="period"&&(
                <>
                  <div><div className="lbl">Zeitraum</div><div style={{display:"flex",gap:8}}>{["week","month","year"].map(p=><button key={p} className={`pct-btn${rewardForm.period===p?" on":""}`} onClick={()=>setRewardForm({...rewardForm,period:p})}>{PERIOD_LABEL[p]}</button>)}</div></div>
                  <div>
                    <div className="lbl">Ziel: <span style={{color:"#2563eb"}}>{rewardForm.pct}%</span></div>
                    <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>{[50,60,70,75,80,90,100].map(p=><button key={p} className={`pct-btn${rewardForm.pct===p?" on":""}`} onClick={()=>setRewardForm({...rewardForm,pct:p})}>{p}%</button>)}</div>
                    <input type="range" min={10} max={100} step={5} value={rewardForm.pct} onChange={e=>setRewardForm({...rewardForm,pct:parseInt(e.target.value)})} />
                  </div>
                </>
              )}
              {rewardPanelType==="streak"&&(
                <>
                  <div><div className="lbl">Für welchen Habit?</div><select value={rewardForm.habitId} onChange={e=>setRewardForm({...rewardForm,habitId:e.target.value})} className="inp">{habits.map(h=><option key={h.id} value={h.id}>{h.emoji} {h.name}</option>)}</select></div>
                  <div>
                    <div className="lbl">Streak-Ziel: <span style={{color:"#f59e0b"}}>{fmtDays(rewardForm.days||30)}</span></div>
                    <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>{[7,14,30,60,100,365,1000,3650].map(d=><button key={d} className={`chip${rewardForm.days===d?" chip-on":""}`} onClick={()=>setRewardForm({...rewardForm,days:d})}>{d>=365&&d%365===0?`${d/365}J`:`${d}T`}</button>)}</div>
                    <div style={{display:"flex",gap:8}}>
                      <div style={{flex:1}}><div className="lbl" style={{marginBottom:4}}>Tage</div><input type="number" min={1} max={100000} value={rewardForm.days||30} onChange={e=>setRewardForm({...rewardForm,days:Math.max(1,parseInt(e.target.value)||1)})} className="inp" /></div>
                      <div style={{flex:1}}><div className="lbl" style={{marginBottom:4}}>Jahre</div><input type="number" min={0} max={274} step={0.5} value={parseFloat(((rewardForm.days||30)/365).toFixed(2))} onChange={e=>setRewardForm({...rewardForm,days:Math.round(parseFloat(e.target.value||0)*365)||1})} className="inp" /></div>
                    </div>
                  </div>
                </>
              )}
              <button className="btn-p" disabled={!rewardForm.title.trim()||(rewardPanelType==="streak"&&!rewardForm.habitId)} onClick={()=>rewardPanelType==="period"?savePeriodReward(rewardForm):saveStreakReward(rewardForm)}>
                {editingReward?"Speichern":"Hinzufügen"}
              </button>
            </div>
            <button onClick={()=>{setShowRewardPanel(false);setEditingReward(null);}} style={{width:"100%",marginTop:14,padding:14,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:14,color:"#64748b",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* ── EDIT HABIT PANEL ── */}
      {editingHabit&&(
        <EditHabitPanel habit={editingHabit} streakRewards={streakRewards} completions={completions} habits={habits}
          onSave={saveHabit} onClose={()=>setEditingHabit(null)} onUpdateStreakRewards={setStreakRewards} save={save} />
      )}
    </div>
  );
}
