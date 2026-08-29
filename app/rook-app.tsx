'use client';
/* eslint-disable @next/next/no-img-element -- logo URLs are supplied dynamically by Robinhood's canonical asset API. */

import { useEffect, useMemo, useState } from 'react';
import { robinhoodTestnet } from './chain';

type View = 'home' | 'market' | 'create' | 'rooks' | 'explore';
type Condition = 'falls' | 'rises above' | 'falls below' | 'rises' | 'every Monday';
type Action = 'BUY' | 'SELL' | 'NOTIFY';
type Asset = { tokenSymbol: string; tokenName: string; logoUrl?: string; deployments?: { contractAddress: string; chainId: number }[]; quote?: { bid: string; ask: string; generatedAt: string } };
type Rook = { id: number; asset: string; condition: Condition; threshold: number; action: Action; amount: number; status: 'ACTIVE' | 'PAUSED'; created: string };

const symbols = ['NVDA', 'AAPL', 'SPY', 'MSFT', 'AMZN', 'META'];
const templates = [
  { title: 'Weekly Tech DCA', creator: 'Rook Labs', assets: 'NVDA · AAPL · MSFT', rule: 'Every Monday → equal-weight buy', risk: 'Moderate', forks: 128 },
  { title: 'Market Dip Buyer', creator: 'atlas.eth', assets: 'SPY · USDG', rule: 'SPY falls 3% → buy with USDG', risk: 'Moderate', forks: 84 },
  { title: 'Stablecoin Rotation', creator: '0xcedar', assets: 'USDG · WETH', rule: 'ETH rises 8% → rotate 10%', risk: 'Elevated', forks: 41 },
];

const AssetIcon = ({ symbol }: { symbol: string }) => <span className={`asset-icon asset-${symbol.toLowerCase()}`}>{symbol.slice(0, 1)}</span>;

function ChessBoard({ asset, action, compact = false }: { asset: string; action: Action; compact?: boolean }) {
  const [focus, setFocus] = useState('a1');
  const files = ['a','b','c','d','e','f','g','h'];
  const pieces: Record<string, { glyph: string; name: string; tone: 'light' | 'dark' }> = {
    a8: { glyph: '♜', name: 'Rook vault', tone: 'dark' },
    d8: { glyph: '♛', name: 'Market', tone: 'dark' },
    e8: { glyph: '♚', name: 'Wallet', tone: 'dark' },
    c7: { glyph: '♟', name: 'Oracle', tone: 'dark' },
    e5: { glyph: '♞', name: asset + ' trigger', tone: 'dark' },
    f3: { glyph: '♙', name: action + ' action', tone: 'light' },
    d2: { glyph: '♗', name: 'Permission', tone: 'light' },
    e1: { glyph: '♔', name: 'You', tone: 'light' },
    a1: { glyph: '♖', name: 'Active Rook', tone: 'light' },
  };
  return <div className={compact ? 'board-module board-compact' : 'board-module'}>
    <div className="board-topline"><span><i className="position-pulse"/> LIVE POSITION</span><strong>{asset} / {action}</strong></div>
    <div className="chess-board" role="grid" aria-label="Rook strategy chessboard">
      {Array.from({length:64},(_,i)=>{const row=Math.floor(i/8);const col=i%8;const square=files[col]+(8-row);const piece=pieces[square];return <button type="button" role="gridcell" aria-label={piece ? square + ': ' + piece.name : square} aria-selected={focus===square} onClick={()=>setFocus(square)} className={'board-square '+((row+col)%2?'square-dark':'square-light')+(focus===square?' square-focus':'')} key={square}>{col===0&&<span className="rank-label">{8-row}</span>}{row===7&&<span className="file-label">{files[col]}</span>}{piece&&<><span className={'chess-piece piece-'+piece.tone}>{piece.glyph}</span><span className="piece-name">{piece.name}</span></>}</button>})}
    </div>
    <div className="move-notation"><span>POSITION</span><strong>{focus}</strong><p>{pieces[focus]?.name || 'Open square — select a piece to inspect its role.'}</p></div>
  </div>;
}

