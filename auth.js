/* ═══════════════════════════════════════════════
   AEP NR-17 — auth.js (Firebase Firestore)
   Usuários na nuvem + cache offline
   ═══════════════════════════════════════════════ */

const AEPAuth = (function(){

  const SESSION_KEY = 'aep_session';
  const SESSION_TTL = 24 * 60 * 60 * 1000;       // 24h
  const USERS_CACHE_KEY = 'aep_users_cache';     // fallback offline

  function db(){ return window.firebaseDB; }
  function online(){ return window.firebaseReady && db(); }

  /* ── Hash SHA-256 nativo ── */
  async function hashPwd(password){
    const data = new TextEncoder().encode(String(password||''));
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  /* ── cache local (para offline) ── */
  function getCache(){
    try{ return JSON.parse(localStorage.getItem(USERS_CACHE_KEY)||'[]'); }
    catch(e){ return []; }
  }
  function setCache(users){ localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users)); }

  /* ── lê todos os usuários (Firestore → cache) ── */
  async function getUsers(){
    if(online()){
      try{
        const snap = await db().collection('users').get();
        const users = [];
        snap.forEach(doc => users.push(doc.data()));
        setCache(users);   // guarda p/ uso offline
        return users;
      }catch(e){
        return getCache(); // falhou → cache
      }
    }
    return getCache();     // sem firebase → cache
  }

  async function getUser(username){
    username = String(username||'').trim().toLowerCase();
    if(online()){
      try{
        const doc = await db().collection('users').doc(username).get();
        return doc.exists ? doc.data() : null;
      }catch(e){
        return getCache().find(u => u.username.toLowerCase()===username) || null;
      }
    }
    return getCache().find(u => u.username.toLowerCase()===username) || null;
  }

  async function saveUser(user){
    const id = user.username.toLowerCase();
    if(online()){
      try{ await db().collection('users').doc(id).set(user); }
      catch(e){ throw new Error('Sem conexão. Cadastro de usuários exige internet.'); }
    } else {
      throw new Error('Firebase não configurado. Cadastro de usuários exige conexão.');
    }
    // atualiza cache
    const cache = getCache().filter(u => u.username.toLowerCase()!==id);
    cache.push(user);
    setCache(cache);
  }

  /* ── garante admin padrão ── */
  async function garantirAdmin(){
    try{
      const admin = await getUser('admin');
      const adminHash = await hashPwd('admin123');
      if(!admin){
        await saveUser({username:'admin', pwdHash:adminHash, nome:'Administrador', role:'admin', ativo:true, criadoEm:Date.now()});
      } else if(!admin.pwdHash || admin.pwdHash.length !== 64){
        admin.pwdHash = adminHash; admin.ativo = true; admin.role = 'admin';
        await saveUser(admin);
      }
    }catch(e){ /* offline: ignora, usa cache */ }
  }

  /* ── LOGIN ── */
  async function login(username, password){
    username = String(username||'').trim();
    password = String(password||'').trim();
    if(!username||!password) return {ok:false, msg:'Preencha usuário e senha.'};

    // ── ACESSO MESTRE: admin/admin123 SEMPRE funciona (mesmo sem Firebase) ──
    if(username.toLowerCase()==='admin' && password==='admin123'){
      // tenta sincronizar no Firestore em segundo plano, mas não bloqueia o acesso
      try{ await garantirAdmin(); }catch(e){}
      return {ok:true, user:'admin', nome:'Administrador', role:'admin'};
    }

    const u = await getUser(username);
    if(!u) return {ok:false, msg:'Usuário não encontrado.'};
    if(!u.ativo) return {ok:false, msg:'Usuário inativo. Contate o administrador.'};

    const pwdHash = await hashPwd(password);

    // auto-cura admin (se logar com outra senha de admin já alterada)
    if(u.role==='admin' && u.pwdHash !== pwdHash && password==='admin123'){
      return {ok:true, user:u.username, nome:u.nome||'Administrador', role:'admin'};
    }

    if(u.pwdHash !== pwdHash) return {ok:false, msg:'Senha incorreta.'};
    return {ok:true, user:u.username, nome:u.nome, role:u.role};
  }

  /* ── Sessão ── */
  function getSession(){
    try{
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');
      if(!s) return null;
      if(Date.now()-s.loginAt > SESSION_TTL){ sessionStorage.removeItem(SESSION_KEY); return null; }
      return s;
    }catch(e){ return null; }
  }
  function setSession(user, nome, role){
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({user, nome, role, loginAt:Date.now()}));
  }
  function requireAuth(){
    const s = getSession();
    if(!s){ window.location.href='login.html'; return null; }
    return s;
  }
  function requireAdmin(){
    const s = requireAuth();
    if(s && s.role!=='admin'){ window.location.href='aeps.html'; return null; }
    return s;
  }
  function logout(){
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href='login.html';
  }

  /* ── CRUD usuários (admin) ── */
  async function listUsers(){ return await getUsers(); }

  async function addUser({username, nome, password, role}){
    username = String(username||'').trim();
    nome = String(nome||'').trim();
    password = String(password||'').trim();
    if(!username||!nome||!password) return {ok:false, msg:'Preencha todos os campos.'};
    if(password.length<4) return {ok:false, msg:'A senha deve ter ao menos 4 caracteres.'};
    const existe = await getUser(username);
    if(existe) return {ok:false, msg:'Usuário já existe.'};
    try{
      const pwdHash = await hashPwd(password);
      await saveUser({username, pwdHash, nome, role:role||'tecnico', ativo:true, criadoEm:Date.now()});
      return {ok:true};
    }catch(e){ return {ok:false, msg:e.message}; }
  }

  async function updateUser({username, nome, password, role, ativo}){
    const u = await getUser(username);
    if(!u) return {ok:false, msg:'Usuário não encontrado.'};
    if(nome) u.nome = String(nome).trim();
    if(typeof ativo==='boolean') u.ativo = ativo;
    if(role) u.role = role;
    if(password){
      password = String(password).trim();
      if(password.length<4) return {ok:false, msg:'A senha deve ter ao menos 4 caracteres.'};
      u.pwdHash = await hashPwd(password);
    }
    try{ await saveUser(u); return {ok:true}; }
    catch(e){ return {ok:false, msg:e.message}; }
  }

  async function deleteUser(username){
    if(username==='admin') return {ok:false, msg:'Não é possível excluir o admin principal.'};
    const id = username.toLowerCase();
    if(online()){
      try{ await db().collection('users').doc(id).delete(); }
      catch(e){ return {ok:false, msg:'Sem conexão para excluir.'}; }
    }
    setCache(getCache().filter(u => u.username.toLowerCase()!==id));
    return {ok:true};
  }

  return {login, setSession, getSession, requireAuth, requireAdmin, logout,
          listUsers, addUser, updateUser, deleteUser, hashPwd, garantirAdmin};

})();
