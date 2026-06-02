/* ═══════════════════════════════════════════════
   AEP NR-17 — auth.js
   Login simples baseado em usuarios.js
   ═══════════════════════════════════════════════ */

const AEPAuth = (function(){

  const SESSION_KEY = 'aep_session';
  const SESSION_TTL = 24 * 60 * 60 * 1000; // 24h

  function getUsuarios(){
    return (typeof USUARIOS !== 'undefined' && Array.isArray(USUARIOS)) ? USUARIOS : [];
  }

  /* ── LOGIN ── */
  function login(username, password){
    username = String(username||'').trim().toLowerCase();
    password = String(password||'').trim();
    if(!username || !password) return {ok:false, msg:'Preencha usuário e senha.'};

    const u = getUsuarios().find(x => String(x.usuario||'').trim().toLowerCase() === username);
    if(!u) return {ok:false, msg:'Usuário não encontrado.'};
    if(String(u.senha) !== password) return {ok:false, msg:'Senha incorreta.'};

    return {ok:true, user:u.usuario, nome:u.nome, role:u.tipo||'tecnico'};
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

  function listUsers(){ return getUsuarios(); }

  return {login, setSession, getSession, requireAuth, requireAdmin, logout, listUsers};

})();
