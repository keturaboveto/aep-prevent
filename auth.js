/* ═══════════════════════════════════════════════
   AEP NR-17 — auth.js
   Sistema de autenticação
   ═══════════════════════════════════════════════ */

const AEPAuth = (function(){

  const USERS_KEY = 'aep_users';
  const SESSION_KEY = 'aep_session';
  const SESSION_TTL = 12 * 60 * 60 * 1000; // 12h

  /* ── Hash SHA-256 nativo (Web Crypto API) ── */
  async function hashPwd(password){
    const data = new TextEncoder().encode(String(password||''));
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function getUsers(){
    try{ return JSON.parse(localStorage.getItem(USERS_KEY)||'[]'); }
    catch(e){ return []; }
  }
  function saveUsers(users){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

  /* ── Garante que o admin padrão sempre exista ── */
  async function garantirAdmin(){
    let users = getUsers();
    const admin = users.find(u => u.username && u.username.toLowerCase()==='admin');
    if(!admin){
      const pwdHash = await hashPwd('admin123');
      users.push({
        username:'admin',
        pwdHash,
        nome:'Administrador',
        role:'admin',
        ativo:true,
        criadoEm: Date.now()
      });
      saveUsers(users);
    }
  }

  /* ── LOGIN ── */
  async function login(username, password){
    username = String(username||'').trim();
    password = String(password||'').trim();
    if(!username||!password) return {ok:false, msg:'Preencha usuário e senha.'};

    const users = getUsers();
    const u = users.find(x => x.username && x.username.toLowerCase()===username.toLowerCase());

    if(!u) return {ok:false, msg:'Usuário não encontrado.'};
    if(!u.ativo) return {ok:false, msg:'Usuário inativo. Contate o administrador.'};

    const pwdHash = await hashPwd(password);
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
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      user, nome, role, loginAt: Date.now()
    }));
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

  /* ── CRUD de usuários (admin) ── */
  function listUsers(){ return getUsers(); }

  async function addUser({username, nome, password, role}){
    username = String(username||'').trim();
    nome = String(nome||'').trim();
    password = String(password||'').trim();
    if(!username||!nome||!password) return {ok:false, msg:'Preencha todos os campos.'};
    if(password.length<4) return {ok:false, msg:'A senha deve ter ao menos 4 caracteres.'};
    const users = getUsers();
    if(users.find(u=>u.username.toLowerCase()===username.toLowerCase())) return {ok:false, msg:'Usuário já existe.'};
    const pwdHash = await hashPwd(password);
    users.push({username, pwdHash, nome, role: role||'tecnico', ativo:true, criadoEm:Date.now()});
    saveUsers(users);
    return {ok:true};
  }

  async function updateUser({username, nome, password, role, ativo}){
    const users = getUsers();
    const idx = users.findIndex(u=>u.username===username);
    if(idx===-1) return {ok:false, msg:'Usuário não encontrado.'};
    if(nome) users[idx].nome = String(nome).trim();
    if(typeof ativo==='boolean') users[idx].ativo = ativo;
    if(role) users[idx].role = role;
    if(password){
      password = String(password).trim();
      if(password.length<4) return {ok:false, msg:'A senha deve ter ao menos 4 caracteres.'};
      users[idx].pwdHash = await hashPwd(password);
    }
    saveUsers(users);
    return {ok:true};
  }

  function deleteUser(username){
    if(username==='admin') return {ok:false, msg:'Não é possível excluir o admin principal.'};
    let users = getUsers();
    users = users.filter(u=>u.username!==username);
    saveUsers(users);
    return {ok:true};
  }

  // Garante o admin assim que o módulo carrega (com await fora — promessa silenciosa)
  garantirAdmin();

  return {login, setSession, getSession, requireAuth, requireAdmin, logout,
          listUsers, addUser, updateUser, deleteUser, hashPwd, garantirAdmin};

})();
