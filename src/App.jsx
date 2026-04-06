import { useState, useEffect, useCallback } from "react";

const Q12 = [
  "나는 회사에서 나에게 기대하는 것이 무엇인지 알고 있다.",
  "나는 업무를 제대로 수행하는 데 필요한 자료와 장비를 갖추고 있다.",
  "나는 회사에서 매일 가장 잘하는 일을 할 기회가 있다.",
  "지난 7일 동안, 업무를 잘 수행한 것에 대해 인정이나 칭찬을 받았다.",
  "나의 상사 또는 동료는 나를 한 사람의 인격체로 배려해 준다.",
  "회사에 나의 발전을 격려해 주는 사람이 있다.",
  "회사에서 나의 의견이 존중받는다고 느낀다.",
  "회사의 목적이나 사명은 내가 하는 일을 의미 있게 만든다.",
  "나의 동료들은 양질의 업무를 수행하기 위해 노력하고 있다.",
  "나는 회사에 친한 친구가 있다.",
  "지난 6개월 동안, 회사에서 누군가가 나의 발전에 대해 이야기해 주었다.",
  "지난 1년 동안, 회사에서 배우고 성장할 기회가 있었다.",
];

const CATEGORIES = [
  { name: "기본 욕구", range: [0, 1], color: "#8faa4f", desc: "Basic Needs" },
  { name: "개인 기여", range: [2, 5], color: "#c49a3c", desc: "Individual" },
  { name: "팀워크", range: [6, 9], color: "#5a9e8f", desc: "Teamwork" },
  { name: "성장", range: [10, 11], color: "#b07040", desc: "Growth" },
];

const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

function Bar({ value, max = 5, color, label, count }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3, color: "var(--c-text-sub)" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value.toFixed(2)}{count != null ? ` (n=${count})` : ""}</span>
      </div>
      <div style={{ height: 10, borderRadius: 6, background: "var(--c-bar-bg)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: color, transition: "width .6s ease" }} />
      </div>
    </div>
  );
}

function RadarChart({ data, size = 260 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = data.length;
  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const val = (d.value / 5) * r;
    return { x: cx + Math.cos(angle) * val, y: cy + Math.sin(angle) * val, lx: cx + Math.cos(angle) * (r + 18), ly: cy + Math.sin(angle) * (r + 18), label: d.label };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {gridLevels.map((lv) => {
        const gr = data.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const v = (lv / 5) * r;
          return `${i === 0 ? "M" : "L"}${cx + Math.cos(angle) * v},${cy + Math.sin(angle) * v}`;
        }).join(" ") + "Z";
        return <path key={lv} d={gr} fill="none" stroke="var(--c-grid)" strokeWidth={1} />;
      })}
      {data.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke="var(--c-grid)" strokeWidth={0.5} />;
      })}
      <path d={path} fill="rgba(74,140,42,0.15)" stroke="#4a8c2a" strokeWidth={2} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#4a8c2a" />
          <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--c-text-sub)">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

