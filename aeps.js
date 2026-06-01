/* ═══════════════════════════════════════════════
   AEP NR-17 — aeps.js
   Gerenciador de múltiplas AEPs por usuário
   ═══════════════════════════════════════════════ */

const AEPStore = (function(){

  const INDEX_KEY    = 'aep_index';
  const DATA_PREFIX  = 'aep_data_';
  const CURRENT_KEY  = 'aep_current_id';

  function uid(){
    return 'aep_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
  }

  function getIndex(){
    try{ return JSON.parse(localStorage.getItem(INDEX_KEY)||'[]'); }
    catch(e){ return []; }
  }
  function saveIndex(arr){ localStorage.setItem(INDEX_KEY, JSON.stringify(arr)); }

  function listForUser(session){
    const idx = getIndex();
    const visiveis = session.role === 'admin' ? idx : idx.filter(a => a.owner === session.user);
    return visiveis.sort((a,b)=> (b.atualizadoEm||0) - (a.atualizadoEm||0));
  }

  function create(session){
    const id = uid();
    const now = Date.now();
    const meta = {
      id,
      owner: session.user,
      ownerNome: session.nome || session.user,
      nome: 'Nova AEP — ' + new Date(now).toLocaleDateString('pt-BR'),
      nomePersonalizado: false,
      empresa: '',
      cnpj: '',
      criadoEm: now,
      atualizadoEm: now
    };
    const idx = getIndex();
    idx.unshift(meta);
    saveIndex(idx);

    localStorage.setItem(DATA_PREFIX + id, JSON.stringify({
      empresa: {}, responsavel: {}, gesData: [], acoes: [],
      assinatura: {nome:'', confirmada:false, dataHora:''},
      currentGES: 0
    }));
    return id;
  }

  function getData(id){
    try{ return JSON.parse(localStorage.getItem(DATA_PREFIX+id)||'null'); }
    catch(e){ return null; }
  }

  function saveData(id, data){
    if(!id) return;
    localStorage.setItem(DATA_PREFIX+id, JSON.stringify(data));
    const idx = getIndex();
    const meta = idx.find(a=>a.id===id);
    if(meta){
      meta.atualizadoEm = Date.now();
      if(data.empresa){
        if(data.empresa.razaoSocial) meta.empresa = data.empresa.razaoSocial;
        if(data.empresa.cnpj) meta.cnpj = data.empresa.cnpj;
      }
      if(!meta.nomePersonalizado && data.empresa && data.empresa.razaoSocial){
        const dataStr = new Date(meta.criadoEm).toLocaleDateString('pt-BR');
        meta.nome = `${data.empresa.razaoSocial} — ${dataStr}`;
      }
      saveIndex(idx);
    }
  }

  function rename(id, novoNome){
    const idx = getIndex();
    const meta = idx.find(a=>a.id===id);
    if(meta){
      meta.nome = novoNome.trim();
      meta.nomePersonalizado = true;
      meta.atualizadoEm = Date.now();
      saveIndex(idx);
      return true;
    }
    return false;
  }

  function duplicate(id, session){
    const original = getData(id);
    if(!original) return null;
    const newId = uid();
    const now = Date.now();
    const idx = getIndex();
    const origMeta = idx.find(a=>a.id===id);
    idx.unshift({
      id: newId,
      owner: session.user,
      ownerNome: session.nome || session.user,
      nome: (origMeta?origMeta.nome:'AEP') + ' (cópia)',
      nomePersonalizado: true,
      empresa: origMeta ? origMeta.empresa : '',
      cnpj: origMeta ? origMeta.cnpj : '',
      criadoEm: now,
      atualizadoEm: now
    });
    saveIndex(idx);
    const copia = JSON.parse(JSON.stringify(original));
    copia.assinatura = {nome:'', confirmada:false, dataHora:''};
    localStorage.setItem(DATA_PREFIX + newId, JSON.stringify(copia));
    return newId;
  }

  function remove(id){
    saveIndex(getIndex().filter(a => a.id !== id));
    localStorage.removeItem(DATA_PREFIX+id);
    if(getCurrentId() === id) clearCurrentId();
    return true;
  }

  function getCurrentId(){ return sessionStorage.getItem(CURRENT_KEY); }
  function setCurrentId(id){ sessionStorage.setItem(CURRENT_KEY, id); }
  function clearCurrentId(){ sessionStorage.removeItem(CURRENT_KEY); }

  function getCurrentMeta(){
    const id = getCurrentId();
    if(!id) return null;
    return getIndex().find(a=>a.id===id) || null;
  }

  return { listForUser, create, getData, saveData, rename, duplicate, remove,
           getCurrentId, setCurrentId, clearCurrentId, getCurrentMeta };

})();