function Nav({ view, setView, wallet, connect }: { view: View; setView: (v: View) => void; wallet: string; connect: () => void }) {
  return <nav className="nav-shell" aria-label="Primary navigation">
    <button className="brand plain-button" onClick={() => setView('home')} aria-label="Rook home"><img className="nav-logo" src="/rook-mark.png" alt=""/><span className="brand-word">ROOK</span></button>
    <div className="nav-links">{(['market', 'create', 'rooks', 'explore'] as View[]).map(v => <button className={view === v ? 'nav-active' : ''} key={v} onClick={() => setView(v)}>{v === 'rooks' ? 'My Rooks' : v[0].toUpperCase() + v.slice(1)}</button>)}</div>
    <button className="wallet-button" type="button" onClick={connect}>{wallet || 'Connect wallet'}</button>
  </nav>;
}

type RuleProps = { asset:string; setAsset:(v:string)=>void; condition:Condition; setCondition:(v:Condition)=>void; threshold:number; setThreshold:(v:number)=>void; action:Action; setAction:(v:Action)=>void; amount:number; setAmount:(v:number)=>void; onSimulate:()=>void; onActivate:()=>void };

function RuleCard(p: RuleProps) {
  return <div className="strategy-card">
    <div className="card-meta"><span>NEW STRATEGY</span><span className="draft-pill">DRAFT</span></div>
    <div className="rule-block"><span className="rule-label">WHEN</span><div className="rule-sentence">
      <label className="select-chip"><AssetIcon symbol={p.asset}/><select value={p.asset} onChange={e => p.setAsset(e.target.value)} aria-label="Condition asset">{symbols.map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="select-chip condition-chip"><select value={p.condition} onChange={e => p.setCondition(e.target.value as Condition)} aria-label="Condition">{['falls','rises above','falls below','rises','every Monday'].map(c=><option key={c}>{c}</option>)}</select></label>
      {p.condition !== 'every Monday' && <label className="value-input"><input type="number" min="1" max="100" value={p.threshold} onChange={e=>p.setThreshold(Number(e.target.value))}/><span>%</span></label>}
    </div></div>
    <div className="rule-connector"><span>↓</span></div>
    <div className="rule-block then-block"><span className="rule-label">DO</span><div className="rule-sentence action-sentence">
      <select className="action-select" value={p.action} onChange={e=>p.setAction(e.target.value as Action)}><option>BUY</option><option>SELL</option><option>NOTIFY</option></select>
      {p.action !== 'NOTIFY' ? <><label className="amount-chip">$<input type="number" min="1" value={p.amount} onChange={e=>p.setAmount(Number(e.target.value))}/></label><span>{p.asset}</span><small>{p.action === 'BUY' ? 'WITH USDG' : 'TO USDG'}</small></> : <small className="notify-copy">SEND A WALLET NOTIFICATION</small>}
    </div></div>
    <div className="source-row"><span><i className="live-dot"/> Price source</span><strong>Robinhood / Chainlink</strong></div>
    <div className="card-actions"><button className="simulate-button" onClick={p.onSimulate}><span>▶</span> Simulate</button><button className="activate-button" onClick={p.onActivate}>Review & activate <span>→</span></button></div>
  </div>;
}

function Home(p: RuleProps & { setView:(v:View)=>void }) {
  const flow = [
    ['01','DEFINE','Write the market condition in plain language.'],
    ['02','SIMULATE','Preview the signal, checks, and resulting action.'],
    ['03','PERMIT','Set a hard spend ceiling and permission expiry.'],
    ['04','EXECUTE','Rook moves only when every guardrail passes.'],
  ];
  const pieces = [
    ['♜','THE ROOK','Executes the bounded action only after every rule and permission check passes.'],
    ['♛','THE ORACLE','Supplies the verified market signal that starts each strategy evaluation.'],
    ['♝','THE GUARD','Rejects stale prices, unhealthy network state, and out-of-bounds moves.'],
    ['♞','THE TRIGGER','Turns your condition into deterministic, inspectable strategy logic.'],
    ['♟','THE LIMIT','Caps each execution, total allocation, and the lifetime of permission.'],
    ['♔','THE OWNER','You remain the final authority: activate, pause, edit, or revoke at any time.'],
  ];
  return <div className="home-v2">
    <section className="command-hero cinematic-hero">
      <div className="cinematic-visual" aria-hidden="true"><img src="/hero-rook-web3.png" alt=""/><span/></div>
      <div className="hero-serial"><span>ROOK / ROBINHOOD_CHAIN</span><span>WEB3 AUTOMATION · 001</span></div>
      <div className="cinematic-copy">
        <div className="hero-brand-lockup"><img src="/rook-mark.png" alt=""/><span>ROOK PROTOCOL</span></div>
        <p className="cinematic-kicker"><i/> PROGRAMMABLE MARKETS</p>
        <h1>COMMAND<br/><span>THE MOVE.</span></h1>
        <p>Turn market intent into a guarded onchain position. Build the rule, simulate every outcome, and authorize only the move you want Rook to make.</p>
        <div className="hero-actions hero-actions-v2"><button className="primary-button" onClick={()=>p.setView('create')}>BUILD YOUR ROOK <span>→</span></button><button className="system-link" onClick={()=>p.setView('explore')}>EXPLORE STRATEGIES ↗</button></div>
      </div>
      <div className="cinematic-footer"><span>01 / SIGNAL</span><span>02 / SIMULATE</span><span>03 / PERMISSION</span><span>04 / EXECUTE</span></div>
    </section>

    <section className="system-section control-section">
      <div className="section-rail"><span>{'// SECTION: CONTROL_SURFACE'}</span><i/><b>004</b></div>
      <div className="control-console">
        <div className="console-heading"><span>ROOK_TERMINAL.SYS</span><span>LIVE STRATEGY PREVIEW</span><span>POSITION: {p.asset}/{p.action}</span></div>
        <div className="console-grid"><ChessBoard asset={p.asset} action={p.action}/><RuleCard {...p}/></div>
        <div className="console-metrics">
          <div><strong>04</strong><span>GUARDRAIL CHECKS</span></div>
          <div><strong>100%</strong><span>OWNER CONTROL</span></div>
          <div><strong>01</strong><span>BOUNDED ACTION</span></div>
          <div><strong>0</strong><span>HIDDEN MOVES</span></div>
        </div>
      </div>
    </section>

    <section className="system-section about-section">
      <div className="section-rail"><span>{'// SECTION: ABOUT_ROOK'}</span><i/><b>005</b></div>
      <div className="about-grid">
        <div className="rook-schematic"><div className="schematic-label"><span>RENDER: ROOK_ENGINE.WIREFRAME</span><b>VERIFIED</b></div><div className="wireframe-media"><img src="/reference-wireframe-rook.png" alt="Technical wireframe study of the Rook strategy engine"/><img className="wireframe-logo" src="/rook-mark.png" alt=""/></div><div className="schematic-foot"><span>CHAIN: ROBINHOOD</span><span>MODE: NON-CUSTODIAL</span></div></div>
        <div className="about-copy"><div className="file-bar"><span>PROGRAMMABLE_MARKETS.MD</span><span>V1.0.0</span></div><h2>Market intent becomes<br/><em>bounded execution.</em></h2><p>Most automation products ask for broad access and hide the path between a signal and a trade. Rook makes the entire position legible before anything is activated.</p><p>Choose an asset, define a condition, simulate the result, and grant only the permission that strategy needs. If the oracle is stale, the network is unhealthy, or a limit would be exceeded, the move is rejected.</p><div className="proof-strip"><span>LEGAL MOVE:</span><strong>VALIDATED BEFORE EXECUTION</strong></div><div className="about-stats"><div><span>ASSET_SCOPE</span><b>1 Rule</b></div><div><span>MAX_SPEND</span><b>Hard cap</b></div><div><span>PERMISSION</span><b>Revocable</b></div><div><span>FAILURE_MODE</span><b>Reject</b></div></div></div>
      </div>
    </section>

    <section className="system-section pieces-section">
      <div className="section-rail"><span>{'// SECTION: STRATEGY_PIECES'}</span><i/><b>005.5</b></div>
      <div className="pieces-heading"><span>THE ROOK SYSTEM</span><h2>EVERY PIECE<br/><em>HAS ONE JOB.</em></h2><p>A composable Web3 execution system where signals, permissions, safety checks, and owner control remain visibly separated.</p></div>
      <div className="pieces-grid">{pieces.map(([glyph,title,copy],i)=><article key={title}><div className="piece-visual"><span>{glyph}</span><i>0{i+1}</i></div><div><small>PROTOCOL MODULE</small><h3>{title}</h3><p>{copy}</p><b>INSPECT MODULE <span>↗</span></b></div></article>)}</div>
    </section>

    <section className="system-section flow-section">
      <div className="section-rail"><span>{'// SECTION: EXECUTION_FLOW'}</span><i/><b>006</b></div>
      <div className="flow-heading"><div><h2>HOW ROOK WORKS</h2><p>Four visible stages from market idea to constrained onchain action.</p></div><span><i/> POSITION INTEGRITY: 100%</span></div>
      <div className="flow-grid">{flow.map(([n,t,c],i)=><article className={i===2?'flow-card flow-card-dark':'flow-card'} key={t}><div className="flow-card-top"><span>STEP_{n}</span><b>{t}</b></div><strong>{n}</strong><h3>{t} THE MOVE</h3><p>{c}</p><ul>{i===0?<><li>Tokenized stocks and ETFs</li><li>Plain-language conditions</li><li>Explicit action amount</li></>:i===1?<><li>Deterministic preview</li><li>Oracle health check</li><li>No funds are moved</li></>:i===2?<><li>Per-execution ceiling</li><li>Total allocation limit</li><li>Time-bounded access</li></>:<><li>All checks must pass</li><li>Transparent position state</li><li>Pause or revoke anytime</li></>}</ul><button onClick={()=>p.setView(i===0?'create':i===1?'create':i===2?'create':'rooks')}>{i===3?'VIEW MY ROOKS':'OPEN BUILDER'} <span>→</span></button></article>)}</div>
      <div className="failure-rule">* NO SILENT FALLBACKS: WHEN A SAFETY CHECK FAILS, ROOK DOES NOT EXECUTE.</div>
    </section>

    <section className="ecosystem-tape"><span>ROBINHOOD CHAIN</span><span>STOCK TOKENS</span><span>BOUNDED PERMISSIONS</span><span>ORACLE CHECKS</span><span>SIMULATION</span><span>REVOCABLE ACCESS</span></section>
    <section className="final-command"><div><img src="/rook-mark.png" alt=""/><span>READY / YOUR_MOVE</span><h2>Build a position<br/>you can explain.</h2></div><button className="primary-button" onClick={()=>p.setView('create')}>PROGRAM YOUR ROOK <span>→</span></button></section>
  </div>;
}

function Market({ assets, loading, error, choose }:{assets:Asset[];loading:boolean;error:string;choose:(s:string)=>void}) {
  const [search,setSearch]=useState(''); const shown=assets.filter(a=>`${a.tokenSymbol} ${a.tokenName}`.toLowerCase().includes(search.toLowerCase())).slice(0,24);
  return <section className="page-shell"><div className="page-heading"><div><p className="eyebrow"><span/> LIVE ASSET REGISTRY</p><h2>Market</h2><p>Canonical Stock Tokens and ETFs available on Robinhood Chain.</p></div><label className="search-box">⌕ <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assets"/></label></div>{loading&&<div className="state-card">Reading the Robinhood asset registry…</div>}{error&&<div className="warning-card"><strong>Market data unavailable</strong><p>{error} No values have been substituted.</p></div>}{!loading&&!error&&<div className="market-grid">{shown.map(a=>{const d=a.deployments?.find(x=>x.chainId===4663);const mid=a.quote?((Number(a.quote.bid)+Number(a.quote.ask))/2).toFixed(2):'';return <article className="asset-card" key={a.tokenSymbol}><div className="asset-title">{a.logoUrl?<img src={a.logoUrl} alt="" loading="lazy"/>:<AssetIcon symbol={a.tokenSymbol}/>}<div><strong>{a.tokenSymbol}</strong><p>{a.tokenName.replace(' • Robinhood Token','')}</p></div><span className="type-pill">STOCK TOKEN</span></div><div className="asset-price"><strong>{mid?`$${mid}`:'Price unavailable'}</strong><span>24h —</span></div><dl><div><dt>Wallet balance</dt><dd>Connect to view</dd></div><div><dt>Price source</dt><dd>{a.quote?'Robinhood · live':'Unavailable'}</dd></div><div><dt>Contract</dt><dd>{d?`${d.contractAddress.slice(0,6)}…${d.contractAddress.slice(-4)}`:'Unavailable'}</dd></div></dl><button className="asset-action" onClick={()=>choose(a.tokenSymbol)}>Create automation <span>→</span></button></article>})}</div>}{!loading&&!error&&!shown.length&&<div className="state-card"><strong>No assets found.</strong></div>}</section>;
}

function Builder(p: RuleProps) {
  const move = p.condition === 'every Monday' ? p.asset + ' every Monday' : p.asset + ' ' + p.condition + ' ' + p.threshold + '%';
  const result = p.action === 'NOTIFY' ? 'Notify me without moving funds.' : (p.action === 'BUY' ? 'Buy' : 'Sell') + ' up to $' + p.amount + ' of ' + p.asset + ' ' + (p.action === 'BUY' ? 'using' : 'into') + ' USDG.';
  return <section className="page-shell builder-page"><div className="page-heading"><div><p className="eyebrow"><span/> STRATEGY BOARD</p><h2>Play your Rook</h2><p>Build one legal market move, inspect the position, then simulate before granting permission.</p></div><span className="step-badge">MOVE 1 OF 4 · OPENING</span></div><div className="builder-grid chess-builder-grid"><ChessBoard asset={p.asset} action={p.action} compact/><RuleCard {...p}/><aside className="builder-aside"><p className="aside-label">MOVE NOTATION</p><h3>{move}</h3><p>{result}</p><div className="integrity-note"><strong>Legal-move check</strong><p>A move is rejected when the oracle is stale, the sequencer is unhealthy, or the position exceeds your permission.</p></div><div className="mini-flow"><span>♟ Market signal</span><b>↓</b><span>♞ Condition evaluator</span><b>↓</b><span>♗ Permission validation</span><b>↓</b><span>♜ Rook execution</span></div></aside></div></section>;
}

function MyRooks({rooks,setRooks,setView}:{rooks:Rook[];setRooks:React.Dispatch<React.SetStateAction<Rook[]>>;setView:(v:View)=>void}) {
  const change=(id:number,status:Rook['status'])=>setRooks(rs=>rs.map(r=>r.id===id?{...r,status}:r));
  return <section className="page-shell"><div className="page-heading"><div><p className="eyebrow"><span/> YOUR AUTOMATIONS</p><h2>My Rooks</h2><p>Observe, pause, or revoke every permission from one place.</p></div><button className="primary-button" onClick={()=>setView('create')}>Create strategy +</button></div>{!rooks.length?<div className="empty-state"><span className="empty-rook">R</span><h3>Your first Rook is waiting.</h3><p>Create a market rule and see how it behaves before committing funds.</p><button className="primary-button" onClick={()=>setView('create')}>Create strategy →</button></div>:<div className="rook-list">{rooks.map(r=><article className="rook-card" key={r.id}><div className="rook-main"><AssetIcon symbol={r.asset}/><div><span className={`status status-${r.status.toLowerCase()}`}>{r.status}</span><h3>{r.asset} {r.condition} {r.condition==='every Monday'?'':`${r.threshold}%`} → {r.action}</h3><p>Maximum {r.action==='NOTIFY'?'notification only':`$${r.amount} per execution`} · Created {r.created}</p></div></div><div className="rook-stats"><div><span>EXECUTIONS</span><strong>0</strong></div><div><span>ALLOCATED</span><strong>$0</strong></div><div><span>LAST CHECKED</span><strong>Not started</strong></div></div><div className="rook-actions"><button>View</button>{r.status==='ACTIVE'?<button onClick={()=>change(r.id,'PAUSED')}>Pause</button>:<button onClick={()=>change(r.id,'ACTIVE')}>Resume</button>}<button className="danger" onClick={()=>setRooks(rs=>rs.filter(x=>x.id!==r.id))}>Revoke</button></div></article>)}</div>}</section>;
}

function Explore({fork}:{fork:(title:string)=>void}) {
  return <section className="page-shell"><div className="page-heading"><div><p className="eyebrow"><span/> PUBLIC TEMPLATES</p><h2>Explore strategies</h2><p>Start from transparent logic. You always review and grant your own permissions.</p></div></div><div className="template-grid">{templates.map((t,i)=><article className="template-card" key={t.title}><div className="template-top"><span className="template-index">0{i+1}</span><span className={`risk risk-${t.risk.toLowerCase()}`}>{t.risk} risk</span></div><h3>{t.title}</h3><p className="creator">by {t.creator}</p><div className="logic-box"><span>LOGIC</span><strong>{t.rule}</strong></div><p className="assets-line">{t.assets}</p><div className="template-bottom"><span>{t.forks} forks</span><button onClick={()=>fork(t.title)}>Fork strategy →</button></div></article>)}</div><div className="template-note"><strong>Templates cannot access your wallet.</strong><span>Forking only copies public configuration. You must simulate, review, and activate it yourself.</span></div></section>;
}

function Simulation({p,close,activate}:{p:RuleProps;close:()=>void;activate:()=>void}) {
  const [stage,setStage]=useState(0);useEffect(()=>{const id=setInterval(()=>setStage(s=>Math.min(4,s+1)),450);return()=>clearInterval(id)},[]);const stages=['Condition','Market check','Rule matched','Action permitted','Execution'];
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal"><button className="modal-close" onClick={close}>×</button><p className="modal-kicker">DETERMINISTIC SIMULATION · NOT ONCHAIN ACTIVITY</p><h2>See exactly what happens.</h2><p className="modal-sub">This uses your inputs and current rule logic. Historical triggers are not shown because no verified historical dataset is connected.</p><div className="simulation-flow">{stages.map((s,i)=><div className={i<=stage?'flow-active':''} key={s}><span>{i<stage?'✓':i+1}</span><p>{s}</p>{i<4&&<b>→</b>}</div>)}</div><div className="sim-summary"><div><span>RULE</span><strong>{p.asset} {p.condition} {p.condition==='every Monday'?'':`${p.threshold}%`}</strong></div><div><span>RESULT</span><strong>{p.action==='NOTIFY'?'Send notification':`${p.action} up to $${p.amount} ${p.asset}`}</strong></div><div><span>REQUIRED BALANCE</span><strong>{p.action==='BUY'?`${p.amount} USDG`:p.action==='SELL'?`${p.amount} USD of ${p.asset}`:'None'}</strong></div><div><span>ESTIMATED COST</span><strong>Calculated before signing</strong></div></div><div className="risk-note"><strong>Key risk</strong><p>Prices may move between evaluation and settlement. Execution is rejected when oracle data is stale, the sequencer is unhealthy, or your limit would be exceeded.</p></div><div className="modal-actions"><button className="simulate-button" onClick={close}>Edit rule</button><button className="activate-button" onClick={activate}>Review permissions →</button></div></div></div>;
}

function Permission({p,close,confirm}:{p:RuleProps;close:()=>void;confirm:()=>void}) {
  const [total,setTotal]=useState(p.amount*5),[days,setDays]=useState(30);
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal permission-modal"><button className="modal-close" onClick={close}>×</button><p className="modal-kicker">STEP 3 OF 4 · PERMISSION</p><h2>You stay in control.</h2><p className="modal-sub">Rook receives a narrow, revocable permission—not open wallet access.</p><div className="permission-columns"><div className="may"><h3>ROOK MAY</h3><p>✓ {p.action==='NOTIFY'?'Send a notification':`${p.action==='BUY'?'Spend':'Sell'} up to $${p.amount} per execution`}</p><p>✓ {p.action==='NOTIFY'?'Watch':p.action==='BUY'?'Purchase':'Sell'} {p.asset}</p><p>✓ Act only when your rule passes</p></div><div className="cannot"><h3>ROOK CANNOT</h3><p>× Transfer unrelated assets</p><p>× Spend beyond your total limit</p><p>× Change this strategy</p></div></div>{p.action!=='NOTIFY'&&<div className="limit-grid"><label>MAXIMUM TOTAL ALLOCATION<span><b>$</b><input type="number" min={p.amount} value={total} onChange={e=>setTotal(Number(e.target.value))}/></span></label><label>PERMISSION EXPIRY<span><input type="number" min="1" value={days} onChange={e=>setDays(Number(e.target.value))}/><b>days</b></span></label></div>}<div className="transaction-summary"><strong>YOU ARE ABOUT TO</strong><p>Authorize: <b>{p.action==='NOTIFY'?'notifications only':`up to $${total} total`}</b></p><p>Network: <b>Robinhood Chain Testnet · 46630</b></p><small>This preview saves a local strategy after wallet/network approval. It does not submit a contract transaction.</small></div><div className="modal-actions"><button className="simulate-button" onClick={close}>Back</button><button className="activate-button" onClick={confirm}>Connect & activate →</button></div></div></div>;
}

export function RookApp() {
  const [view,setView]=useState<View>('home'),[asset,setAsset]=useState('NVDA'),[condition,setCondition]=useState<Condition>('falls'),[threshold,setThreshold]=useState(5),[action,setAction]=useState<Action>('BUY'),[amount,setAmount]=useState(100),[modal,setModal]=useState<'simulate'|'permission'|null>(null),[wallet,setWallet]=useState(''),[toast,setToast]=useState('');
  const [assets,setAssets]=useState<Asset[]>([]),[marketLoading,setMarketLoading]=useState(true),[marketError,setMarketError]=useState(''),[rooks,setRooks]=useState<Rook[]>([]);
  useEffect(()=>{Promise.resolve().then(()=>{try{setRooks(JSON.parse(localStorage.getItem('rook-strategies')||'[]'))}catch{}})},[]);useEffect(()=>{localStorage.setItem('rook-strategies',JSON.stringify(rooks))},[rooks]);
  useEffect(()=>{fetch('/api/market').then(r=>r.ok?r.json() as Promise<{assets?:Asset[]}>:Promise.reject()).then(data=>{const all:Asset[]=data.assets||[];setAssets(all.filter(a=>a.deployments?.some(d=>d.chainId===4663)));setMarketLoading(false)}).catch(()=>{setMarketError('The official Robinhood endpoint did not respond.');setMarketLoading(false)})},[]);
  const connect=async()=>{const ethereum=(window as Window&{ethereum?:{request:(a:{method:string;params?:unknown[]})=>Promise<unknown>}}).ethereum;if(!ethereum){setToast('No compatible browser wallet found. Install an EVM wallet to continue.');return false}try{const accounts=await ethereum.request({method:'eth_requestAccounts'}) as string[];await ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:`0x${robinhoodTestnet.id.toString(16)}`,chainName:robinhoodTestnet.name,nativeCurrency:robinhoodTestnet.nativeCurrency,rpcUrls:robinhoodTestnet.rpcUrls.default.http,blockExplorerUrls:[robinhoodTestnet.blockExplorers.default.url]}]});setWallet(`${accounts[0].slice(0,6)}…${accounts[0].slice(-4)}`);setToast('Wallet connected to Robinhood Chain Testnet.');return true}catch{setToast('Wallet connection was cancelled or the network could not be added.');return false}};
  const p=useMemo<RuleProps>(()=>({asset,setAsset,condition,setCondition,threshold,setThreshold,action,setAction,amount,setAmount,onSimulate:()=>setModal('simulate'),onActivate:()=>setModal('permission')}),[asset,condition,threshold,action,amount]);
  const activate=async()=>{if(!wallet&&!await connect()){setModal(null);return}setRooks(r=>[{id:Date.now(),asset,condition,threshold,action,amount,status:'ACTIVE',created:'today'},...r]);setModal(null);setView('rooks');setToast('Strategy saved as an active testnet preview. No funds moved.')};
  const fork=(title:string)=>{if(title==='Weekly Tech DCA'){setAsset('NVDA');setCondition('every Monday');setAction('BUY');setAmount(50)}else if(title==='Market Dip Buyer'){setAsset('SPY');setCondition('falls');setThreshold(3);setAction('BUY')}else{setAsset('MSFT');setCondition('rises');setThreshold(8);setAction('SELL')}setView('create');setToast(`${title} copied. Review every field before activation.`)};
  return <main><Nav view={view} setView={setView} wallet={wallet} connect={()=>{void connect()}}/>{view==='home'&&<Home {...p} setView={setView}/>} {view==='market'&&<Market assets={assets} loading={marketLoading} error={marketError} choose={s=>{setAsset(s);setView('create')}}/>} {view==='create'&&<Builder {...p}/>} {view==='rooks'&&<MyRooks rooks={rooks} setRooks={setRooks} setView={setView}/>} {view==='explore'&&<Explore fork={fork}/>}<footer><span>ROOK</span><p>Programmable markets on Robinhood Chain.</p><div><a href="https://magnum-inc.gitbook.io/rook/" target="_blank">Rook docs ↗</a><a href="https://docs.robinhood.com/chain/" target="_blank">Chain docs ↗</a><a href="https://docs.robinhood.com/chain/stock-tokens/" target="_blank">Stock Token disclosure ↗</a></div></footer>{modal==='simulate'&&<Simulation p={p} close={()=>setModal(null)} activate={()=>setModal('permission')}/>} {modal==='permission'&&<Permission p={p} close={()=>setModal(null)} confirm={()=>{void activate()}}/>}{toast&&<button className="toast" onClick={()=>setToast('')} aria-live="polite">{toast}<span>×</span></button>}</main>;
}
