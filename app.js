/* ═══════════════════════════════════════════════════════
   AEP NR-17 v3 — app.js
   Dr. Prevent Saúde Ocupacional
   ═══════════════════════════════════════════════════════ */

/* ── AUTH GUARD ── */
const SESSION = AEPAuth.requireAuth();
if(SESSION){
  const el = document.getElementById('sidebarUser');
  if(el) el.querySelector('span').textContent = SESSION.nome || SESSION.user;
}

/* ── AEP GUARD — se não há AEP selecionada, volta para a lista ── */
const CURRENT_AEP_ID = AEPStore.getCurrentId();
if(!CURRENT_AEP_ID){
  window.location.href = 'aeps.html';
}
const CURRENT_AEP_META = AEPStore.getCurrentMeta();

// Mostra o nome da AEP atual no cabeçalho
document.addEventListener('DOMContentLoaded', () => {
  if(CURRENT_AEP_META){
    const el = document.getElementById('aepNameTopbar');
    if(el) el.textContent = '📁 ' + CURRENT_AEP_META.nome;
  }
});

/* ── PÁGINAS ── */
const PAGES = ['empresa','ges','cronograma','responsavel'];
const PAGE_TITLES = [
  'Identificação da empresa',
  'GES — Grupos de Exposição Similar',
  'Planejamento de Ações — 5W2H',
  'Responsável técnico e assinatura'
];
let currentPage = 0, currentGES = 0;
let gesData = [newGES(1)], acoes = [];
let assinatura = { nome:'', confirmada:false, dataHora:'' };

/* ── MATRIZ 5×5 AIHA (Mulhausen & Damiano) ── */
function matrizCor(nr){
  if(nr<=3)  return{label:'Trivial',     cor:'#1976D2',bg:'#D6E9F8'};
  if(nr<=8)  return{label:'Tolerável',   cor:'#388E3C',bg:'#D5E8D4'};
  if(nr<=12) return{label:'Moderado',    cor:'#7D4E00',bg:'#FFF2CC'};
  if(nr<=16) return{label:'Substancial', cor:'#E65100',bg:'#FFD8B0'};
  return            {label:'Intolerável',cor:'#C62828',bg:'#FFCDD2'};
}

/* ── RISCOS I5-2 (29 itens) ── */
const RISCOS=[
  {cat:'Aspectos Biomecânicos'},
  {id:'B01',desc:'Posturas incômodas ou estáticas por longos períodos',
   quando:'Flexão do tronco > 60° ou entre 20°–60° por mais de 5 min • Flexão cervical > 85° ou até 25° por mais de 9 min • Flexão/abdução do ombro ~ 80° por mais de 5 min sem alternância',
   embasamento:'ABNT NBR ISO 11226:2013',
   recomendacao:'17.4.3.1 As medidas de prevenção devem incluir duas ou mais alternativas: a) pausas para recuperação; b) alternância de atividades; c) alteração da execução; d) outras medidas técnicas.'},
  {id:'B02',desc:'Postura sentada ou em pé por longos períodos / constante deslocamento',
   quando:'> 2 horas contínuas sem alternância de postura',
   embasamento:'Nota Técnica 060/2001 – MTE | Censo Couto',
   recomendacao:'17.6.2 Sempre que o trabalho puder ser executado alternando posição de pé com sentada, o posto deve ser planejado para favorecer essa alternância. 17.6.7 Para atividades em pé, devem ser colocados assentos para descanso nas pausas.'},
  {id:'B03',desc:'Trabalho com esforço físico intenso',
   quando:'Escala de Borg ≥ 5 em > 10% do ciclo (risco relevante) • Borg ≥ 8 (esforço intenso)',
   embasamento:'Escala de Borg | Check List OCRA',
   recomendacao:'17.4.6 As dimensões dos espaços de trabalho devem ser suficientes para que o trabalhador movimente os segmentos corporais livremente, reduzindo esforço e posturas extremas.'},
  {id:'B04',desc:'Levantamento e transporte manual de cargas / pega pobre',
   quando:'> 30 kg homens 18–45 anos • > 20 kg mulheres ou extremos de idade • > 15 kg mulheres < 18 ou > 45 anos • Alcance horizontal > 60 cm • > 10.000 kg cumulativo/dia',
   embasamento:'Ferramenta LIFFT | NIOSH | NR-17 | ISO 11228-1',
   recomendacao:'17.5.4 Na movimentação manual não eventual: a) meios facilitadores; b) adequar peso/tamanho; c) limitar duração e frequência; d) reduzir distâncias; e) alternar atividades ou pausas a cada 2h. 17.5.5 Treinar trabalhadores.'},
  {id:'B05',desc:'Frequente ação de puxar / empurrar cargas',
   quando:'Carga > 1.000 kg • Piso escorregadio • Alta velocidade',
   embasamento:'Ferramenta KIM | ABNT NBR ISO 11228-2',
   recomendacao:'Aplicar ferramenta KIM; implementar EPC (carrinhos, trilhos, plataformas); avaliar piso e layout para reduzir forças necessárias.'},
  {id:'B06',desc:'Frequente execução de movimentos repetitivos (incluindo digitação)',
   quando:'> 70 ações técnicas/min por membro superior E > 2 horas/dia',
   embasamento:'OCRA/Colombini | ABNT NBR ISO 11228-3',
   recomendacao:'17.4.3.1 As medidas devem incluir: a) pausas para recuperação; b) alternância de atividades; c) alteração da execução; d) outras medidas técnicas.'},
  {id:'B07',desc:'Manuseio de ferramentas e/ou objetos pesados por períodos prolongados',
   quando:'> 1 kg em pinça • > 3 kg em preensão palmar • > 2 horas totais/dia',
   embasamento:'OCRA/Colombini | ABNT NBR ISO 11228-3',
   recomendacao:'17.4.3.1 As medidas devem incluir: a) pausas; b) alternância; c) alteração da execução; d) outras medidas técnicas.'},
  {id:'B08',desc:'Compressão de partes do corpo por superfícies rígidas ou com quinas',
   quando:'Presença de compressão > 2 horas/dia (totais)',
   embasamento:'NR-17 | NBR 13966 (raio mín. de borda: 2,5 mm)',
   recomendacao:'Anexo I, 3.1 i) Manter mobiliário sem quinas vivas ou rebarbas; elementos de fixação mantidos de forma a não causar acidentes.'},
  {id:'B09',desc:'Exigência de flexões frequentes de coluna vertebral',
   quando:'> 60° de flexão (risco alto) • 20°–60°: ≥ 15 flexões/min até 1h/dia ou ≥ 12 flexões/min entre 1h e 2h/dia',
   embasamento:'ABNT NBR ISO 11226 | ABNT NBR ISO 11228-1',
   recomendacao:'17.4.3.1 As medidas devem incluir: a) pausas; b) alternância; c) alteração da execução; d) outras medidas técnicas.'},
  {id:'B10',desc:'Uso frequente de pedais',
   quando:'Pedais muito pesados • Pedais que exijam postura ruim de MMII',
   embasamento:'NR-17 item 17.6.5 | Grandjean | ISO 11226',
   recomendacao:'17.6.5 Os pedais e demais comandos acionados pelos pés devem ter posicionamento e dimensões que possibilitem fácil alcance.'},
  {id:'B11',desc:'Elevação frequente de membros superiores (ombros)',
   quando:'Braço ~ 80° em flexão/abdução: > 10% do ciclo • Em 45°–80°: > 1/3 do ciclo ou > 10 ações/min por > 1h/dia',
   embasamento:'ABNT NBR ISO 11228-3',
   recomendacao:'17.4.3.1 As medidas devem incluir: a) pausas; b) alternância; c) alteração da execução; d) outras medidas técnicas.'},
  {id:'B12',desc:'Exposição a vibração de corpo inteiro (por tempo prolongado)',
   quando:'Aceleração > 0,5 m/s² ou VDVR > 9,1 m/s¹·⁷⁵',
   embasamento:'NR-17 | Anexo I – NR-09',
   recomendacao:'17.4.3 e) Evitar exposição a vibrações nos termos do Anexo I da NR-09.'},
  {id:'B13',desc:'Exposição a vibração localizada (por tempo prolongado)',
   quando:'Aceleração > 2,5 m/s²',
   embasamento:'NR-17 | Anexo I – NR-09 | NHO-10',
   recomendacao:'Aplicar NHO-10; adotar ferramentas anti-vibratórias; limitar exposição; PCMSO com atenção a DORT e Síndrome de Raynaud.'},
  {id:'B14',desc:'Torções de segmentos corporais',
   quando:'Punhos em desvios extremos quase todo o ciclo • > 70° flexão ou > 50° extensão ou > 20° desvios laterais',
   embasamento:'TOR TOM',
   recomendacao:'17.4.3.1 As medidas devem incluir: a) pausas; b) alternância; c) alteração da execução; d) outras medidas técnicas.'},
  {cat:'Aspectos de Mobiliário e Equipamentos'},
  {id:'M01',desc:'Posto de trabalho improvisado',
   quando:'Observação direta e relato dos trabalhadores indicando posto improvisado',
   embasamento:'NR-17',
   recomendacao:'17.4.5 A concepção dos postos deve considerar fatores organizacionais, ambientais e a natureza das tarefas. 17.6.1 Mobiliário com regulagens para adaptação antropométrica. 17.6.3 Planos que propiciem boa postura, visualização e operação.'},
  {id:'M02',desc:'Mobiliário e equipamentos inadequados ergonomicamente (sem regulagem / danificados)',
   quando:'Cadeira sem regulagens ou danificada • Mesa insuficiente • Monitor sem regulagem • Ausência de mouse/teclado independentes',
   embasamento:'ABNT NBR 13966:2008 | ABNT NBR 13962:2002 | NR-12 | NR-17 | CLT Art. 199',
   recomendacao:'17.6.1 O mobiliário deve apresentar regulagens em um ou mais elementos para adaptação às características antropométricas e à natureza do trabalho.'},
  {id:'M03',desc:'Posto de trabalho não planejado/adaptado para alternância de posturas',
   quando:'A natureza da tarefa permite alternância, mas não ocorre por falta de adaptação',
   embasamento:'NR-17 | ABNT NBR 13966:2008 | Nota Técnica 060/2001 MTE',
   recomendacao:'17.6.2 Sempre que o trabalho puder ser executado alternando posição de pé com sentada, o posto deve ser planejado para favorecer essa alternância.'},
  {id:'M04',desc:'Mobiliário ou equipamento sem espaço para movimentação dos segmentos corporais',
   quando:'Ausência de espaço suficiente para acomodar os membros',
   embasamento:'ABNT NBR 13966:2008 | NR-12',
   recomendacao:'17.6.3 d) Para sentado: espaço suficiente para pernas e pés. e) Para em pé: espaço suficiente para os pés, permitindo aproximação ao ponto de operação.'},
  {id:'M05',desc:'Alcances além das zonas ideais para a antropometria do trabalhador',
   quando:'Alcances frequentes > 66 cm do umbigo • Necessidade de ponta dos pés para alcançar',
   embasamento:'Grandjean e Iida: Alcances | NR-17',
   recomendacao:'17.6.3.1 A área de alcance máximo pode ser utilizada para ações que não prejudiquem a segurança e saúde, eventuais ou não, conforme AET.'},
  {id:'M06',desc:'Equipamentos ou mobiliários não adaptados à antropometria do trabalhador',
   quando:'Colaboradores que necessitem de adaptações individuais e não as possuem',
   embasamento:'NR-17',
   recomendacao:'17.6.1 O mobiliário deve apresentar regulagens que permitam adaptá-lo às características antropométricas que atendam ao conjunto dos trabalhadores.'},
  {cat:'Aspectos Organizacionais'},
  {id:'O01',desc:'Trabalho sem pausas pré-definidas / desequilíbrio entre trabalho e repouso',
   quando:'Ausência de pausas • Intrajornada: até 4h=0min; 4–6h=15min; > 6h=1h a 2h • Interjornada: mínimo 11h',
   embasamento:'NR-17 | CLT',
   recomendacao:'17.4.3.2 Pausas para descanso: a) sem aumento da cadência individual; b) usufruídas fora do posto. 17.4.3.3 Deve ser assegurada saída para necessidades fisiológicas.'},
  {id:'O02',desc:'Necessidade de manter ritmos intensos de trabalho',
   quando:'Ritmo intenso relatado pelos trabalhadores',
   embasamento:'Entrevista',
   recomendacao:'17.4.3.1 b) Alternância de atividades com variação de posturas, grupos musculares ou ritmo de trabalho.'},
  {id:'O03',desc:'Monotonia',
   quando:'Tempo de ciclo inferior a 15 segundos',
   embasamento:'Check List OCRA: estereotipia',
   recomendacao:'Implementar rodízio de funções; ampliar o conteúdo das tarefas; inserir pausas ativas; avaliar pela metodologia OCRA.'},
  {id:'O04',desc:'Trabalho noturno',
   quando:'Entre 22h e 5h (urbano) • Entre 21h e 5h (rural – lavoura) • Entre 20h e 4h (rural – pecuária)',
   embasamento:'Entrevista / CLT',
   recomendacao:'Não há item específico na NR-17 (N/C). Adotar medidas de higiene do sono, atenção ao PCMSO, interjornada mínima de 11h e iluminação noturna adequada.'},
  {id:'O05',desc:'Trabalho com metas rigorosas de produção ou remunerado por produção',
   quando:'Metas incompatíveis com capacidade humana • Remuneração por produção que comprometa a saúde',
   embasamento:'NR-17 | Entrevista / relatos',
   recomendacao:'17.4.4 Todo sistema de avaliação de desempenho, para efeito de remuneração e vantagens, deve levar em consideração as repercussões sobre a saúde dos trabalhadores.'},
  {id:'O06',desc:'Cadência do trabalho imposta por equipamento',
   quando:'Ritmo imposto por máquina com fluxo alto',
   embasamento:'NR-17 | Check List OCRA',
   recomendacao:'17.4.3.2 a) A introdução das pausas não pode ser acompanhada de aumento da cadência individual.'},
  {cat:'Aspectos Ambientais'},
  {id:'A01',desc:'Níveis de pressão sonora fora dos parâmetros de conforto',
   quando:'Colaboradores relatam desconforto acústico (muito barulho)',
   embasamento:'NR-17',
   recomendacao:'17.8.4.1 Adotar medidas de controle do ruído para conforto acústico. 17.8.4.1.2 Nível de ruído de fundo aceitável: até 65 dB(A) (Leq, ponderado em A, circuito Slow).'},
  {id:'A02',desc:'Temperatura, velocidade do ar e umidade fora dos parâmetros de conforto',
   quando:'Colaboradores relatam desconforto térmico: muito calor, frio, vento ou seco',
   embasamento:'NR-17',
   recomendacao:'17.8.4.2 Adotar medidas de controle de temperatura, velocidade do ar e umidade. Faixa: 18–25°C para ambientes climatizados. 17.8.4.2.1 Controlar ventilação para minimizar correntes de ar diretas.'},
  {id:'A03',desc:'Iluminação inadequada ou presença de reflexos em telas / painéis / vidros',
   quando:'Colaboradores relatam desconforto: pouca luz, excesso de luz, reflexos ou ofuscamento',
   embasamento:'NR-17 | NHO 11',
   recomendacao:'17.8.1 Iluminação adequada à natureza da atividade. 17.8.2 Evitar ofuscamento, reflexos, sombras e contrastes excessivos. 17.8.3 Conformidade com NHO 11 (Fundacentro, 2018).'},
];

