import type { Express } from "express";
import { INTEGRACAO_CLUSTERS } from "@shared/integracaoAssessment";
import { DICAS_ESCALA, LEGENDA_ESCALA, PROGRAMA_INTEGRACAO_CATALOG, UNIDADES_INTEGRACAO } from "./programaIntegracaoCatalog";

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

const baseCss = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
:root{color-scheme:light;--paper:#F7F8FC;--surface:#FFF;--surface-2:#F8F8FC;--sunk:#EFF1F7;--ink:#152232;--ink-2:#5B6675;--ink-3:#98A0AB;--line:#E3E5EE;--line-2:#D4D8E5;--brand:#6B3E8F;--brand-2:#7A52A2;--brand-soft:#F1EAF7;--brand-ink:#5B3A7D;--amber:#6A74B9;--amber-soft:#EEF0FA;--ok:#1B7A55;--ok-soft:#E6F3ED;--r-m:8px;--r-l:12px;--sh:0 1px 2px rgba(21,34,50,.04),0 3px 10px -6px rgba(21,34,50,.13);--sh-2:0 2px 4px rgba(21,34,50,.06),0 14px 30px -16px rgba(21,34,50,.3);--font-d:"Archivo","Helvetica Neue",Arial,sans-serif;--font-b:"IBM Plex Sans","Segoe UI",system-ui,sans-serif;--font-m:"IBM Plex Mono","SFMono-Regular",Consolas,monospace}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.5 var(--font-b);-webkit-font-smoothing:antialiased}h1,h2,h3{font-family:var(--font-d);letter-spacing:-.012em}button,input,select,textarea{font:inherit}button{cursor:pointer}:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.top{max-width:640px;margin:0 auto;padding:28px 16px 0;display:flex;align-items:center;gap:9px;color:var(--ink-2);font-size:12px}.top .mark{width:26px;height:26px;border-radius:8px;background:var(--brand);color:#fff;display:grid;place-items:center;font:700 10px/1 var(--font-d);flex:0 0 auto}.brand{font-weight:700;color:var(--ink)}.wrap{max-width:640px;margin:0 auto;padding:18px 16px 60px}.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-l);box-shadow:var(--sh-2);padding:26px 24px;margin-bottom:16px}h1{font-size:19px;margin:0 0 6px}h2{font-size:15px;margin:0 0 12px}h3{font-size:13px;margin:0 0 10px}.muted{color:var(--ink-2)}.small{font-size:11.3px}.intro{color:var(--ink-2);font-size:12.8px;line-height:1.55}.intro p{margin:0 0 11px}.field{margin-bottom:14px}.field label{display:block;color:var(--ink-2);font-size:12px;font-weight:600;margin:0 0 5px}.field input,.field select,.field textarea{width:100%;border:1px solid var(--line-2);border-radius:var(--r-m);padding:8px 10px;background:var(--surface);color:var(--ink)}.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--brand);outline:none}.field textarea{min-height:96px;resize:vertical}.req{color:var(--brand);font-weight:700}.hint{font-size:11.3px;color:var(--ink-3);line-height:1.4;margin-top:5px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.section{border-top:1px solid var(--line);padding-top:14px;margin-top:16px}.section-title{text-transform:uppercase;letter-spacing:.08em;font-size:11px;font-weight:700;color:var(--brand-ink);margin-bottom:10px}.btn{border:1px solid var(--line-2);background:var(--surface);color:var(--ink);border-radius:var(--r-m);padding:5px 10px;font-size:12.5px;font-weight:500;line-height:1.35}.btn:hover{border-color:var(--ink-3);background:var(--surface-2)}.btn.primary{background:var(--brand);border-color:var(--brand);color:#fff;font-weight:600}.btn.primary:hover{background:var(--brand-2);border-color:var(--brand-2)}.btn.danger{color:var(--brand-ink)}.btn:disabled{opacity:.45;cursor:not-allowed}.actions{display:flex;justify-content:space-between;gap:10px;margin-top:18px;padding-top:14px;border-top:1px solid var(--line)}.steps{display:flex;gap:5px;margin:14px 0 6px}.step{height:4px;flex:1;border-radius:2px;background:var(--line-2)}.step.on{background:var(--brand)}.step.done{background:var(--ok)}.scale{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.scale label{font:700 13px/1.2 var(--font-m);text-align:center;border:1.5px solid var(--line-2);border-radius:var(--r-m);padding:8px 3px;cursor:pointer;background:var(--surface);color:var(--ink-2)}.scale label:hover{border-color:var(--ink-3)}.scale label:has(input:checked){border-color:transparent;color:#fff}.scale label:nth-child(1):has(input:checked){background:var(--ink-3)}.scale label:nth-child(2):has(input:checked){background:#6B3E8F}.scale label:nth-child(3):has(input:checked){background:#5267A8}.scale label:nth-child(4):has(input:checked){background:var(--amber);color:#3a2700}.scale label:nth-child(5):has(input:checked){background:#7FB342}.scale label:nth-child(6):has(input:checked){background:var(--ok)}.multi{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px 10px;background:var(--sunk);border-radius:var(--r-m);padding:10px}.multi label{font-size:12.2px;color:var(--ink-2);padding:2px}.bem-clusters{display:grid;gap:12px}.bem-cluster{border:1px solid var(--line);border-radius:var(--r-l);background:var(--surface-2);padding:12px}.bem-cluster-title{font:700 13px/1.3 var(--font-d);color:var(--ink);margin-bottom:2px}.bem-cluster-count{font-size:10.8px;color:var(--ink-3);margin-bottom:8px}.bem-cluster .multi{background:var(--surface);padding:9px}.err{border-color:var(--brand)!important;background:var(--brand-soft)!important}.msg{padding:10px 12px;border-radius:var(--r-m);margin:10px 0;font-size:12.2px;background:var(--surface-2);border:1px solid var(--line)}.msg.error{background:var(--brand-soft);color:var(--brand-ink);border-color:#D9CDE8}.msg.ok{background:var(--ok-soft);color:#166348;border-color:#cce7da}.proto{font:700 18px/1.2 var(--font-m);letter-spacing:.04em}.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}.tab{border:1px solid var(--line-2);background:var(--surface);padding:5px 10px;border-radius:var(--r-m);cursor:pointer}.tab.on{background:#152232;color:#fff;border-color:#152232}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.kpi{background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--line-2);border-radius:var(--r-l);padding:11px 13px;box-shadow:var(--sh)}.kpi b{font:700 24px/1.05 var(--font-d);display:block}.tablewrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:12.4px}th,td{text-align:left;padding:8px 11px;border-bottom:1px solid var(--line);vertical-align:top}th{font:700 9.6px/1.2 var(--font-d);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3);background:var(--sunk)}td{background:var(--paper)}.badge{display:inline-block;border-radius:999px;background:var(--surface-2);border:1px solid var(--line);padding:2px 7px;font-size:10.5px}.linkbox{display:flex;gap:8px;align-items:center}.linkbox code{flex:1;padding:8px;background:var(--sunk);border-radius:7px;overflow:auto}.hidden{display:none}.modal{position:fixed;inset:0;background:rgba(15,23,32,.5);display:grid;place-items:center;padding:20px;z-index:50}.modal>.card{width:min(700px,100%);max-height:90vh;overflow:auto;margin:0}
@media(max-width:720px){.grid,.kpis{grid-template-columns:1fr}.multi{grid-template-columns:repeat(2,minmax(0,1fr))}.wrap{padding-top:12px}.top{padding-top:18px}.card{padding:20px 16px}.actions{position:sticky;bottom:0;background:var(--surface);padding:10px 0 2px}.scale{grid-template-columns:repeat(3,1fr)}}
/* Experiência moderna exclusiva dos cinco formulários públicos do Programa de Integração. */
body{background:linear-gradient(180deg,#F4F1F9 0,#F7F8FC 260px,#F7F8FC 100%);min-height:100vh}
.top{max-width:920px;padding:26px 20px 0}.wrap{max-width:920px;padding:18px 20px 72px}
.form-shell{background:rgba(255,255,255,.94);border:1px solid rgba(107,62,143,.13);border-radius:20px;box-shadow:0 24px 60px -36px rgba(50,31,72,.45);overflow:hidden}
.form-hero{padding:28px 30px 24px;background:linear-gradient(135deg,#5B367F 0%,#6B3E8F 45%,#5267A8 100%);color:#fff}
.form-hero .eyebrow{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;opacity:.78}
.form-hero h1{font-size:28px;line-height:1.15;margin:7px 0 8px;color:#fff}
.form-hero p{margin:0;max-width:760px;color:rgba(255,255,255,.86);font-size:13.5px;line-height:1.6}
.role-pill{display:inline-flex;margin-top:14px;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.11);border-radius:999px;padding:5px 10px;font-size:11px;font-weight:600}
.form-body{padding:26px 30px 30px}.card{border-radius:16px;padding:0;box-shadow:none;border-color:var(--line)}
.intro-card{padding:18px 20px;border:1px solid #E6DCEF;border-radius:14px;background:linear-gradient(180deg,#FBF9FD,#F7F4FB);color:var(--ink-2)}
.intro-card p{margin:0 0 9px}.intro-card p:last-child{margin-bottom:0}
.form-section{margin-top:18px;padding:20px;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:0 10px 28px -28px rgba(32,38,55,.5)}
.form-section-head{display:flex;align-items:flex-start;gap:11px;margin-bottom:17px}
.section-index{width:27px;height:27px;display:grid;place-items:center;flex:0 0 auto;border-radius:9px;background:var(--brand-soft);color:var(--brand-ink);font:700 11px/1 var(--font-d)}
.form-section h2{font-size:17px;margin:1px 0 3px}.form-section-intro{color:var(--ink-2);font-size:12.8px;line-height:1.6;white-space:pre-line}
.field{margin-bottom:0;padding:15px 0;border-top:1px solid rgba(227,229,238,.72)}
.field:first-child{border-top:0;padding-top:0}.field:last-child{padding-bottom:0}
.field>label,.question-label{display:block;color:var(--ink);font-size:13.2px;font-weight:600;line-height:1.45;margin:0 0 7px;white-space:pre-line}
.field input,.field select,.field textarea{min-height:44px;border-radius:10px;padding:10px 12px;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease}
.field textarea{min-height:122px;line-height:1.55;resize:vertical}
.field input:hover,.field select:hover,.field textarea:hover{border-color:#BBA7CB}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(107,62,143,.12);background:#fff}
.field.filled input,.field.filled select,.field.filled textarea{background:#FCFBFD}
.field.has-error input,.field.has-error select,.field.has-error textarea{border-color:#B64848;background:#FFF9F9}
.field-error{display:flex;align-items:flex-start;gap:6px;margin-top:7px;color:#983B3B;font-size:11.5px;font-weight:600}
.hint{margin-top:6px;font-size:11.5px;line-height:1.48;white-space:pre-line}
.multi{gap:8px;background:transparent;padding:0}
.multi label{display:flex;align-items:flex-start;gap:8px;min-height:42px;padding:10px 11px;border:1px solid var(--line);border-radius:10px;background:#fff;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease,background .15s ease}
.multi label:hover{transform:translateY(-1px) scale(1.005);border-color:#BBA7CB;box-shadow:0 8px 18px -16px rgba(60,36,83,.55)}
.multi label:has(input:checked){border-color:var(--brand);background:var(--brand-soft);color:var(--brand-ink);box-shadow:0 0 0 1px rgba(107,62,143,.08)}
.multi input{accent-color:var(--brand);margin-top:2px}
.bem-cluster{padding:15px;border-radius:13px;background:#FAFAFD}.bem-cluster-title{font-size:13.5px}.bem-cluster-count{margin-bottom:10px}
.scale{gap:8px}.scale label{min-height:72px;display:flex;flex-direction:column;justify-content:center;gap:5px;border-radius:11px;padding:9px 5px;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}.scale label:hover{transform:translateY(-1px) scale(1.01);box-shadow:0 10px 18px -17px rgba(38,31,53,.65)}.scale input{position:absolute;opacity:0;pointer-events:none}
.btn{min-height:42px;padding:9px 16px;border-radius:10px;transition:transform .13s ease,box-shadow .15s ease,background .15s ease,border-color .15s ease}
.btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 18px -16px rgba(45,31,58,.5)}.btn:active:not(:disabled){transform:translateY(0) scale(.99)}
.btn.primary{box-shadow:0 10px 24px -16px rgba(107,62,143,.65)}.btn:focus-visible,.multi label:focus-within,.scale label:focus-within{outline:3px solid rgba(107,62,143,.2);outline-offset:2px}
.actions{position:sticky;bottom:0;z-index:5;margin:24px -30px -30px;padding:14px 30px;border-top:1px solid var(--line);background:rgba(255,255,255,.94);backdrop-filter:blur(10px)}
.progress-card{margin:0 0 18px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:#FAFAFD}.progress-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11.5px;color:var(--ink-2)}.progress-track{height:7px;margin-top:8px;border-radius:999px;background:var(--sunk);overflow:hidden}.progress-bar{height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--brand),#5267A8);transition:width .25s ease}
.steps{margin:0 0 9px}.page-label{text-align:center;margin-bottom:18px;color:var(--ink-2);font-size:11.5px}
.success-state{text-align:center;padding:42px 26px}.success-icon{width:58px;height:58px;margin:0 auto 15px;display:grid;place-items:center;border-radius:50%;background:var(--ok-soft);color:var(--ok);font-size:28px;font-weight:700;animation:pi-pop .32s ease both}.success-state h1{font-size:25px}.success-state .intro{max-width:680px;margin:18px auto 0}
.char-count{text-align:right;margin-top:5px;color:var(--ink-3);font-size:10.8px}
.conditional-note{margin:-2px 0 12px;padding:10px 12px;border-radius:10px;background:var(--surface-2);color:var(--ink-2);font-size:11.5px}
.reveal{opacity:0;transform:translateY(10px);transition:opacity .34s ease,transform .34s ease}.reveal.visible{opacity:1;transform:none}
.loading-inline{display:inline-flex;align-items:center;gap:8px}.spinner{width:15px;height:15px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:pi-spin .7s linear infinite}
@keyframes pi-spin{to{transform:rotate(360deg)}}@keyframes pi-pop{from{opacity:0;transform:scale(.92) translateY(5px)}to{opacity:1;transform:none}}
@media(max-width:720px){body{background:var(--paper)}.top{padding:16px 14px 0}.wrap{padding:12px 10px 32px}.form-shell{border-radius:14px}.form-hero{padding:22px 18px}.form-hero h1{font-size:22px}.form-body{padding:18px 14px 20px}.form-section{padding:16px 14px}.actions{margin:20px -14px -20px;padding:12px 14px}.multi{grid-template-columns:1fr}.scale{grid-template-columns:repeat(2,minmax(0,1fr))}.scale label{min-height:58px}.grid{grid-template-columns:1fr}.btn{min-height:46px}.form-section-head{gap:9px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}.reveal{opacity:1!important;transform:none!important}.multi label:hover,.scale label:hover,.btn:hover{transform:none!important}}

`

function normalizarTextoFormularioPublico<T>(valor: T): T {
  if (typeof valor === "string") {
    return valor.replace(/\\n/g, "\n") as T;
  }
  if (Array.isArray(valor)) {
    return valor.map((item) => normalizarTextoFormularioPublico(item)) as T;
  }
  if (valor && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([chave, item]) => [
        chave,
        normalizarTextoFormularioPublico(item),
      ]),
    ) as T;
  }
  return valor;
}

function publicFormHtml(slug: string) {
  const formBase = PROGRAMA_INTEGRACAO_CATALOG[slug];
  if (!formBase) return null;
  const form = normalizarTextoFormularioPublico(formBase);
  const data = safeJson({ form, unidades: UNIDADES_INTEGRACAO, dicasEscala: DICAS_ESCALA, legendaEscala: LEGENDA_ESCALA, clustersBem: INTEGRACAO_CLUSTERS });
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${form.name} · EcoLíder</title><style>${baseCss}</style></head><body>
  <div class="top"><div class="mark">CKM</div><div><b>Programa de Integração · Sebrae/TO</b><div class="small muted">Formulário oficial hospedado no EcoLíder</div></div></div>
  <main class="wrap" id="app"></main>
  <script>const DATA=${data};
  const f=DATA.form;
  const paginado=f.key==='pesquisa'||f.key==='aval';
  let page=0,sent=false,sending=false,result=null,error='',errorField='';
  let ACTIVE={colaboradores:[],gestores:[],anjos:[]};
  const values={nomeColaborador:'',unidade:'',outraUnidade:'',dataInicio:'',emailColaborador:'',respondentName:'',cycleValue:'',role:'',answers:{}};
  const pages=paginado?[{title:'Identificação',identity:true},...f.sections]:[{title:'Formulário',all:true}];
  const storageKey='eco-integracao-draft-'+f.slug;

  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function textHtml(s){return esc(String(s??'').replace(/\\n/g,'\n')).replace(/\n/g,'<br>');}
  function optionValue(o){return typeof o==='string'?o:o.value}
  function optionLabel(o){return typeof o==='string'?o:o.label}
  function currentValue(code){return values.answers[code]??''}
  function isYes(v){return /^(sim|SIM)$/i.test(String(v||'').trim())}
  function shouldShow(q){
    if(q.code==='aval_reacao_feedback'&&values.role!=='Gestor')return false;
    if(q.code==='pdi_qual_acao_motivo')return isYes(values.answers.pdi_relatou_dificuldade);
    if(q.code==='pdi_qual_alteracao')return isYes(values.answers.pdi_houve_readequacao);
    if(q.code==='pdi_qual_realinhamento')return isYes(values.answers.pdi_realinhamento_postura);
    return true;
  }
  function roleCopy(){return f.targetRole?'Respondente: '+f.targetRole:''}
  function progressPct(){return Math.round(((page+1)/pages.length)*100)}
  function fieldError(code){return errorField===code?'<div class="field-error" role="alert">⚠ '+esc(error)+'</div>':''}
  function fieldClass(code,v){return 'field reveal '+(String(v??'').trim()?'filled ':'')+(errorField===code?'has-error ':'')}

  function saveDraft(){
    if(f.key!=='aval')return;
    try{sessionStorage.setItem(storageKey,JSON.stringify({values,page,at:Date.now()}));}catch{}
  }
  function restoreDraft(){
    if(f.key!=='aval')return;
    try{
      const raw=sessionStorage.getItem(storageKey);if(!raw)return;
      const d=JSON.parse(raw);
      if(!d||!d.values)return;
      Object.assign(values,d.values);
      values.answers={...(d.values.answers||{})};
      if(Number.isInteger(d.page))page=Math.max(0,Math.min(pages.length-1,d.page));
    }catch{}
  }
  function clearDraft(){try{sessionStorage.removeItem(storageKey)}catch{}}

  function field(q){
    if(!shouldShow(q))return '';
    const v=currentValue(q.code);let ctl='';
    const required=q.required!==false||(q.code==='aval_reacao_feedback'&&values.role==='Gestor');
    const label='<div class="question-label">'+textHtml(q.label)+(required?' <span class="req">*</span>':'')+'</div>';
    if(q.type==='scale'){
      ctl='<div class="scale" role="radiogroup" aria-label="'+esc(q.label)+'">'+[0,1,2,3,4,5].map(n=>'<label><input type="radio" name="'+esc(q.code)+'" data-code="'+esc(q.code)+'" value="'+n+'" '+(String(v)===String(n)?'checked':'')+'><span style="font:700 16px/1 var(--font-m)">'+n+'</span><span class="small">'+esc(n===0?'Sem opinião':n===1?'Discordo totalmente':n===2?'Discordo':n===3?'Neutro':n===4?'Concordo':'Concordo totalmente')+'</span></label>').join('')+'</div>';
    }else if(q.type==='select'){
      ctl='<select data-code="'+esc(q.code)+'" aria-label="'+esc(q.label)+'"><option value="">Selecione…</option>'+q.options.map(o=>'<option value="'+esc(optionValue(o))+'" '+(String(v)===String(optionValue(o))?'selected':'')+'>'+esc(optionLabel(o))+'</option>').join('')+'</select>';
    }else if(q.type==='multi'){
      const arr=Array.isArray(v)?v:String(v||'').split(',').map(x=>x.trim()).filter(Boolean);const set=new Set(arr);
      if(q.code==='bem_caracteristicas'){
        ctl='<div class="bem-clusters">'+DATA.clustersBem.map(g=>'<section class="bem-cluster"><div class="bem-cluster-title">'+esc(g.nome)+'</div><div class="bem-cluster-count">'+g.descritoresGestor.length+' opções disponíveis</div><div class="multi">'+g.descritoresGestor.map(x=>'<label><input type="checkbox" data-multi="'+esc(q.code)+'" value="'+esc(x)+'" '+(set.has(x)?'checked':'')+'><span>'+esc(x)+'</span></label>').join('')+'</div></section>').join('')+'</div>';
      }else{
        ctl='<div class="multi">'+q.options.map(o=>{const x=optionValue(o);return '<label><input type="checkbox" data-multi="'+esc(q.code)+'" value="'+esc(x)+'" '+(set.has(x)?'checked':'')+'><span>'+esc(optionLabel(o))+'</span></label>';}).join('')+'</div>';
      }
    }else if(q.type==='textarea'){
      const len=String(v||'').length;
      ctl='<textarea data-code="'+esc(q.code)+'" aria-label="'+esc(q.label)+'">'+esc(v)+'</textarea><div class="char-count">'+len+' caracteres</div>';
    }else{
      const type=q.type==='date'?'date':q.type==='cpf'||q.type==='tel'?'tel':'text';
      const inputmode=(q.type==='cpf'||q.type==='tel')?' inputmode="numeric"':'';
      const autocomplete=q.type==='tel'?' autocomplete="tel"':q.type==='date'?' autocomplete="bday"':'';
      const extra=q.type==='cpf'?' maxlength="11" placeholder="Somente números"':q.type==='tel'?' maxlength="11" placeholder="63999998888"':'';
      ctl='<input type="'+type+'"'+inputmode+autocomplete+extra+' data-code="'+esc(q.code)+'" aria-label="'+esc(q.label)+'" value="'+esc(v)+'">';
    }
    return '<div class="'+fieldClass(q.code,v)+'" data-field="'+esc(q.code)+'">'+label+(q.hint?'<div class="hint">'+textHtml(q.hint)+'</div>':'')+ctl+fieldError(q.code)+'</div>';
  }

  function identity(){
    let h='<div class="intro-card reveal">'+f.intro.map(p=>'<p>'+textHtml(p)+'</p>').join('')+'</div>';
    h+='<section class="form-section reveal"><div class="form-section-head"><div class="section-index">01</div><div><h2>Sobre quem esta resposta é</h2><div class="small muted">Dados usados para localizar o processo correto e evitar duplicidades.</div></div></div>';
    h+='<div class="'+fieldClass('nomeColaborador',values.nomeColaborador)+'" data-field="nomeColaborador"><label>Nome completo do colaborador <span class="req">*</span></label>'+(f.key==='controle'?'<input data-meta="nomeColaborador" autocomplete="name" value="'+esc(values.nomeColaborador)+'" placeholder="Nome completo do novo colaborador">':'<select data-meta="nomeColaborador"><option value="">Selecione…</option>'+ACTIVE.colaboradores.map(nome=>'<option value="'+esc(nome)+'" '+(values.nomeColaborador===nome?'selected':'')+'>'+esc(nome)+'</option>').join('')+'</select>')+(f.key==='controle'?'<div class="hint">Este formulário inicia o cadastro; por isso o nome pode ser informado livremente.</div>':'<div class="hint">A lista mostra somente colaboradores ativos no Onboarding.</div>')+fieldError('nomeColaborador')+'</div>';
    if(f.identity.unidade){
      h+='<div class="'+fieldClass('unidade',values.unidade)+'" data-field="unidade"><label>Unidade <span class="req">*</span></label><select data-meta="unidade"><option value="">Selecione…</option>'+DATA.unidades.map(u=>'<option value="'+esc(u)+'" '+(values.unidade===u?'selected':'')+'>'+esc(u)+'</option>').join('')+'</select>'+fieldError('unidade')+'</div>';
      if(values.unidade==='Outra')h+='<div class="'+fieldClass('outraUnidade',values.outraUnidade)+'" data-field="outraUnidade"><label>Qual unidade/regional? <span class="req">*</span></label><input data-meta="outraUnidade" value="'+esc(values.outraUnidade)+'" placeholder="Digite o nome da unidade"><div class="hint">Escreva o nome da unidade ou regional.</div>'+fieldError('outraUnidade')+'</div>';
    }
    if(f.identity.dataInicio)h+='<div class="'+fieldClass('dataInicio',values.dataInicio)+'" data-field="dataInicio"><label>Data de início do colaborador <span class="req">*</span></label><input type="date" data-meta="dataInicio" value="'+esc(values.dataInicio)+'">'+fieldError('dataInicio')+'</div>';
    if(f.identity.email)h+='<div class="'+fieldClass('emailColaborador',values.emailColaborador)+'" data-field="emailColaborador"><label>'+(f.key==='controle'?'E-mail Pessoal do Novo Colaborador':'E-mail do colaborador (se souber)')+'</label><input type="email" autocomplete="email" data-meta="emailColaborador" value="'+esc(values.emailColaborador)+'">'+(f.key==='controle'?'<div class="hint">Use o e-mail pessoal do colaborador, não o e-mail institucional do Sebrae/TO.</div>':'')+fieldError('emailColaborador')+'</div>';
    if(f.identity.cycle)h+='<div class="'+fieldClass('cycleValue',values.cycleValue)+'" data-field="cycleValue"><label>'+(f.key==='pesquisa'?'Essa pesquisa refere-se a qual período de participação no programa?':f.key==='aval'?'Essa avaliação refere-se a qual feedback no programa?':'A que período esta resposta se refere?')+' <span class="req">*</span></label><select data-meta="cycleValue"><option value="">Selecione…</option>'+f.cycleOptions.map(o=>'<option value="'+esc(o.value)+'" '+(values.cycleValue===o.value?'selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select>'+fieldError('cycleValue')+'</div>';
    if(f.identity.role)h+='<div class="'+fieldClass('role',values.role)+'" data-field="role"><label>Você está respondendo como <span class="req">*</span></label><select data-meta="role"><option value="">Selecione…</option><option value="Gestor" '+(values.role==='Gestor'?'selected':'')+'>Gestor</option><option value="Anjo" '+(values.role==='Anjo'?'selected':'')+'>Anjo</option></select>'+fieldError('role')+'</div>';
    if(f.identity.respondent){
      const lista=f.key==='bem'?ACTIVE.gestores:f.key==='aval'?(values.role==='Anjo'?ACTIVE.anjos:values.role==='Gestor'?ACTIVE.gestores:[]):null;
      const controle=lista?'<select data-meta="respondentName"><option value="">Selecione…</option>'+lista.map(nome=>'<option value="'+esc(nome)+'" '+(values.respondentName===nome?'selected':'')+'>'+esc(nome)+'</option>').join('')+'</select>':'<input data-meta="respondentName" autocomplete="name" value="'+esc(values.respondentName)+'" placeholder="Nome e sobrenome">';
      h+='</section><section class="form-section reveal"><div class="form-section-head"><div class="section-index">02</div><div><h2>Sobre quem está respondendo</h2><div class="small muted">Identifique a pessoa responsável por esta resposta.</div></div></div><div class="'+fieldClass('respondentName',values.respondentName)+'" data-field="respondentName"><label>Seu nome completo <span class="req">*</span></label>'+controle+fieldError('respondentName')+'</div>';
    }
    return h+'</section>';
  }

  function sectionHtml(section,index){
    const publicTitle=section.publicTitle===''?'Formulário':(section.publicTitle||section.title||'Formulário');
    const tips=(f.key==='pesquisa'||f.key==='aval')&&((paginado&&page===1)||(!paginado&&index===0))
      ?'<div class="intro-card reveal"><p><b>Dicas rápidas para responder</b></p>'+DATA.dicasEscala.map(d=>'<p>• '+esc(d)+'</p>').join('')+'<div style="border-top:1px solid var(--line);margin-top:10px;padding-top:10px">'+DATA.legendaEscala.map(l=>'<p>'+esc(l)+'</p>').join('')+'</div></div>'
      :'';
    const intro=section.intro?'<div class="form-section-intro">'+textHtml(section.intro)+'</div>':'';
    const questions=section.questions.filter(shouldShow).map(field).join('');
    return tips+'<section class="form-section reveal"><div class="form-section-head"><div class="section-index">'+String(index+1).padStart(2,'0')+'</div><div><h2>'+esc(publicTitle)+'</h2>'+intro+'</div></div>'+questions+'</section>';
  }

  function validateIdentity(){
    if(!values.nomeColaborador.trim())return fail('nomeColaborador','Informe o nome completo do colaborador.');
    if(f.identity.unidade&&!values.unidade)return fail('unidade','Selecione a unidade.');
    if(f.identity.unidade&&values.unidade==='Outra'&&!values.outraUnidade.trim())return fail('outraUnidade','Informe qual é a outra unidade/regional.');
    if(f.identity.dataInicio&&!values.dataInicio)return fail('dataInicio','Informe a data de início do colaborador.');
    if(f.identity.cycle&&!values.cycleValue)return fail('cycleValue','Selecione o período deste acompanhamento.');
    if(f.identity.role&&!values.role)return fail('role','Informe se quem responde é Gestor ou Anjo.');
    if(f.identity.respondent&&!values.respondentName.trim())return fail('respondentName','Informe o nome de quem está respondendo.');
    return true;
  }
  function validateQuestions(questions){
    for(const q of questions){
      if(!shouldShow(q))continue;
      const v=values.answers[q.code];
      const filled=Array.isArray(v)?v.length>0:String(v??'').trim()!=='';
      const required=q.required!==false||(q.code==='aval_reacao_feedback'&&values.role==='Gestor');
      if(required&&!filled)return fail(q.code,'Responda esta pergunta antes de continuar.');
      if(q.type==='textarea'&&filled&&String(v).trim().length<10)return fail(q.code,'Escreva pelo menos 10 caracteres para completar esta resposta.');
      if(q.type==='cpf'&&filled&&!/^\d{11}$/.test(String(v).replace(/\D/g,'')))return fail(q.code,'Informe o CPF com 11 números.');
      if(q.type==='tel'&&filled){const n=String(v).replace(/\D/g,'');if(n.length<10||n.length>11)return fail(q.code,'Informe o telefone com DDD, usando 10 ou 11 números.');}
    }
    return true;
  }
  function validateCurrent(){
    error='';errorField='';
    if(!paginado){
      if(!validateIdentity())return false;
      for(const s of f.sections)if(!validateQuestions(s.questions))return false;
      return true;
    }
    if(page===0)return validateIdentity();
    return validateQuestions(pages[page].questions||[]);
  }
  function validateAll(){
    error='';errorField='';
    if(!validateIdentity())return {ok:false,page:0};
    for(let i=0;i<f.sections.length;i++){
      if(!validateQuestions(f.sections[i].questions))return {ok:false,page:paginado?i+1:0};
    }
    return {ok:true,page};
  }
  function fail(code,msg){errorField=code;error=msg;return false}

  function sync(){
    document.querySelectorAll('[data-meta]').forEach(el=>values[el.dataset.meta]=el.value);
    document.querySelectorAll('[data-code]').forEach(el=>{
      if(el.type==='radio'){if(el.checked)values.answers[el.dataset.code]=el.value;}
      else values.answers[el.dataset.code]=el.value;
    });
    document.querySelectorAll('[data-multi]').forEach(el=>{
      const code=el.dataset.multi;
      const all=[...document.querySelectorAll('[data-multi="'+code+'"]')].filter(x=>x.checked).map(x=>x.value);
      values.answers[code]=all;
    });
    saveDraft();
  }

  function focusError(){
    if(!errorField)return;
    requestAnimationFrame(()=>{
      const wrap=document.querySelector('[data-field="'+CSS.escape(errorField)+'"]');
      if(!wrap)return;
      wrap.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
      const control=wrap.querySelector('input,select,textarea,button');
      if(control)setTimeout(()=>control.focus({preventScroll:true}),180);
    });
  }

  function setupReveal(){
    const nodes=[...document.querySelectorAll('.reveal')];
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){nodes.forEach(n=>n.classList.add('visible'));return;}
    if(!('IntersectionObserver'in window)){nodes.forEach(n=>n.classList.add('visible'));return;}
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -25px 0px'});
    nodes.forEach(n=>io.observe(n));
  }

  function bind(){
    document.getElementById('back')?.addEventListener('click',()=>{sync();page=Math.max(0,page-1);error='';errorField='';render();scrollTo({top:0,behavior:'smooth'});});
    document.getElementById('next')?.addEventListener('click',()=>{sync();if(validateCurrent()){page=Math.min(pages.length-1,page+1);error='';errorField='';saveDraft();render();scrollTo({top:0,behavior:'smooth'});}else{render();focusError();}});
    document.getElementById('send')?.addEventListener('click',submit);
    document.querySelectorAll('input,select,textarea').forEach(el=>{
      el.addEventListener('change',()=>{sync();error='';errorField='';if(el.dataset.meta==='unidade'||el.dataset.meta==='role'){if(el.dataset.meta==='role')values.respondentName='';render();}});
      el.addEventListener('input',()=>{sync();});
    });
  }

  async function submit(){
    if(sending)return;
    sync();
    const val=validateAll();
    if(!val.ok){page=val.page;render();focusError();return;}
    const cyc=f.cycleOptions?.find(o=>o.value===values.cycleValue);
    const unidade=values.unidade==='Outra'?values.outraUnidade.trim():values.unidade;
    const payload={nomeColaborador:values.nomeColaborador,unidade,dataInicio:values.dataInicio,emailColaborador:values.emailColaborador,respondentName:f.identity.respondent?values.respondentName:values.nomeColaborador,cycle:cyc?cyc.cycle:0,cycleLabel:cyc?cyc.label:'',role:values.role,answers:values.answers};
    try{
      sending=true;error='';errorField='';render();
      const r=await fetch('/api/public/programa-integracao/forms/${slug}/responses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const j=await r.json();
      if(!r.ok||!j.ok)throw new Error(j.erro||'Não foi possível registrar a resposta.');
      result=j;sent=true;clearDraft();render();scrollTo(0,0);
    }catch(e){
      error=e.message||'Não foi possível enviar a resposta.';errorField='';render();
    }finally{sending=false;if(!sent)render();}
  }

  function render(){
    const app=document.getElementById('app');
    if(sent){
      app.innerHTML='<div class="form-shell"><div class="success-state"><div class="success-icon">✓</div><h1>Formulário enviado com sucesso</h1><p class="muted">As informações foram registradas.</p><div class="msg ok" style="max-width:420px;margin:22px auto"><div class="small muted">Protocolo desta resposta</div><div class="proto">'+esc(result.protocolo||'')+'</div><div class="small muted" style="margin-top:6px">Guarde este número caso precise localizar esta resposta.</div></div>'+(result.pendente?'<p class="small muted">A resposta foi recebida e está aguardando conferência administrativa para vinculação ao processo correto. Não é necessário reenviar.</p>':'')+(f.outro?'<div class="intro">'+f.outro.map(p=>'<p>'+textHtml(p)+'</p>').join('')+'</div>':'')+'</div></div>';
      setupReveal();return;
    }

    const pg=pages[page];
    let body='';
    if(!paginado){
      body=identity()+f.sections.map((s,i)=>sectionHtml(s,i+(f.identity.respondent?2:1))).join('');
    }else if(pg.identity){
      body=identity();
    }else{
      body=sectionHtml(pg,page+(f.identity.respondent?1:0));
    }

    const progress=(paginado?'<div class="progress-card"><div class="progress-row"><span>Progresso do preenchimento</span><b>'+progressPct()+'%</b></div><div class="progress-track" aria-hidden="true"><div class="progress-bar" style="width:'+progressPct()+'%"></div></div></div>':'');
    const globalError=error&&!errorField?'<div class="msg error" role="alert">'+esc(error)+'</div>':'';
    const nav=paginado
      ?'<div class="actions">'+(page?'<button class="btn" id="back" type="button">← Voltar</button>':'<span></span>')+(page<pages.length-1?'<button class="btn primary" id="next" type="button">Avançar →</button>':'<button class="btn primary" id="send" type="button" '+(sending?'disabled':'')+'>'+(sending?'<span class="loading-inline"><span class="spinner"></span>Enviando...</span>':'Enviar formulário')+'</button>')+'</div>'
      :'<div class="actions"><span></span><button class="btn primary" id="send" type="button" '+(sending?'disabled':'')+'>'+(sending?'<span class="loading-inline"><span class="spinner"></span>Enviando...</span>':'Enviar formulário')+'</button></div>';

    app.innerHTML='<div class="form-shell"><header class="form-hero"><div class="eyebrow">Programa de Integração · EcoLíder</div><h1>'+esc(f.name)+'</h1><p>'+textHtml(f.description)+'</p><div class="role-pill">'+esc(roleCopy())+'</div></header><div class="form-body">'+progress+(paginado?'<div class="steps">'+pages.map((_,i)=>'<span class="step '+(i<page?'done':i===page?'on':'')+'"></span>').join('')+'</div><div class="page-label">Etapa '+(page+1)+' de '+pages.length+(pg.title?' · '+esc(pg.title):'')+'</div>':'')+globalError+body+nav+'</div></div>';
    bind();setupReveal();if(errorField)focusError();
  }

  restoreDraft();
  const params=new URLSearchParams(location.search);
  if(params.get('nome'))values.nomeColaborador=params.get('nome')||values.nomeColaborador;
  if(params.get('unidade'))values.unidade=params.get('unidade')||values.unidade;
  if(params.get('ciclo'))values.cycleValue=params.get('ciclo')||values.cycleValue;
  if(params.get('papel'))values.role=params.get('papel')||values.role;
  if(params.get('respondente'))values.respondentName=params.get('respondente')||values.respondentName;
  if(params.get('inicio'))values.dataInicio=params.get('inicio')||values.dataInicio;
  if(params.get('email'))values.emailColaborador=params.get('email')||values.emailColaborador;

  document.getElementById('app').innerHTML='<div class="form-shell"><div class="form-body"><div class="msg"><span class="loading-inline"><span class="spinner"></span>Carregando opções do formulário...</span></div></div></div>';
  fetch('/api/public/programa-integracao/opcoes-ativas',{headers:{Accept:'application/json'},cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject())
    .then(j=>{ACTIVE={colaboradores:j.colaboradores||[],gestores:j.gestores||[],anjos:j.anjos||[]};render();})
    .catch(()=>render());</script></body></html>`;
}

/**
 * Registra somente as páginas públicas dos formulários.
 * O painel administrativo `/programa-integracao` pertence à SPA React e precisa
 * alcançar o fallback do Vite/estático para usar a reconstrução completa atual.
 */
export function registerProgramaIntegracaoPages(app: Express) {
  app.get("/formularios/:slug", (req, res) => {
    const html = publicFormHtml(req.params.slug);
    if (!html) return res.status(404).send("Formulário não encontrado.");
    res.setHeader("Cache-Control", "no-store");
    res.type("html").send(html);
  });
}