export default function App() {
  const [phase, setPhase] = useState("intro"); // intro, survey, result, dashboard
  const [company, setCompany] = useState("");
  const [userName, setUserName] = useState("");
  const [answers, setAnswers] = useState(Array(12).fill(0));
  const [current, setCurrent] = useState(0);
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem("q12-all-data");
        if (stored) setAllData(JSON.parse(stored));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const saveData = useCallback(async (newData) => {
    setAllData(newData);
    try { localStorage.setItem("q12-all-data", JSON.stringify(newData)); } catch {}
  }, []);

  const handleAnswer = (val) => {
    const next = [...answers];
    next[current] = val;
    setAnswers(next);
    if (current < 11) setCurrent(current + 1);
  };

  const submit = async () => {
    const entry = { name: userName, answers, ts: Date.now() };
    const updated = { ...allData };
    if (!updated[company]) updated[company] = [];
    updated[company] = [...updated[company], entry];
    await saveData(updated);
    setPhase("result");
  };

  const companyStats = (comp) => {
    const entries = allData[comp] || [];
    if (!entries.length) return null;
    const qAvgs = Array(12).fill(0).map((_, qi) => avg(entries.map((e) => e.answers[qi])));
    const overall = avg(qAvgs);
    const catAvgs = CATEGORIES.map((c) => {
      const qs = [];
      for (let i = c.range[0]; i <= c.range[1]; i++) qs.push(qAvgs[i]);
      return { ...c, value: avg(qs) };
    });
    return { qAvgs, overall, catAvgs, count: entries.length };
  };

  const myStats = () => {
    const qAvgs = answers.map((v) => v);
    const overall = avg(qAvgs);
    const catAvgs = CATEGORIES.map((c) => {
      const qs = [];
      for (let i = c.range[0]; i <= c.range[1]; i++) qs.push(qAvgs[i]);
      return { ...c, value: avg(qs) };
    });
    return { qAvgs, overall, catAvgs };
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Outfit:wght@300;400;600;700;800&display=swap');
    :root {
      --c-bg: #f4f7ed;
      --c-card: #ffffff;
      --c-card2: #eef2e6;
      --c-border: #d4ddc4;
      --c-text: #2a331e;
      --c-text-sub: #6b7a58;
      --c-accent: #4a8c2a;
      --c-bar-bg: #d4ddc4;
      --c-grid: #c8d4b8;
      --c-hover: #e4ebd6;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background: var(--c-bg); color: var(--c-text); font-family: 'Noto Sans KR', sans-serif; }
    .wrap { max-width: 720px; margin: 0 auto; padding: 24px 16px; min-height: 100vh; }
    .brand-header { display:flex; align-items:center; gap:8px; padding-bottom:16px; margin-bottom:20px; border-bottom:1px solid var(--c-border); }
    .brand-header span { font-family:'Outfit',sans-serif; font-weight:700; font-size:14px; letter-spacing:.5px; color:var(--c-accent); }
    .logo { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: var(--c-accent); margin-bottom: 6px; }
    h1 { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 28px; margin-bottom: 8px; }
    .sub { color: var(--c-text-sub); font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
    .card { background: var(--c-card); border: 1px solid var(--c-border); border-radius: 14px; padding: 24px; margin-bottom: 16px; }
    input[type=text] { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--c-border); background: var(--c-card2); color: var(--c-text); font-size: 15px; font-family: inherit; outline: none; transition: border .2s; }
    input[type=text]:focus { border-color: var(--c-accent); }
    .btn { display:inline-flex; align-items:center; justify-content:center; padding: 12px 28px; border-radius: 10px; border:none; font-size:15px; font-weight:600; font-family:inherit; cursor:pointer; transition: all .2s; }
    .btn-primary { background: var(--c-accent); color:#fff; }
    .btn-primary:hover { background: #3d7522; }
    .btn-primary:disabled { opacity:.4; cursor:default; }
    .btn-ghost { background:transparent; color:var(--c-text-sub); border:1px solid var(--c-border); }
    .btn-ghost:hover { background:var(--c-hover); color:var(--c-text); }
    .likert { display:flex; gap:8px; margin-top:16px; }
    .likert button { flex:1; padding:14px 0; border-radius:10px; border:2px solid var(--c-border); background:var(--c-card2); color:var(--c-text); font-size:16px; font-weight:600; cursor:pointer; transition:all .15s; font-family:inherit; }
    .likert button:hover { border-color:var(--c-accent); background:#e0edcf; }
    .likert button.sel { border-color:var(--c-accent); background:var(--c-accent); color:#fff; }
    .progress-bar { height:4px; border-radius:4px; background:var(--c-bar-bg); margin-bottom:24px; overflow:hidden; }
    .progress-fill { height:100%; background:var(--c-accent); border-radius:4px; transition:width .3s; }
    .qnum { font-family:'Outfit'; font-size:13px; color:var(--c-accent); font-weight:600; margin-bottom:8px; }
    .qtxt { font-size:17px; font-weight:500; line-height:1.6; }
    .score-big { font-family:'Outfit'; font-size:56px; font-weight:800; color:var(--c-accent); line-height:1; }
    .score-label { font-size:13px; color:var(--c-text-sub); margin-top:4px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    @media(max-width:560px){ .grid2{grid-template-columns:1fr;} }
    .tab-row { display:flex; gap:6px; margin-bottom:20px; flex-wrap:wrap; }
    .tab { padding:8px 16px; border-radius:8px; border:1px solid var(--c-border); background:transparent; color:var(--c-text-sub); font-size:13px; cursor:pointer; font-family:inherit; font-weight:500; transition:all .15s; }
    .tab.active { background:var(--c-accent); color:#fff; border-color:var(--c-accent); }
    .tab:hover:not(.active) { background:var(--c-hover); color:var(--c-text); }
    .fade-in { animation: fadeIn .4s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  `;

  if (loading) return <div><style>{css}</style><div className="wrap" style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}><p style={{color:"var(--c-text-sub)"}}>로딩 중...</p></div></div>;

  // INTRO
  if (phase === "intro") {
    const companies = Object.keys(allData);
    return (
      <div><style>{css}</style>
        <div className="wrap fade-in"><div className="brand-header"><span>퍼포먼스플러스랩</span></div>
          <div className="logo">Gallup Q12</div>
          <h1>직원 몰입도 진단</h1>
          <p className="sub">갤럽 Q12는 직원의 업무 몰입도를 측정하는 12개 핵심 문항으로 구성됩니다.<br/>회사명을 입력하면 동일 회사의 응답이 누적되어 통계를 확인할 수 있습니다.</p>

          <div className="card">
            <label style={{fontSize:13,color:"var(--c-text-sub)",marginBottom:6,display:"block"}}>회사명</label>
            <input type="text" placeholder="예: 퍼포먼스플러스랩" value={company} onChange={e=>setCompany(e.target.value)} />
            <div style={{height:12}}/>
            <label style={{fontSize:13,color:"var(--c-text-sub)",marginBottom:6,display:"block"}}>이름 (선택)</label>
            <input type="text" placeholder="홍길동" value={userName} onChange={e=>setUserName(e.target.value)} />
            <div style={{height:16}}/>
            <button className="btn btn-primary" style={{width:"100%"}} disabled={!company.trim()} onClick={()=>{setCurrent(0);setAnswers(Array(12).fill(0));setPhase("survey")}}>진단 시작하기</button>
          </div>

          {companies.length > 0 && (
            <div style={{marginTop:24}}>
              <p style={{fontSize:14,fontWeight:600,marginBottom:12}}>📊 대시보드 바로가기</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {companies.map(c=>(
                  <button key={c} className="btn btn-ghost" style={{fontSize:13}} onClick={()=>{setCompany(c);setPhase("dashboard")}}>{c} ({allData[c].length}명)</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // SURVEY
  if (phase === "survey") {
    const done = answers[current] > 0;
    const allDone = answers.every(a => a > 0);
    return (
      <div><style>{css}</style>
        <div className="wrap fade-in"><div className="brand-header"><span>퍼포먼스플러스랩</span></div>
          <div className="logo">{company}</div>
          <div className="progress-bar"><div className="progress-fill" style={{width:`${((current+1)/12)*100}%`}}/></div>
          <div className="card" key={current}>
            <div className="qnum">Q{current+1} / 12 — {CATEGORIES.find(c=>current>=c.range[0]&&current<=c.range[1]).name}</div>
            <div className="qtxt">{Q12[current]}</div>
            <div className="likert">
              {[1,2,3,4,5].map(v=>(
                <button key={v} className={answers[current]===v?"sel":""} onClick={()=>handleAnswer(v)}>
                  {v}
                </button>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--c-text-sub)",marginTop:6,padding:"0 4px"}}>
              <span>전혀 아니다</span><span>매우 그렇다</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"space-between"}}>
            <button className="btn btn-ghost" disabled={current===0} onClick={()=>setCurrent(current-1)}>← 이전</button>
            {current < 11 ? (
              <button className="btn btn-primary" disabled={!done} onClick={()=>setCurrent(current+1)}>다음 →</button>
            ) : (
              <button className="btn btn-primary" disabled={!allDone} onClick={submit}>결과 보기</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RESULT
  if (phase === "result") {
    const my = myStats();
    const cs = companyStats(company);
    return (
      <div><style>{css}</style>
        <div className="wrap fade-in"><div className="brand-header"><span>퍼포먼스플러스랩</span></div>
          <div className="logo">진단 결과</div>
          <h1>{userName || "나"}의 Q12 결과</h1>
          <p className="sub">{company} 소속 · 전체 평균과 비교</p>

          <div className="grid2">
            <div className="card" style={{textAlign:"center"}}>
              <div className="score-big">{my.overall.toFixed(1)}</div>
              <div className="score-label">나의 전체 평균</div>
            </div>
            <div className="card" style={{textAlign:"center"}}>
              <div className="score-big" style={{color:"#059669"}}>{cs ? cs.overall.toFixed(1) : "—"}</div>
              <div className="score-label">{company} 평균 (n={cs?.count||0})</div>
            </div>
          </div>

          <div className="card">
            <p style={{fontSize:14,fontWeight:600,marginBottom:14}}>영역별 점수</p>
            {my.catAvgs.map((c,i)=>(
              <Bar key={i} label={`${c.name} (${c.desc})`} value={c.value} color={c.color} />
            ))}
          </div>

          <div className="card">
            <p style={{fontSize:14,fontWeight:600,marginBottom:14}}>문항별 점수</p>
            {Q12.map((q,i)=>(
              <Bar key={i} label={`Q${i+1}`} value={answers[i]} color={CATEGORIES.find(c=>i>=c.range[0]&&i<=c.range[1]).color} />
            ))}
          </div>

          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button className="btn btn-primary" onClick={()=>{setPhase("dashboard")}}>회사 대시보드 →</button>
            <button className="btn btn-ghost" onClick={()=>{setPhase("intro");setAnswers(Array(12).fill(0));setCurrent(0);}}>처음으로</button>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  if (phase === "dashboard") {
    const companies = Object.keys(allData);
    const [selComp, setSelComp] = useState(company || companies[0] || "");
    const cs = companyStats(selComp);

    return (
      <div><style>{css}</style>
        <div className="wrap fade-in"><div className="brand-header"><span>퍼포먼스플러스랩</span></div>
          <div className="logo">Dashboard</div>
          <h1>회사별 Q12 대시보드</h1>
          <p className="sub">회사를 선택하면 누적된 응답의 평균 통계를 확인할 수 있습니다.</p>

          <div className="tab-row">
            {companies.map(c=>(
              <button key={c} className={`tab ${selComp===c?"active":""}`} onClick={()=>setSelComp(c)}>{c} ({allData[c].length})</button>
            ))}
          </div>

          {cs ? (
            <>
              <div className="grid2">
                <div className="card" style={{textAlign:"center"}}>
                  <div className="score-big">{cs.overall.toFixed(2)}</div>
                  <div className="score-label">전체 평균</div>
                </div>
                <div className="card" style={{textAlign:"center"}}>
                  <div className="score-big" style={{color:"#c49a3c"}}>{cs.count}</div>
                  <div className="score-label">총 응답자 수</div>
                </div>
              </div>

              <div className="card" style={{display:"flex",justifyContent:"center"}}>
                <RadarChart data={cs.catAvgs.map(c=>({value:c.value,label:c.name}))} />
              </div>

              <div className="card">
                <p style={{fontSize:14,fontWeight:600,marginBottom:14}}>영역별 평균</p>
                {cs.catAvgs.map((c,i)=>(
                  <Bar key={i} label={`${c.name} (${c.desc})`} value={c.value} color={c.color} count={cs.count} />
                ))}
              </div>

              <div className="card">
                <p style={{fontSize:14,fontWeight:600,marginBottom:14}}>문항별 평균</p>
                {Q12.map((q,i)=>(
                  <Bar key={i} label={`Q${i+1}. ${q.length>28?q.slice(0,28)+"…":q}`} value={cs.qAvgs[i]} color={CATEGORIES.find(c=>i>=c.range[0]&&i<=c.range[1]).color} count={cs.count} />
                ))}
              </div>

              <div className="card">
                <p style={{fontSize:14,fontWeight:600,marginBottom:14}}>응답자 목록</p>
                <div style={{fontSize:13,color:"var(--c-text-sub)"}}>
                  {allData[selComp].map((e,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--c-border)"}}>
                      <span>{e.name||`응답자 ${i+1}`}</span>
                      <span>평균 {avg(e.answers).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{textAlign:"center",padding:40,color:"var(--c-text-sub)"}}>
              아직 응답 데이터가 없습니다.
            </div>
          )}

          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button className="btn btn-ghost" onClick={()=>{setPhase("intro");setAnswers(Array(12).fill(0));setCurrent(0);}}>← 처음으로</button>
            <button className="btn btn-ghost" style={{color:"#ef4444",borderColor:"#ef4444"}} onClick={async()=>{
              if(confirm(`${selComp}의 모든 데이터를 삭제할까요?`)){
                const updated={...allData};
                delete updated[selComp];
                await saveData(updated);
                setSelComp(Object.keys(updated)[0]||"");
              }
            }}>데이터 초기화</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