/* ── STATUS (cores cheias) ── */
const STATUS_LIST = ['Pendente','Em Andamento','Concluído','Cancelado'];
function statusCor(s){
  switch(s){
    case 'Pendente':     return {bg:'#FFC107', fg:'#000', label:'PENDENTE'};
    case 'Em Andamento': return {bg:'#1976D2', fg:'#FFF', label:'EM ANDAMENTO'};
    case 'Concluído':    return {bg:'#388E3C', fg:'#FFF', label:'CONCLUÍDO'};
    case 'Cancelado':    return {bg:'#C62828', fg:'#FFF', label:'CANCELADO'};
    default:             return {bg:'#9E9E9E', fg:'#FFF', label:s.toUpperCase()};
  }
}

/* ── HELPERS ── */
function newGES(n){ return{codigo:`GES${String(n).padStart(2,'0')}`,setor:'',funcoes:'',numTrab:'',jornada:'',maquinas:[],tarefas:[{prescrita:'',real:''}],riscos:{},fotos:[],recomendacoes:'',observacoes:''}; }
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fv(id){ const e=document.getElementById(id); return e?e.value:''; }

/* ── CNPJ LOOKUP (Brasil API) ── */
let cnpjTimer=null, ultimoCnpj='';

function maskCNPJ(el){
  let v=el.value.replace(/\D/g,'');
  v=v.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2');
  el.value=v.slice(0,18);
  const digits=v.replace(/\D/g,'');
  setCnpjStatus('');
  autoSave();
  if(digits.length===14){ clearTimeout(cnpjTimer); cnpjTimer=setTimeout(lookupCnpj,700); }
}

function setCnpjStatus(html){ const el=document.getElementById('cnpjStatusIcon'); if(el)el.innerHTML=html; }

function showCnpjBanner(type,html){
  const b=document.getElementById('cnpjBanner'); if(!b)return;
  const cfg={
    ok:{bg:'#EAF3DE',bd:'#C0DD97',fg:'#3B6D11',icon:'ti-circle-check'},
    err:{bg:'#FFF0F0',bd:'#F5C6C6',fg:'#C0392B',icon:'ti-alert-circle'},
    loading:{bg:'#FFF8E8',bd:'#F4B942',fg:'#854F0B',icon:'ti-loader-2'},
    info:{bg:'#EBF3FB',bd:'#C8DDF5',fg:'#185FA5',icon:'ti-info-circle'}
  }[type];
  b.style.display='flex';
  b.style.background=cfg.bg;
  b.style.border=`1px solid ${cfg.bd}`;
  b.style.color=cfg.fg;
  b.innerHTML=`<i class="ti ${cfg.icon}${type==='loading'?' spin':''}" style="font-size:16px;flex-shrink:0;margin-top:2px"></i><div>${html}</div>`;
}

async function lookupCnpj(){
  const digits=fv('cnpj').replace(/\D/g,'');
  if(digits.length!==14||digits===ultimoCnpj)return;
  ultimoCnpj=digits;
  showCnpjBanner('loading','<strong>Consultando Receita Federal...</strong> <span style="font-size:10px;opacity:.8">Brasil API — aguarde</span>');
  setCnpjStatus('<i class="ti ti-loader-2 spin" style="color:#854F0B"></i>');
  try{
    const res=await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`,{headers:{'Accept':'application/json'}});
    if(!res.ok){ const e=await res.json().catch(()=>({})); throw new Error(e.message||'CNPJ não encontrado'); }
    const d=await res.json();
    preencherDadosEmpresa(d);
    const sit=(d.descricao_situacao_cadastral||'').toUpperCase();
    const sitOk=sit==='ATIVA';
    const dataAb=d.data_inicio_atividade?new Date(d.data_inicio_atividade+'T00:00:00').toLocaleDateString('pt-BR'):'—';
    showCnpjBanner('ok',`<div><strong>${d.razao_social}</strong> <span style="display:inline-block;padding:1px 7px;border-radius:20px;font-size:10px;font-weight:700;background:${sitOk?'#EAF3DE':'#FFF0F0'};color:${sitOk?'#3B6D11':'#C0392B'}">${sit}</span>
      <div style="font-size:10px;margin-top:3px;opacity:.8">CNPJ: ${fv('cnpj')} &nbsp;·&nbsp; Abertura: ${dataAb} &nbsp;·&nbsp; ${d.natureza_juridica||''}</div>
      <div style="font-size:10px;margin-top:2px;opacity:.8">Capital: ${d.capital_social?'R$ '+Number(d.capital_social).toLocaleString('pt-BR',{minimumFractionDigits:2}):'—'} &nbsp;·&nbsp; Porte: ${d.porte||'—'}</div>
      <div style="font-size:10px;margin-top:2px;opacity:.7">Campos preenchidos automaticamente — você pode editar livremente.</div></div>`);
    setCnpjStatus('<i class="ti ti-circle-check" style="color:#3B6D11"></i>');
    autoSave();
  }catch(e){
    setCnpjStatus('<i class="ti ti-alert-circle" style="color:#C0392B"></i>');
    ultimoCnpj='';
    if(!navigator.onLine) showCnpjBanner('info','<strong>Você está offline.</strong> A consulta de CNPJ requer internet. Preencha os dados manualmente.');
    else showCnpjBanner('err',`<strong>Erro na consulta:</strong> ${e.message}`);
  }
}

function preencherDadosEmpresa(d){
  const set=(id,val)=>{ const el=document.getElementById(id); if(el&&val){ el.value=val; el.style.background='#EAF3DE'; el.style.borderColor='#C0DD97'; }};
  set('razaoSocial', d.razao_social);
  set('nomeFantasia', d.nome_fantasia);
  const logr=[d.logradouro,d.numero,d.complemento,d.bairro].filter(Boolean).join(', ');
  set('endereco', logr);
  if(d.municipio&&d.uf) set('municipio',`${d.municipio} — ${d.uf}`);
  if(d.cep) set('cep', String(d.cep).replace(/(\d{5})(\d{3})/,'$1-$2'));
  const cnaeStr=d.cnae_fiscal_descricao?`${d.cnae_fiscal} — ${d.cnae_fiscal_descricao}`:String(d.cnae_fiscal||'');
  set('cnae', cnaeStr);
}

function toggleTurnos(){
  const v=fv('possuiTurnos');
  const w=document.getElementById('turnosWrap');
  if(w) w.style.display = v==='sim' ? 'block' : 'none';
}

/* ── PERSISTÊNCIA (via AEPStore — multi-AEP) ── */
function autoSave(){ clearTimeout(window._saveTimer); window._saveTimer=setTimeout(()=>{saveGES();persistAll();updateProgress();updateBadges();},700); }

function persistAll(){
  try{
    const payload={
      empresa:{razaoSocial:fv('razaoSocial'),nomeFantasia:fv('nomeFantasia'),cnpj:fv('cnpj'),endereco:fv('endereco'),municipio:fv('municipio'),cep:fv('cep'),cnae:fv('cnae'),grauRisco:fv('grauRisco'),totalTrab:fv('totalTrab'),dataAv:fv('dataAv'),demanda:fv('demanda'),
        horarioNormal:fv('horarioNormal'),cargaSemanal:fv('cargaSemanal'),possuiTurnos:fv('possuiTurnos'),
        turno1:fv('turno1'),turno2:fv('turno2'),turno3:fv('turno3'),turnosObs:fv('turnosObs')},
      responsavel:{respNome:fv('respNome'),respReg:fv('respReg'),respCargo:fv('respCargo'),respData:fv('respData'),respObs:fv('respObs'),sigInput:fv('sigInput')},
      gesData,acoes,assinatura,currentGES
    };
    AEPStore.saveData(CURRENT_AEP_ID, payload);
  }catch(e){}
}

function loadAll(){
  try{
    const p = AEPStore.getData(CURRENT_AEP_ID);
    if(!p) return;
    if(p.empresa) Object.entries(p.empresa).forEach(([k,v])=>{ const el=document.getElementById(k);if(el)el.value=v||''; });
    if(p.responsavel) Object.entries(p.responsavel).forEach(([k,v])=>{ const el=document.getElementById(k);if(el)el.value=v||''; });
    if(p.gesData&&p.gesData.length) gesData=p.gesData;
    if(p.acoes) acoes=p.acoes;
    if(p.assinatura) assinatura=p.assinatura;
    if(typeof p.currentGES==='number') currentGES=p.currentGES;
    toggleTurnos();
  }catch(e){}
}

/* ── SIDEBAR MOBILE ── */
function openSidebar(){ document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('show'); }
function closeSidebar(){ document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); }

/* ── NAVEGAÇÃO ── */
function showPage(page){
  if(currentPage===1) saveGES();
  PAGES.forEach(p=>{ const el=document.getElementById('page-'+p); if(el)el.style.display='none'; });
  document.querySelectorAll('.nav-item').forEach((n,i)=>n.classList.toggle('active',PAGES[i]===page));
  const idx=PAGES.indexOf(page);
  const el=document.getElementById('page-'+page);
  if(el){el.style.display='flex';el.style.flexDirection='column';}
  currentPage=idx;
  document.getElementById('pageTitle').textContent=PAGE_TITLES[idx];
  document.getElementById('btnAnterior').style.display=idx>0?'flex':'none';
  document.getElementById('btnProximo').style.display=idx<PAGES.length-1?'flex':'none';
  if(page==='ges'){renderGESTabs();renderGESContent();}
  if(page==='cronograma') renderCronograma();
  if(page==='responsavel') renderResponsavel();
  closeSidebar(); updateProgress(); updateBadges(); persistAll();
}
function navPage(dir){ showPage(PAGES[currentPage+dir]); }

function updateProgress(){
  const emp=fv('razaoSocial').trim(),resp=fv('respNome').trim();
  const gesOk=gesData.some(g=>g.setor||g.funcoes), cOk=acoes.some(a=>a.what);
  let d=0; if(emp)d++; if(gesOk)d++; if(resp||cOk)d++; if(assinatura.confirmada)d++;
  const f=document.getElementById('progFill'); if(f) f.style.width=(d/4*100)+'%';
  const l=document.getElementById('progLabel'); if(l) l.textContent=d+'/4';
}
function updateBadges(){
  const emp=fv('razaoSocial').trim(),resp=fv('respNome').trim();
  const gesOk=gesData.some(g=>g.setor||g.funcoes),cOk=acoes.some(a=>a.what);
  ['empresa','ges','cronograma','responsavel'].forEach((p,i)=>{
    const ok=[emp,gesOk,cOk,assinatura.confirmada][i];
    const b=document.getElementById('badge-'+p); if(b) b.className='nav-badge'+(ok?' done':'');
  });
}

/* ── GES ── */
function renderGESTabs(){
  let h=gesData.map((g,i)=>`<button class="ges-tab${i===currentGES?' active':''}" onclick="selectGES(${i})">${g.codigo}</button>`).join('');
  h+=`<button class="ges-tab add-tab" onclick="addGES()"><i class="ti ti-plus"></i> GES</button>`;
  if(gesData.length>1) h+=`<button class="ges-tab del-tab" onclick="removeGES()"><i class="ti ti-trash"></i></button>`;
  document.getElementById('gesTabs').innerHTML=h;
}
function addGES(){ saveGES();gesData.push(newGES(gesData.length+1));currentGES=gesData.length-1;renderGESTabs();renderGESContent(); }
function removeGES(){ if(gesData.length<=1)return;saveGES();gesData.splice(currentGES,1);if(currentGES>=gesData.length)currentGES=gesData.length-1;renderGESTabs();renderGESContent(); }
function selectGES(i){ saveGES();currentGES=i;renderGESTabs();renderGESContent(); }

function saveGES(){
  const g=gesData[currentGES]; if(!g) return;
  g.codigo=fv('gesCodigo')||g.codigo; g.setor=fv('gesSetor'); g.funcoes=fv('gesFuncoes');
  g.numTrab=fv('gesNumTrab'); g.jornada=fv('gesJornada'); g.recomendacoes=fv('gesRecom');
  g.observacoes=fv('gesObs');
  g.tarefas=[];
  document.querySelectorAll('.tar-presc').forEach((el,i)=>{ g.tarefas.push({prescrita:el.value,real:(document.querySelectorAll('.tar-real')[i]||{}).value||''}); });
  document.querySelectorAll('.foto-legenda').forEach((el,i)=>{ if(g.fotos[i]) g.fotos[i].legenda=el.value; });
  RISCOS.filter(r=>r.id).forEach(r=>{
    const pEl=document.getElementById('prob_'+r.id),sEl=document.getElementById('sev_'+r.id),mEl=document.getElementById('mot_'+r.id);
    if(pEl){ const p=parseInt(pEl.value)||1,s=parseInt(sEl?sEl.value:1)||1,nr=p*s,mc=matrizCor(nr);
      g.riscos[r.id]={prob:p,sev:s,nr,label:mc.label,cor:mc.cor,bg:mc.bg,motivo:mEl?mEl.value:'',embasamento:r.embasamento,recomendacao:r.recomendacao}; }
  });
}

let abert={};
function toggleRow(id){
  abert[id]=!abert[id];
  const tr=document.getElementById('det_'+id),ic=document.getElementById('chev_'+id),row=document.getElementById('row_'+id);
  if(tr) tr.style.display=abert[id]?'table-row':'none';
  if(ic) ic.className='chevron'+(abert[id]?' open':'');
  if(row) row.classList.toggle('aberto',!!abert[id]);
}

function renderGESContent(){
  const g=gesData[currentGES];
  const qtdAltos=RISCOS.filter(r=>r.id).filter(r=>{ const rv=g.riscos[r.id]; return rv&&(rv.prob||1)*(rv.sev||1)>=9; }).length;
  let tarefasHtml=g.tarefas.map((t,i)=>`<tr>
    <td>${i+1}</td>
    <td><input class="tar-presc" value="${esc(t.prescrita)}" placeholder="Tarefa conforme prescrição..." style="width:100%;font-size:10px;border:none;background:transparent;color:var(--text)"></td>
    <td><input class="tar-real" value="${esc(t.real)}" placeholder="Como realmente ocorre..." style="width:100%;font-size:10px;border:none;background:transparent;color:var(--text)"></td>
    <td><button onclick="removeTarefa(${i})" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:12px"><i class="ti ti-x"></i></button></td>
  </tr>`).join('');
  let maqTags=g.maquinas.length?g.maquinas.map((m,i)=>`<span class="maq-tag">${esc(m)}<button onclick="removeMaquina(${i})"><i class="ti ti-x" style="font-size:10px"></i></button></span>`).join(''):'<span style="font-size:11px;color:var(--text3)">Nenhuma máquina adicionada.</span>';
  let rRows='';
  RISCOS.forEach(r=>{
    if(r.cat){rRows+=`<tr class="cat-row"><td colspan="6">${r.cat}</td></tr>`;return;}
    const rv=g.riscos[r.id]||{prob:1,sev:1,motivo:''};
    const p=rv.prob||1,s=rv.sev||1,nr=p*s,mc=matrizCor(nr),hi=nr>=9;
    rRows+=`<tr class="risco-row${abert[r.id]?' aberto':''}" id="row_${r.id}" onclick="toggleRow('${r.id}')">
      <td style="text-align:center;color:var(--text3);font-size:9px;font-weight:700;white-space:nowrap">
        <i class="ti ti-chevron-right chevron${abert[r.id]?' open':''}" id="chev_${r.id}"></i> ${r.id}
      </td>
      <td style="font-size:10px${hi?';font-weight:700':''};max-width:200px">${r.desc}</td>
      <td style="text-align:center" onclick="event.stopPropagation()">
        <select id="prob_${r.id}" onchange="calcNR('${r.id}')" style="width:30px;font-size:9px;padding:1px;border:0.5px solid var(--border2);border-radius:3px;background:var(--surface);color:var(--text)">
          ${[1,2,3,4,5].map(n=>`<option${p===n?' selected':''}>${n}</option>`).join('')}
        </select>
      </td>
      <td style="text-align:center" onclick="event.stopPropagation()">
        <select id="sev_${r.id}" onchange="calcNR('${r.id}')" style="width:30px;font-size:9px;padding:1px;border:0.5px solid var(--border2);border-radius:3px;background:var(--surface);color:var(--text)">
          ${[1,2,3,4,5].map(n=>`<option${s===n?' selected':''}>${n}</option>`).join('')}
        </select>
      </td>
      <td style="text-align:center" id="nr_cell_${r.id}">
        <span class="nr-badge" style="background:${mc.bg};color:${mc.cor}">${nr} — ${mc.label}${hi?' ⚠':''}</span>
      </td>
      <td onclick="event.stopPropagation()">
        <input id="mot_${r.id}" value="${esc(rv.motivo)}" placeholder="Obs..." style="width:100%;font-size:9px;border:0.5px solid var(--border);border-radius:3px;padding:2px 4px;background:var(--surface2);color:var(--text)">
      </td>
    </tr>
    <tr id="det_${r.id}" style="display:${abert[r.id]?'table-row':'none'}">
      <td colspan="6" style="padding:0;border-top:none">
        <div class="detail-panel">
          <div class="detail-box"><div class="detail-box-title"><i class="ti ti-alert-triangle" style="color:#854F0B"></i> Risco quando:</div><div class="detail-box-body" style="color:#854F0B">${esc(r.quando).replace(/•/g,'<br>•')}</div></div>
          <div class="detail-box"><div class="detail-box-title"><i class="ti ti-book" style="color:var(--blue)"></i> Embasamento:</div><div class="detail-box-body" style="font-weight:700;color:var(--blue)">${esc(r.embasamento)}</div></div>
          <div class="detail-box" style="grid-column:span 2"><div class="detail-box-title"><i class="ti ti-clipboard-check" style="color:#3B6D11"></i> Recomendação NR-17:</div><div class="detail-box-body">${esc(r.recomendacao).replace(/(\d{2}\.\d+(\.\d+)*)/g,'<b>$1</b>')}</div></div>
        </div>
      </td>
    </tr>`;
  });
  let fotosCards=g.fotos.map((f,i)=>`<div class="foto-card"><img src="${f.src}" alt="${esc(f.legenda||'Foto '+(i+1))}"><button class="foto-del" onclick="removeFoto(${i})"><i class="ti ti-x" style="font-size:9px"></i></button><div class="foto-card-body"><label>Legenda (negrito no relatório)</label><input class="foto-legenda" value="${esc(f.legenda||'')}" placeholder="Ex.: Vista frontal do posto" oninput="gesData[${currentGES}].fotos[${i}].legenda=this.value;autoSave()" style="font-weight:600"></div></div>`).join('');

  document.getElementById('gesContent').innerHTML=`
    <div class="section"><div class="section-title">Identificação do GES</div>
      <div class="form-grid-3">
        <div class="field"><label>Código GES</label><input id="gesCodigo" value="${esc(g.codigo)}" oninput="autoSave()"></div>
        <div class="field"><label>Setor / área</label><input id="gesSetor" value="${esc(g.setor)}" placeholder="Produção, escritório..." oninput="autoSave()"></div>
        <div class="field"><label>Nº de trabalhadores</label><input id="gesNumTrab" type="number" value="${g.numTrab}" placeholder="0" oninput="autoSave()"></div>
        <div class="field" style="grid-column:span 2"><label>Funções / cargos</label><input id="gesFuncoes" value="${esc(g.funcoes)}" placeholder="Operador, auxiliar..." oninput="autoSave()"></div>
        <div class="field"><label>Jornada</label><input id="gesJornada" value="${esc(g.jornada)}" placeholder="8h/dia, 44h/sem." oninput="autoSave()"></div>
      </div>
    </div>
    <div class="section"><div class="section-title">Máquinas e equipamentos do setor</div>
      <div style="display:flex;gap:7px;margin-bottom:8px">
        <input id="maqInput" placeholder="Nome da máquina — Enter para adicionar" style="flex:1;font-size:11px;padding:6px 8px;border-radius:var(--radius);border:1px solid var(--border2);background:var(--surface);color:var(--text)" onkeydown="if(event.key==='Enter'){event.preventDefault();addMaquina();}">
        <button class="btn" onclick="addMaquina()" style="font-size:11px"><i class="ti ti-plus"></i> Adicionar</button>
      </div>
      <div id="maqTags">${maqTags}</div>
    </div>
    <div class="section"><div class="section-title">Atividades / tarefas</div>
      <div style="overflow-x:auto"><table class="risk-table" style="margin-bottom:7px"><tr><th style="width:24px">#</th><th>Tarefa prescrita</th><th>Tarefa real</th><th style="width:22px"></th></tr>${tarefasHtml}</table></div>
      <button class="btn" onclick="addTarefa()" style="font-size:10px"><i class="ti ti-plus"></i> Tarefa</button>
    </div>
    <div class="section">
      <div class="section-title">Registros fotográficos <span style="font-size:10px;color:var(--text3);font-weight:400;text-transform:none;letter-spacing:0">7 cm × 13 cm no relatório | legenda em negrito</span></div>
      <div class="foto-drop" onclick="document.getElementById('fi_${currentGES}').click()"><i class="ti ti-camera-plus"></i>Clique para inserir fotos<input type="file" id="fi_${currentGES}" accept="image/*" multiple style="display:none" onchange="addFotos(this)"></div>
      <div class="fotos-grid" id="fotosGrid">${fotosCards}</div>
    </div>
    <div class="section">
      <div class="section-title">Identificação de Riscos — I5-2 (29 itens) | Matriz 5×5 AIHA
        ${qtdAltos>0?`<span class="section-badge">${qtdAltos} risco${qtdAltos>1?'s':''} NR ≥ 9 → planejamento</span>`:''}
      </div>
      <div style="font-size:10px;color:var(--text3);margin-bottom:8px">Clique na linha para ver <b>Risco quando</b>, <b>Embasamento</b> e <b>Recomendação NR-17</b>. &nbsp;<b>P</b>×<b>S</b> = NR.</div>
      <div style="overflow-x:auto"><table class="risk-table"><tr><th style="width:68px">Cód.</th><th>Fator de risco</th><th style="width:30px">P</th><th style="width:30px">S</th><th style="width:118px">NR</th><th>Observação</th></tr>${rRows}</table></div>
    </div>
    <div class="section"><div class="section-title">Recomendações gerais do GES</div>
      <div class="field"><textarea id="gesRecom" placeholder="Medidas recomendadas para este GES..." style="min-height:60px" oninput="autoSave()">${esc(g.recomendacoes)}</textarea></div>
    </div>
    <div class="section"><div class="section-title">Observações do GES</div>
      <div class="field"><textarea id="gesObs" placeholder="Observações gerais sobre o GES, condições especiais, particularidades..." style="min-height:80px" oninput="autoSave()">${esc(g.observacoes||'')}</textarea></div>
    </div>`;
}

function calcNR(id){
  const p=parseInt(document.getElementById('prob_'+id)?.value)||1,s=parseInt(document.getElementById('sev_'+id)?.value)||1;
  const nr=p*s,mc=matrizCor(nr);
  const cell=document.getElementById('nr_cell_'+id);
  if(cell) cell.innerHTML=`<span class="nr-badge" style="background:${mc.bg};color:${mc.cor}">${nr} — ${mc.label}${nr>=9?' ⚠':''}</span>`;
  autoSave();
}

function addMaquina(){ const inp=document.getElementById('maqInput'),val=(inp?.value||'').trim();if(!val)return;gesData[currentGES].maquinas.push(val);inp.value='';renderMaqTags();inp.focus();autoSave(); }
function removeMaquina(i){ gesData[currentGES].maquinas.splice(i,1);renderMaqTags();autoSave(); }
function renderMaqTags(){ const g=gesData[currentGES],el=document.getElementById('maqTags');if(!el)return;el.innerHTML=g.maquinas.length?g.maquinas.map((m,i)=>`<span class="maq-tag">${esc(m)}<button onclick="removeMaquina(${i})"><i class="ti ti-x" style="font-size:10px"></i></button></span>`).join(''):'<span style="font-size:11px;color:var(--text3)">Nenhuma máquina adicionada.</span>'; }
function addFotos(input){ const g=gesData[currentGES];Array.from(input.files).forEach(f=>{const r=new FileReader();r.onload=e=>{g.fotos.push({src:e.target.result,name:f.name,legenda:''});renderFotosGrid();autoSave();};r.readAsDataURL(f);});input.value=''; }
function removeFoto(i){ gesData[currentGES].fotos.splice(i,1);renderFotosGrid();autoSave(); }
function renderFotosGrid(){ const g=gesData[currentGES],el=document.getElementById('fotosGrid');if(!el)return;el.innerHTML=g.fotos.map((f,i)=>`<div class="foto-card"><img src="${f.src}" alt="${esc(f.legenda||'Foto '+(i+1))}"><button class="foto-del" onclick="removeFoto(${i})"><i class="ti ti-x" style="font-size:9px"></i></button><div class="foto-card-body"><label>Legenda (negrito no relatório)</label><input class="foto-legenda" value="${esc(f.legenda||'')}" placeholder="Ex.: Vista frontal" oninput="gesData[${currentGES}].fotos[${i}].legenda=this.value;autoSave()" style="font-weight:600"></div></div>`).join(''); }
function addTarefa(){ saveGES();gesData[currentGES].tarefas.push({prescrita:'',real:''});renderGESContent(); }
function removeTarefa(i){ saveGES();gesData[currentGES].tarefas.splice(i,1);if(!gesData[currentGES].tarefas.length)gesData[currentGES].tarefas=[{prescrita:'',real:''}];renderGESContent(); }

/* ── PLANEJAMENTO 5W2H (em português) ── */
function getRiscosAltos(){ saveGES();const lista=[];gesData.forEach(g=>{RISCOS.filter(r=>r.id).forEach(r=>{const rv=g.riscos[r.id];if(!rv)return;const nr=rv.nr||((rv.prob||1)*(rv.sev||1));const mc=matrizCor(nr);if(nr>=9)lista.push({gesCode:g.codigo,riscoId:r.id,riscoDesc:r.desc,nr,label:mc.label,cor:mc.cor,bg:mc.bg,embasamento:r.embasamento,recomendacao:r.recomendacao});});});return lista; }

function renderCronograma(){
  const riscos=getRiscosAltos();
  if(!riscos.length){document.getElementById('cronoContent').innerHTML=`<div class="empty-state"><i class="ti ti-clipboard-check"></i><p><strong>Nenhum risco com NR ≥ 9 identificado.</strong><br>Avalie os riscos no GES para que apareçam aqui automaticamente.</p></div>`;return;}
  riscos.forEach(r=>{const key=r.riscoId+'_'+r.gesCode;if(!acoes.find(a=>a.id===key))acoes.push({id:key,riscoId:r.riscoId,gesCode:r.gesCode,desc:r.riscoDesc,nr:r.nr,label:r.label,cor:r.cor,bg:r.bg,embasamento:r.embasamento,recomendacao:r.recomendacao,what:'',why:'',where:'',who:'',when:'',howMuch:'',how:'',status:'Pendente'});});
  const total=acoes.length,conc=acoes.filter(a=>a.status==='Concluído').length,emAnd=acoes.filter(a=>a.status==='Em Andamento').length,canc=acoes.filter(a=>a.status==='Cancelado').length;

  let cards=acoes.map((a,idx)=>{
    const sc=statusCor(a.status);
    return `<div class="ac-card">
    <div class="ac-header">
      <div style="flex:1;min-width:0">
        <div style="font-size:9px;color:var(--text3);font-weight:700;text-transform:uppercase">${a.gesCode} / ${a.riscoId}</div>
        <div style="font-size:12px;font-weight:700;margin-top:2px">${a.desc}</div>
        <div style="font-size:9px;color:var(--blue);margin-top:2px"><i class="ti ti-book"></i> ${esc(a.embasamento)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        <span class="nr-badge" style="background:${a.bg};color:${a.cor}">NR ${a.nr} — ${a.label}</span>
        <span style="background:${sc.bg};color:${sc.fg};padding:3px 10px;border-radius:4px;font-size:10px;font-weight:800;letter-spacing:.4px">${sc.label}</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:6px 10px;background:var(--surface2);border-radius:var(--radius)">
      <span style="font-size:10px;color:var(--text2);font-weight:700">Status:</span>
      ${STATUS_LIST.map(s=>{const sc2=statusCor(s);const active=a.status===s;return `<button onclick="acoes[${idx}].status='${s}';renderCronograma();autoSave()" style="padding:3px 9px;border-radius:4px;border:${active?'2px solid '+sc2.bg:'1px solid var(--border2)'};background:${active?sc2.bg:'var(--surface)'};color:${active?sc2.fg:'var(--text2)'};font-size:9px;font-weight:700;cursor:pointer;font-family:var(--font);letter-spacing:.3px">${sc2.label}</button>`;}).join('')}
    </div>
    <div style="background:#EBF3FB;border:0.5px solid #C8DDF5;border-radius:var(--radius);padding:8px 10px;margin-bottom:9px;font-size:9px;color:var(--blue);line-height:1.6"><strong>Recomendação NR-17:</strong> ${esc(a.recomendacao).slice(0,200)}${a.recomendacao.length>200?'…':''}</div>
    <div class="ac-form-2">
      <div class="field"><label><b>O QUÊ</b> — qual ação será executada?</label><input value="${esc(a.what)}" onchange="acoes[${idx}].what=this.value;autoSave()" placeholder="Descreva a ação de controle..."></div>
      <div class="field"><label><b>POR QUÊ</b> — qual a justificativa?</label><input value="${esc(a.why)}" onchange="acoes[${idx}].why=this.value;autoSave()" placeholder="Motivo / fundamentação..."></div>
      <div class="field"><label><b>ONDE</b> — em qual local/setor?</label><input value="${esc(a.where)}" onchange="acoes[${idx}].where=this.value;autoSave()" placeholder="Setor / posto / departamento..."></div>
      <div class="field"><label><b>QUANDO</b> — qual o prazo?</label><input value="${esc(a.when)}" onchange="acoes[${idx}].when=this.value;autoSave()" placeholder="Data limite / cronograma..."></div>
      <div class="field"><label><b>QUEM</b> — quem é o responsável?</label><input value="${esc(a.who)}" onchange="acoes[${idx}].who=this.value;autoSave()" placeholder="Pessoa ou equipe..."></div>
      <div class="field"><label><b>COMO</b> — quais os métodos/etapas?</label><input value="${esc(a.how)}" onchange="acoes[${idx}].how=this.value;autoSave()" placeholder="Procedimento de execução..."></div>
    </div>
    <div style="margin-top:7px">
      <div class="field"><label><b>QUANTO CUSTA</b> — orçamento / custo financeiro</label><input value="${esc(a.howMuch)}" onchange="acoes[${idx}].howMuch=this.value;autoSave()" placeholder="R$ ... / Sem custo / A definir"></div>
    </div>
  </div>`;}).join('');

  document.getElementById('cronoContent').innerHTML=`
    <div class="section"><div class="section-title">Resumo do planejamento</div>
      <div class="summary-grid">${[
        ['Total de ações',total,'var(--text)'],
        ['Pendentes',total-conc-emAnd-canc,'#854F0B'],
        ['Em andamento',emAnd,'var(--blue)'],
        ['Concluídas',conc,'#3B6D11']
      ].map(([l,v,c])=>`<div class="summary-card"><div class="sc-label">${l}</div><div class="sc-value" style="color:${c}">${v}</div></div>`).join('')}</div>
    </div>
    <div class="section"><div class="section-title">Planejamento de Ações 5W2H — ${total} risco${total!==1?'s':''} com NR ≥ 9</div>${cards}</div>`;
  updateBadges();
}

/* ── RESPONSÁVEL & ASSINATURA ── */
function renderResponsavel(){
  if(assinatura.confirmada){
    const el=document.getElementById('sigConfirmado');
    if(el){ el.style.display='flex'; document.getElementById('sigConfirmadoTxt').textContent=`Assinatura confirmada — ${assinatura.nome} — ${assinatura.dataHora}`; }
    const inp=document.getElementById('sigInput'); if(inp) inp.value=assinatura.nome;
    updateSigPreview();
  }
}

function updateSigPreview(){
  const nome = fv('sigInput') || fv('respNome');
  const disp = document.getElementById('sigDisplay');
  const wrap = document.getElementById('sigPreviewWrap');
  const pname = document.getElementById('sigPreviewName');
  const pline = document.getElementById('sigPreviewLine');
  const dateEl = document.getElementById('sigDate');
  if(disp) disp.textContent = nome;
  if(nome && wrap){ wrap.style.display='inline-block'; if(pname) pname.textContent=nome; }
  else if(wrap) wrap.style.display='none';
  const d=new Date(); const dtStr=d.toLocaleDateString('pt-BR')+' às '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  if(dateEl) dateEl.textContent = nome ? dtStr : '';
  const reg=fv('respReg'), cargo=fv('respCargo');
  if(pline) pline.textContent=[fv('respNome')||nome, reg, cargo].filter(Boolean).join(' — ');
  autoSave();
}

function confirmarAssinatura(){
  const nome=fv('sigInput')||fv('respNome');
  if(!nome.trim()){ showToast('Digite o nome para assinar.','err'); return; }
  const d=new Date();
  const dtStr=d.toLocaleDateString('pt-BR')+' às '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  assinatura={nome,confirmada:true,dataHora:dtStr,usuario:SESSION.user};
  const el=document.getElementById('sigConfirmado');
  if(el){ el.style.display='flex'; document.getElementById('sigConfirmadoTxt').textContent=`Assinatura confirmada — ${nome} — ${dtStr}`; }
  showToast('✓ Assinatura registrada com sucesso!','ok');
  updateBadges(); persistAll();
}

function limparAssinatura(){
  assinatura={nome:'',confirmada:false,dataHora:''};
  const inp=document.getElementById('sigInput'); if(inp) inp.value='';
  const disp=document.getElementById('sigDisplay'); if(disp) disp.textContent='';
  const wrap=document.getElementById('sigPreviewWrap'); if(wrap) wrap.style.display='none';
  const el=document.getElementById('sigConfirmado'); if(el) el.style.display='none';
  updateBadges(); persistAll();
}

/* ── TOAST ── */
function showToast(msg,type=''){
  const t=document.createElement('div');
  t.className='toast'+(type?' '+type:'');
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3200);
}

/* ── DEMO ── */
function preencherDemo(){
  const vals={razaoSocial:'Indústria Têxtil São João S/A',nomeFantasia:'Têxtil São João',cnpj:'12.345.678/0001-90',endereco:'Av. Industrial, 1500 — Distrito Industrial',municipio:'São João da Boa Vista — SP',cep:'13870-000',cnae:'13.11-1/00 — Preparação e fiação de fibras de algodão',totalTrab:'248',dataAv:new Date().toISOString().slice(0,10),
    horarioNormal:'08h00 às 17h48 com 1h de almoço',cargaSemanal:'44h/semana',possuiTurnos:'sim',turno1:'06h às 14h',turno2:'14h às 22h',turno3:'22h às 06h',turnosObs:'Revezamento semanal, escala 5x2 com folga aos domingos',
    demanda:'TAC nº 136.2026 firmado com o MTE, cumprimento à NR-17 item 17.3.1.'};
  Object.entries(vals).forEach(([k,v])=>{const el=document.getElementById(k);if(el)el.value=v;});
  const gr=document.getElementById('grauRisco');if(gr)[...gr.options].forEach(o=>{if(o.text==='Grau 3')o.selected=true;});
  toggleTurnos();
  gesData=[{codigo:'GES01',setor:'Costura / Produção',funcoes:'Costureira, Auxiliar de costura',numTrab:'86',jornada:'8h/dia — 44h/sem.',maquinas:['Máquina de costura reta Juki DDL-8700','Overloque Brother MA4-B551'],tarefas:[{prescrita:'Costurar peças conforme especificação',real:'Costura contínua em posição sentada com ritmo ditado por meta, pausas insuficientes'}],riscos:{B01:{prob:4,sev:3,motivo:'Punhos em desvio ulnar',nr:12,label:'Moderado',cor:'#7D4E00',bg:'#FFF2CC',embasamento:'ABNT NBR ISO 11226:2013',recomendacao:'17.4.3.1 a) pausas; b) alternância; c) alteração da execução.'},B06:{prob:5,sev:4,motivo:'Ciclo < 30s — repetitivo',nr:20,label:'Intolerável',cor:'#C62828',bg:'#FFCDD2',embasamento:'OCRA/Colombini | ABNT NBR ISO 11228-3',recomendacao:'17.4.3.1 a) pausas; b) alternância; c) alteração da execução.'},O01:{prob:3,sev:3,motivo:'1 pausa de 15min no turno inteiro',nr:9,label:'Moderado',cor:'#7D4E00',bg:'#FFF2CC',embasamento:'NR-17 | CLT',recomendacao:'17.4.3.2 a) pausas sem aumento de cadência.'}},fotos:[],recomendacoes:'Ginástica laboral diária, cadeiras com regulagem, revisar metas.',observacoes:'Setor com 86 colaboradoras, trabalho realizado em pé e sentado alternadamente.'}];
  currentGES=0;acoes=[];assinatura={nome:'',confirmada:false,dataHora:''};
  const rv={respNome:SESSION.nome||SESSION.user,respReg:'CREA-SP 12345/D',respCargo:'Engenheiro de Segurança do Trabalho',respData:new Date().toISOString().slice(0,10),respObs:'Visita realizada nas dependências da empresa durante o turno da manhã.',sigInput:SESSION.nome||SESSION.user};
  Object.entries(rv).forEach(([k,v])=>{const el=document.getElementById(k);if(el)el.value=v;});
  if(currentPage===1){renderGESTabs();renderGESContent();}
  if(currentPage===2) renderCronograma();
  if(currentPage===3) renderResponsavel();
  persistAll();updateProgress();updateBadges();
  showToast('✓ Dados de teste carregados!','ok');
}

/* ═══════════════════════════════════════════════
   GERAR WORD COM CAPA, SUMÁRIO E LOGO
   ═══════════════════════════════════════════════ */
function gerarDoc(){
  saveGES();
  const empresa=fv('razaoSocial');
  if(!empresa.trim()){ showToast('Preencha a Razão Social antes de gerar.','err'); return; }

  const dataAv=fv('dataAv'), dataFmt=dataAv?dataAv.split('-').reverse().join('/'):'—';

  /* ───── CABEÇALHO SIMPLES (sem logo) ───── */
  const headerLogo = `
    <div style="border-bottom:2px solid #1F3864;padding-bottom:6px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-end">
      <div style="color:#1F3864;font-weight:800;font-size:11pt">AVALIAÇÃO ERGONÔMICA PRELIMINAR — NR-17</div>
      <div style="font-size:9pt;color:#666">${empresa} &nbsp;·&nbsp; ${dataFmt}</div>
    </div>`;

  const capaHtml = '';

  /* ───── SUMÁRIO (primeira página) ───── */
  const sumarioItens = [
    {n:'1',  titulo:'Identificação da empresa'},
    {n:'2',  titulo:'Referência metodológica — Matriz 5×5 AIHA'},
    {n:'3',  titulo:'Grupos de Exposição Similar — GES'},
    ...gesData.map((g,i)=>({n:`3.${i+1}`, titulo:`${g.codigo} — ${g.setor||'Setor não informado'}`, sub:true})),
  ];
  if(acoes.length) sumarioItens.push({n:'4', titulo:'Cronograma de ações — 5W2H'});
  sumarioItens.push({n: acoes.length?'5':'4', titulo:'Responsável técnico e assinatura'});

  const sumarioHtml = `
    <div style="padding:24px 30px;page-break-after:always">
      ${headerLogo}
      <h1 style="color:#1F3864;font-size:18pt;border-bottom:3px solid #1F3864;padding-bottom:6px;margin:8px 0 16px;letter-spacing:1px">SUMÁRIO</h1>
      <table style="width:100%;border-collapse:collapse;font-size:11pt">
        ${sumarioItens.map(item=>`
          <tr>
            <td style="padding:7px 0;width:60px;color:#1F3864;font-weight:700;${item.sub?'padding-left:30px;font-weight:500;color:#185FA5;font-size:10pt':''}">${item.n}</td>
            <td style="padding:7px 0;border-bottom:1px dotted #C8D0DC;${item.sub?'font-weight:500;color:#444;font-size:10pt':'font-weight:700;color:#1F3864'}">${item.titulo}</td>
          </tr>
        `).join('')}
      </table>
    </div>`;

  /* ───── SEÇÃO 1: IDENTIFICAÇÃO DA EMPRESA ───── */
  const possuiTurnos = fv('possuiTurnos')==='sim';
  const turnosHtml = possuiTurnos ? `
    <div style="margin-top:12px;padding:12px 14px;background:#F8F9FA;border-left:4px solid #185FA5;border-radius:0 6px 6px 0">
      <div style="font-weight:700;color:#185FA5;margin-bottom:6px;font-size:11pt">Regime de Turnos</div>
      <table style="width:100%;font-size:10pt;border-collapse:collapse">
        ${fv('turno1')?`<tr><td style="padding:3px 0;width:140px;color:#555">1º turno (manhã):</td><td><b>${fv('turno1')}</b></td></tr>`:''}
        ${fv('turno2')?`<tr><td style="padding:3px 0;color:#555">2º turno (tarde):</td><td><b>${fv('turno2')}</b></td></tr>`:''}
        ${fv('turno3')?`<tr><td style="padding:3px 0;color:#555">3º turno (noite):</td><td><b>${fv('turno3')}</b></td></tr>`:''}
        ${fv('turnosObs')?`<tr><td style="padding:3px 0;color:#555;vertical-align:top">Observações:</td><td>${fv('turnosObs')}</td></tr>`:''}
      </table>
    </div>` : '';

  const secao1 = `
    <div style="padding:14px 22px">
      ${headerLogo}
      <h2 style="color:#1F3864;font-size:14pt;margin:6px 0 8px">1. Identificação da empresa</h2>
      <table style="width:100%;border-collapse:collapse;font-size:11pt">
        <tr><td style="padding:5px 0;color:#555;width:170px;font-weight:600">Razão social:</td><td><b>${empresa}</b></td></tr>
        ${fv('nomeFantasia')?`<tr><td style="padding:5px 0;color:#555;font-weight:600">Nome fantasia:</td><td>${fv('nomeFantasia')}</td></tr>`:''}
        <tr><td style="padding:5px 0;color:#555;font-weight:600">CNPJ:</td><td>${fv('cnpj')||'—'}</td></tr>
        <tr><td style="padding:5px 0;color:#555;font-weight:600">Endereço:</td><td>${fv('endereco')||'—'}</td></tr>
        <tr><td style="padding:5px 0;color:#555;font-weight:600">Município / UF:</td><td>${fv('municipio')||'—'}</td></tr>
        ${fv('cep')?`<tr><td style="padding:5px 0;color:#555;font-weight:600">CEP:</td><td>${fv('cep')}</td></tr>`:''}
        <tr><td style="padding:5px 0;color:#555;font-weight:600">CNAE:</td><td>${fv('cnae')||'—'}</td></tr>
        <tr><td style="padding:5px 0;color:#555;font-weight:600">Grau de risco:</td><td>${fv('grauRisco')||'—'}</td></tr>
        <tr><td style="padding:5px 0;color:#555;font-weight:600">Total de trabalhadores:</td><td>${fv('totalTrab')||'—'}</td></tr>
        <tr><td style="padding:5px 0;color:#555;font-weight:600">Data da avaliação:</td><td><b>${dataFmt}</b></td></tr>
      </table>

      <div style="margin-top:18px;padding:12px 14px;background:#F8F9FA;border-left:4px solid #185FA5;border-radius:0 6px 6px 0">
        <div style="font-weight:700;color:#185FA5;margin-bottom:6px;font-size:11pt">Horários de Trabalho</div>
        <table style="width:100%;font-size:10pt;border-collapse:collapse">
          <tr><td style="padding:3px 0;width:200px;color:#555">Horário administrativo/normal:</td><td><b>${fv('horarioNormal')||'—'}</b></td></tr>
          <tr><td style="padding:3px 0;color:#555">Carga horária semanal:</td><td><b>${fv('cargaSemanal')||'—'}</b></td></tr>
          <tr><td style="padding:3px 0;color:#555">Possui regime de turnos?</td><td><b>${possuiTurnos?'Sim':'Não'}</b></td></tr>
        </table>
      </div>
      ${turnosHtml}

      ${fv('demanda')?`<div style="margin-top:18px;padding:12px 14px;background:#F8F9FA;border-left:4px solid #1F3864;border-radius:0 6px 6px 0"><div style="font-weight:700;color:#1F3864;margin-bottom:6px;font-size:11pt">Demanda / Justificativa</div><p style="font-size:10pt;margin:0;line-height:1.6">${fv('demanda')}</p></div>`:''}
    </div>`;

  /* ───── SEÇÃO 2: REFERÊNCIA METODOLÓGICA (com matriz 5x5 desenhada) ───── */
  // Matriz 5x5 com cores: linhas = Probabilidade (de 5 a 1, de cima p/ baixo), colunas = Severidade (1 a 5)
  // Padrão AIHA segundo a imagem:
  // P5 (Muito Provável):  Trivial Tolerável Moderado Substancial Intolerável (3,5,9,13,17 aprox)
  // P4 (Provável):        Trivial Tolerável Moderado Substancial Intolerável
  // P3 (Possível):        Trivial Tolerável Tolerável Moderado Substancial
  // P2 (Pouco Provável):  Trivial Trivial Tolerável Moderado Substancial
  // P1 (Rara):            Trivial Trivial Tolerável Tolerável Moderado
  // mas o jeito mais simples: usar P×S e aplicar o matrizCor()

  let matrizCels = '';
  for(let p=5;p>=1;p--){
    matrizCels += '<tr>';
    // Coluna de cabeçalho (Probabilidade)
    const probLabels=['','Rara','Pouco Provável','Possível','Provável','Muito Provável'];
    if(p===5) matrizCels += `<td rowspan="5" style="background:#1F3864;color:#fff;font-weight:bold;text-align:center;padding:8px;font-size:9pt;vertical-align:middle;border:1px solid #1F3864">PROBABILIDADE</td>`;
    matrizCels += `<td style="background:#185FA5;color:#fff;font-weight:bold;text-align:center;padding:6px 8px;font-size:9pt;border:1px solid #1F3864">${probLabels[p]}<br><span style="font-size:11pt">${p}</span></td>`;
    for(let s=1;s<=5;s++){
      const nr=p*s, mc=matrizCor(nr);
      matrizCels += `<td style="background:${mc.bg};color:${mc.cor};text-align:center;padding:14px 8px;font-size:8pt;font-weight:700;border:1px solid #fff">${mc.label}<br>${nr}</td>`;
    }
    matrizCels += '</tr>';
  }
  const sevHeader = '<tr><td style="background:#1F3864;color:#fff;font-weight:bold;text-align:center;padding:8px;border:1px solid #1F3864" colspan="2">MATRIZ 5×5<br>AIHA</td>' +
    ['Leve','Baixo','Moderado','Alto','Extremo'].map((s,i)=>
      `<td style="background:#185FA5;color:#fff;font-weight:bold;text-align:center;padding:6px 8px;font-size:9pt;border:1px solid #1F3864">${s}<br><span style="font-size:11pt">${i+1}</span></td>`
    ).join('') + '</tr>';
  const sevHeader2 = '<tr><td colspan="2" style="background:#1F3864;color:#fff;font-weight:bold;text-align:center;padding:6px;font-size:9pt;border:1px solid #1F3864">SEVERIDADE →</td><td colspan="5" style="background:#185FA5;color:#fff;font-weight:bold;text-align:center;padding:6px;font-size:9pt;border:1px solid #1F3864">SEVERIDADE</td></tr>';

  const secao2 = `
    <div style="padding:14px 22px">
      ${headerLogo}
      <h2 style="color:#1F3864;font-size:14pt;margin:6px 0 8px">2. Referência metodológica — Matriz 5×5 AIHA</h2>

      <p style="font-size:10pt;line-height:1.7;text-align:justify;margin-bottom:14px">
        A presente avaliação ergonômica preliminar foi conduzida com base no <b>checklist I5-2</b> (Roteiro de Identificação de Riscos Ergonômicos),
        composto por 29 itens distribuídos em 4 categorias: Aspectos Biomecânicos, Mobiliário e Equipamentos, Organizacionais e Ambientais.
      </p>
      <p style="font-size:10pt;line-height:1.7;text-align:justify;margin-bottom:14px">
        Para a classificação dos riscos identificados, adotou-se a <b>Matriz de Risco 5×5 metodologia AIHA</b>
        (Mulhausen &amp; Damiano), complementada pelo Apêndice D da <b>BS 8800 (BSI, 1996)</b>, adaptadas conforme a <b>NR-01</b>.
        O Nível de Risco (NR) é obtido pelo produto entre a Probabilidade (P) e a Severidade (S): <b>NR = P × S</b>.
      </p>

      <h3 style="color:#185FA5;font-size:13pt;margin-top:24px;margin-bottom:10px">2.1 Matriz de Riscos 5×5</h3>
      <table style="width:100%;border-collapse:collapse;margin-top:10px">
        ${sevHeader2}
        ${sevHeader}
        ${matrizCels}
      </table>

      <h3 style="color:#185FA5;font-size:13pt;margin-top:30px;margin-bottom:10px">2.2 Probabilidade (P)</h3>
      <p style="font-size:10pt;line-height:1.6;margin-bottom:10px">A probabilidade representa a chance de o problema ocorrer ou estar presente no ambiente de trabalho.</p>
      <table style="width:100%;border-collapse:collapse;font-size:10pt">
        <tr style="background:#1F3864;color:#fff">
          <th style="padding:8px;border:1px solid #1F3864;text-align:left">%</th>
          <th style="padding:8px;border:1px solid #1F3864;text-align:left">Interpretação</th>
          <th style="padding:8px;border:1px solid #1F3864;text-align:center">Probabilidade</th>
        </tr>
        <tr style="background:#EAF8EA"><td style="padding:6px 10px;border:1px solid #ddd">90 – 100%</td><td style="padding:6px 10px;border:1px solid #ddd">Ambiente muito saudável</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:700">1</td></tr>
        <tr style="background:#F1F8E9"><td style="padding:6px 10px;border:1px solid #ddd">75 – 89%</td><td style="padding:6px 10px;border:1px solid #ddd">Boa condição</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:700">2</td></tr>
        <tr style="background:#FFFDE7"><td style="padding:6px 10px;border:1px solid #ddd">60 – 74%</td><td style="padding:6px 10px;border:1px solid #ddd">Atenção</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:700">3</td></tr>
        <tr style="background:#FFF3E0"><td style="padding:6px 10px;border:1px solid #ddd">40 – 59%</td><td style="padding:6px 10px;border:1px solid #ddd">Problema frequente</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:700">4</td></tr>
        <tr style="background:#FFEBEE"><td style="padding:6px 10px;border:1px solid #ddd">&lt; 40%</td><td style="padding:6px 10px;border:1px solid #ddd">Problema crítico</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:700">5</td></tr>
      </table>

      <h3 style="color:#185FA5;font-size:13pt;margin-top:30px;margin-bottom:10px">2.3 Severidade (S)</h3>
      <p style="font-size:10pt;line-height:1.6;margin-bottom:10px">A severidade representa o impacto do risco na saúde do trabalhador caso ele ocorra.</p>
      <table style="width:100%;border-collapse:collapse;font-size:10pt">
        <tr style="background:#1F3864;color:#fff">
          <th style="padding:8px;border:1px solid #1F3864;text-align:center;width:120px">Severidade</th>
          <th style="padding:8px;border:1px solid #1F3864;text-align:left">Impacto</th>
        </tr>
        <tr style="background:#EAF8EA"><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:700">1</td><td style="padding:6px 10px;border:1px solid #ddd">Desconforto leve</td></tr>
        <tr style="background:#F1F8E9"><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:700">2</td><td style="padding:6px 10px;border:1px solid #ddd">Fadiga mental leve</td></tr>
        <tr style="background:#FFFDE7"><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:700">3</td><td style="padding:6px 10px;border:1px solid #ddd">Estresse ocupacional</td></tr>
        <tr style="background:#FFF3E0"><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:700">4</td><td style="padding:6px 10px;border:1px solid #ddd">Transtornos psicológicos</td></tr>
        <tr style="background:#FFEBEE"><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:700">5</td><td style="padding:6px 10px;border:1px solid #ddd">Adoecimento grave</td></tr>
      </table>

      <h3 style="color:#185FA5;font-size:13pt;margin-top:30px;margin-bottom:10px">2.4 Métodos de Controle e Ação</h3>
      <p style="font-size:10pt;line-height:1.6;margin-bottom:10px;text-align:justify">
        Os métodos de controle devem ser definidos de acordo com o nível de risco identificado na avaliação.
        A priorização das ações segue a hierarquia de criticidade estabelecida pela matriz de risco, onde riscos mais elevados
        exigem intervenções imediatas e rigorosas, enquanto riscos de menor criticidade demandam monitoramento ou nenhuma ação adicional.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:10pt">
        <tr style="background:#1F3864;color:#fff">
          <th style="padding:8px;border:1px solid #1F3864;text-align:left;width:280px">Níveis de Risco (Ordem de Prioridade)</th>
          <th style="padding:8px;border:1px solid #1F3864;text-align:left">Controle de Ações</th>
        </tr>
        <tr style="background:#FFCDD2"><td style="padding:6px 10px;border:1px solid #ddd;color:#C62828;font-weight:700">1º INTOLERÁVEL</td><td style="padding:6px 10px;border:1px solid #ddd">Ações imediatas</td></tr>
        <tr style="background:#FFD8B0"><td style="padding:6px 10px;border:1px solid #ddd;color:#E65100;font-weight:700">2º SUBSTANCIAL</td><td style="padding:6px 10px;border:1px solid #ddd">Controle necessário</td></tr>
        <tr style="background:#FFF2CC"><td style="padding:6px 10px;border:1px solid #ddd;color:#7D4E00;font-weight:700">3º MODERADO</td><td style="padding:6px 10px;border:1px solid #ddd">Controle adicional, se possível / viável</td></tr>
        <tr style="background:#D5E8D4"><td style="padding:6px 10px;border:1px solid #ddd;color:#388E3C;font-weight:700">4º TOLERÁVEL</td><td style="padding:6px 10px;border:1px solid #ddd">Nenhum controle adicional necessário</td></tr>
        <tr style="background:#D6E9F8"><td style="padding:6px 10px;border:1px solid #ddd;color:#1976D2;font-weight:700">5º TRIVIAL</td><td style="padding:6px 10px;border:1px solid #ddd">Nenhuma ação necessária</td></tr>
      </table>
    </div>`;

  /* ───── SEÇÃO 3: GES ───── */
  let gesHtml = `<div style="padding:14px 22px">${headerLogo}<h2 style="color:#1F3864;font-size:14pt;margin:6px 0 8px">3. Grupos de Exposição Similar — GES</h2></div>`;

  gesData.forEach((g,gIdx)=>{
    let maqHtml = g.maquinas.length
      ? `<div style="margin-bottom:12px"><b style="font-size:10pt">Máquinas e equipamentos:</b><ul style="margin:5px 0 0 20px;font-size:10pt;line-height:1.8">${g.maquinas.map(m=>`<li>${m}</li>`).join('')}</ul></div>` : '';
    let tarRows = g.tarefas.map((t,i)=>`<tr><td style="padding:4px 8px;border:1px solid #ddd;font-size:9pt;text-align:center">${i+1}</td><td style="padding:4px 8px;border:1px solid #ddd;font-size:9pt">${t.prescrita||'—'}</td><td style="padding:4px 8px;border:1px solid #ddd;font-size:9pt">${t.real||'—'}</td></tr>`).join('');
    let rRows='';
    RISCOS.forEach(r=>{
      if(r.cat){rRows+=`<tr><td colspan="8" style="padding:5px 8px;background:#EEF2F8;font-weight:bold;font-size:8pt;color:#1F3864;border:1px solid #ddd;text-transform:uppercase">${r.cat}</td></tr>`;return;}
      const rv=g.riscos[r.id]||{prob:1,sev:1,motivo:'',nr:1,label:'Trivial',bg:'#D6E9F8',cor:'#1976D2'};
      const nr=rv.nr||(rv.prob*rv.sev)||1,mc=matrizCor(nr);
      rRows+=`<tr style="${nr>=9?'background:'+mc.bg+'33':''}">
        <td style="padding:3px 6px;border:1px solid #ddd;font-size:8pt;color:#555;text-align:center">${r.id}</td>
        <td style="padding:3px 6px;border:1px solid #ddd;font-size:9pt${nr>=9?';font-weight:bold':''}">${r.desc}</td>
        <td style="padding:3px 6px;border:1px solid #ddd;font-size:8pt;color:#854F0B">${r.quando}</td>
        <td style="padding:3px 6px;border:1px solid #ddd;font-size:8pt;font-weight:700;color:#185FA5">${r.embasamento}</td>
        <td style="padding:3px 6px;border:1px solid #ddd;text-align:center;font-weight:bold;font-size:9pt">${rv.prob||1}</td>
        <td style="padding:3px 6px;border:1px solid #ddd;text-align:center;font-weight:bold;font-size:9pt">${rv.sev||1}</td>
        <td style="padding:3px 6px;border:1px solid #ddd;text-align:center"><span style="background:${mc.bg};color:${mc.cor};padding:2px 8px;border-radius:12px;font-size:8pt;font-weight:bold">${nr} — ${mc.label}${nr>=9?' ⚠':''}</span></td>
        <td style="padding:3px 6px;border:1px solid #ddd;font-size:8pt;font-style:${rv.motivo?'normal':'italic'};color:${rv.motivo?'#1A2332':'#999'}">${rv.motivo||'—'}</td>
      </tr>${nr>=9?`<tr style="background:#f0f6ff"><td colspan="8" style="padding:6px 12px;border:1px solid #ddd;font-size:8pt;line-height:1.6;color:#185FA5"><b>Recomendação NR-17:</b> ${r.recomendacao}</td></tr>`:''}`;
    });
    let fotosHtml='';
    if(g.fotos.length){
      const fotosItems = g.fotos.map((f,i)=>`<td style="padding:4px;vertical-align:top;text-align:center;width:7.4cm">
        <img src="${f.src}" style="width:7cm;height:4cm;object-fit:cover;border:1px solid #ccc;display:block;margin:0 auto">
        <div style="font-size:9pt;font-weight:bold;margin-top:3px;color:#1F3864;line-height:1.3">Foto ${i+1}${f.legenda?' — '+f.legenda:''}</div>
      </td>`);
      // Agrupa em linhas de 2 fotos
      let rows = '';
      for(let i=0;i<fotosItems.length;i+=2){
        const par = fotosItems.slice(i,i+2).join('');
        const fill = fotosItems.length-i === 1 ? '<td style="width:7.4cm"></td>' : '';
        rows += `<tr>${par}${fill}</tr>`;
      }
      fotosHtml = `<div style="margin-top:10px"><b style="font-size:10pt;color:#185FA5">Registros fotográficos</b>
        <table style="margin-top:6px;border-collapse:separate;border-spacing:6px 6px">${rows}</table></div>`;
    }

    gesHtml += `<div style="padding:14px 22px">
      ${headerLogo}
      <h3 style="font-size:12pt;color:#185FA5;margin:4px 0 6px;border-bottom:1.5px solid #185FA5;padding-bottom:3px">3.${gIdx+1} ${g.codigo} — ${g.setor||'Setor não informado'}</h3>

      <table style="width:100%;font-size:10pt;margin-bottom:12px;border-collapse:collapse">
        <tr><td style="padding:3px 0;color:#555;width:160px;font-weight:600">Funções / cargos:</td><td>${g.funcoes||'—'}</td></tr>
        <tr><td style="padding:3px 0;color:#555;font-weight:600">Nº trabalhadores:</td><td>${g.numTrab||'—'}</td></tr>
        <tr><td style="padding:3px 0;color:#555;font-weight:600">Jornada:</td><td>${g.jornada||'—'}</td></tr>
      </table>

      ${maqHtml}

      <b style="font-size:11pt;color:#185FA5">Atividades / Tarefas</b>
      <table style="width:100%;border-collapse:collapse;margin:6px 0 14px">
        <tr style="background:#1F3864;color:#fff"><th style="padding:5px 8px;border:1px solid #1F3864;font-size:9pt;text-align:left;width:30px">#</th><th style="padding:5px 8px;border:1px solid #1F3864;font-size:9pt;text-align:left">Tarefa prescrita</th><th style="padding:5px 8px;border:1px solid #1F3864;font-size:9pt;text-align:left">Tarefa real</th></tr>
        ${tarRows}
      </table>

      <b style="font-size:11pt;color:#185FA5">Riscos Ergonômicos — Checklist I5-2 | Matriz 5×5 (NR = P × S)</b>
      <table style="width:100%;border-collapse:collapse;margin-top:6px">
        <tr style="background:#1F3864">${['Cód.','Fator de Risco','Risco Quando','Embasamento','P','S','NR','Observações'].map(h=>`<th style="padding:5px 8px;font-size:9pt;color:#fff;border:1px solid #1F3864">${h}</th>`).join('')}</tr>
        ${rRows}
      </table>

      ${fotosHtml}

      ${g.recomendacoes?`<div style="margin-top:14px;padding:12px;background:#F8F9FA;border-left:4px solid #185FA5;border-radius:0 6px 6px 0"><b style="font-size:11pt;color:#185FA5">Recomendações:</b><p style="font-size:10pt;margin:5px 0 0;line-height:1.6">${g.recomendacoes}</p></div>`:''}

      ${g.observacoes?`<div style="margin-top:12px;padding:12px;background:#FFF8E8;border-left:4px solid #F4B942;border-radius:0 6px 6px 0"><b style="font-size:11pt;color:#854F0B">Observações:</b><p style="font-size:10pt;margin:5px 0 0;line-height:1.6">${g.observacoes}</p></div>`:''}
    </div>`;
  });

  /* ───── SEÇÃO 4: CRONOGRAMA DE AÇÕES — 5W2H (tabela compacta) ───── */
  let cronoHtml = '';
  if(acoes.length){
    let acRows = acoes.map(a=>{
      const sc = statusCor(a.status);
      return `<tr>
        <td style="padding:6px 7px;border:1px solid #C8D0DC;font-size:8pt;font-weight:700;color:#1F3864;white-space:nowrap;background:#F8F9FA">${a.riscoId}/${a.gesCode}</td>
        <td style="padding:6px 7px;border:1px solid #C8D0DC;font-size:8pt;line-height:1.3">${a.desc}</td>
        <td style="padding:6px 7px;border:1px solid #C8D0DC;text-align:center"><span style="background:${a.bg};color:${a.cor};padding:2px 6px;border-radius:3px;font-size:8pt;font-weight:700;white-space:nowrap;display:inline-block">NR ${a.nr}<br>${a.label}</span></td>
        <td style="padding:6px 7px;border:1px solid #C8D0DC;font-size:8pt;line-height:1.3">${a.what||'—'}</td>
        <td style="padding:6px 7px;border:1px solid #C8D0DC;font-size:8pt;line-height:1.3">${a.why||'—'}</td>
        <td style="padding:6px 7px;border:1px solid #C8D0DC;font-size:8pt;line-height:1.3">${a.where||'—'}</td>
        <td style="padding:6px 7px;border:1px solid #C8D0DC;font-size:8pt;line-height:1.3">${a.who||'—'}</td>
        <td style="padding:6px 7px;border:1px solid #C8D0DC;font-size:8pt;line-height:1.3">${a.when||'—'}</td>
        <td style="padding:6px 7px;border:1px solid #C8D0DC;font-size:8pt;line-height:1.3">${a.howMuch||'—'}</td>
        <td style="padding:6px 7px;border:1px solid #C8D0DC;font-size:8pt;line-height:1.3">${a.how||'—'}</td>
        <td style="padding:6px 7px;border:1px solid #C8D0DC;text-align:center;background:${sc.bg};color:${sc.fg};font-weight:700;font-size:8pt;white-space:nowrap">${sc.label}</td>
      </tr>`;
    }).join('');

    const cols = ['Risco','Descrição','NR','O QUÊ','POR QUÊ','ONDE','QUEM','QUANDO','QUANTO CUSTA','COMO','Status'];

    cronoHtml = `<div style="padding:14px 22px;margin-top:18px">
      ${headerLogo}
      <h2 style="color:#1F3864;font-size:14pt;margin:6px 0 4px">4. Cronograma de ações — 5W2H</h2>
      <p style="font-size:9pt;color:#666;margin:0 0 10px">Matriz Mulhausen &amp; Damiano / BS 8800 Apêndice D, adaptada NR-01. Riscos com NR ≥ 9.</p>
      <table style="width:100%;border-collapse:collapse;table-layout:auto">
        <tr style="background:#1F3864">
          ${cols.map(h=>`<th style="padding:7px 7px;font-size:8pt;color:#fff;border:1px solid #1F3864;text-align:left;font-weight:700;letter-spacing:.2px">${h}</th>`).join('')}
        </tr>
        ${acRows}
      </table>
    </div>`;
  }

  /* ───── SEÇÃO RESPONSÁVEL E ASSINATURA ───── */
  const sigNome = assinatura.nome || fv('respNome');
  const sigHtml = sigNome ? `
    <div style="margin-top:32px;text-align:center">
      <div style="font-family:'Dancing Script',cursive;font-size:36pt;color:#1F3864;margin-bottom:8px;letter-spacing:1px">${sigNome}</div>
      <div style="border-top:1.5px solid #1F3864;padding-top:6px;font-size:10pt;color:#555;display:inline-block;min-width:320px">
        <div style="font-weight:700;color:#1F3864">${fv('respNome')||sigNome}</div>
        ${fv('respReg')?`<div>${fv('respReg')}</div>`:''}
        ${fv('respCargo')?`<div>${fv('respCargo')}</div>`:''}
      </div>
      ${assinatura.confirmada?`<div style="font-size:9pt;color:#888;margin-top:6px"><i>Assinado digitalmente em ${assinatura.dataHora}</i></div>`:''}
    </div>` : `<div style="margin-top:60px;border-top:1px solid #999;padding-top:6px;width:280px;margin-left:auto;margin-right:auto;text-align:center"><p style="font-size:9pt;color:#555">Assinatura do responsável técnico</p><p style="font-size:11pt;margin:5px 0 0;font-weight:bold">___________________________</p></div>`;

  const secaoResp = `<div style="padding:14px 22px;margin-top:18px">
    ${headerLogo}
    <h2 style="color:#1F3864;font-size:14pt;margin:6px 0 8px">${acoes.length?'5':'4'}. Responsável técnico</h2>
    <table style="width:100%;border-collapse:collapse;font-size:11pt">
      <tr><td style="padding:5px 0;color:#555;width:170px;font-weight:600">Nome:</td><td><b>${fv('respNome')||'—'}</b></td></tr>
      <tr><td style="padding:5px 0;color:#555;font-weight:600">Registro profissional:</td><td>${fv('respReg')||'—'}</td></tr>
      <tr><td style="padding:5px 0;color:#555;font-weight:600">Cargo / função:</td><td>${fv('respCargo')||'—'}</td></tr>
      <tr><td style="padding:5px 0;color:#555;font-weight:600">Data da visita:</td><td>${(fv('respData')||'').split('-').reverse().join('/')||'—'}</td></tr>
    </table>
    ${fv('respObs')?`<div style="margin-top:18px;padding:12px;background:#F8F9FA;border-left:4px solid #1F3864;border-radius:0 6px 6px 0"><div style="font-weight:700;color:#1F3864;margin-bottom:6px;font-size:11pt">Observações da visita</div><p style="font-size:10pt;margin:0;line-height:1.6">${fv('respObs')}</p></div>`:''}
    ${sigHtml}
  </div>`;

  /* ───── MONTAGEM FINAL ───── */
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>AEP NR-17 — ${empresa}</title>
    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
    <style>
      body{font-family:Arial,sans-serif;margin:0;padding:0;color:#222;font-size:10pt;line-height:1.4}
      @page{margin:0.8cm 0.7cm}
      h1,h2,h3{font-family:Arial,sans-serif;margin:0}
      p{margin:4px 0}
      table{border-collapse:collapse}
    </style>
  </head><body>
    ${sumarioHtml}
    ${secao1}
    ${secao2}
    ${gesHtml}
    ${cronoHtml}
    ${secaoResp}
  </body></html>`;

  const blob = new Blob([html],{type:'application/msword'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AEP_NR17_${empresa.replace(/[^a-zA-Z0-9]/g,'_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('✓ Documento Word gerado e baixado!','ok');
  document.getElementById('footerInfo').textContent = '✓ Documento gerado com sucesso!';
  setTimeout(()=>{ document.getElementById('footerInfo').textContent = 'Dados salvos automaticamente no navegador'; }, 4000);
}

/* ── OFFLINE BANNER ── */
function updateOnlineStatus(){ const b=document.getElementById('offlineBanner'); if(b) b.classList.toggle('show',!navigator.onLine); }
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  showPage('empresa');
  updateOnlineStatus();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
});
