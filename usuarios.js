/* ═══════════════════════════════════════════════════════════════
   LISTA DE USUÁRIOS DO SISTEMA — AEP NR-17
   ═══════════════════════════════════════════════════════════════

   COMO ADICIONAR UM TÉCNICO:
     Copie uma linha de técnico, cole abaixo e mude os dados.

   COMO REMOVER:
     Apague a linha inteira do técnico.

   COMO TROCAR A SENHA:
     Mude o texto que está depois de  senha:

   Depois de editar, SALVE o arquivo e envie ao GitHub.
   As mudanças passam a valer em TODOS os dispositivos.

   ┌─────────────────────────────────────────────────────────┐
   │ usuario  = o login (sem espaços, tudo junto, minúsculo)  │
   │ senha    = a senha de acesso                             │
   │ nome     = nome completo (aparece no app)                │
   │ tipo     = "admin"  (vê tudo)  ou  "tecnico" (vê o seu)  │
   └─────────────────────────────────────────────────────────┘
   ═══════════════════════════════════════════════════════════════ */

const USUARIOS = [

  // ───── ADMINISTRADOR (não apague esta linha) ─────
  { usuario: "admin", senha: "admin123", nome: "Administrador", tipo: "admin" },

  // ───── TÉCNICOS (edite, adicione ou remova abaixo) ─────
  { usuario: "joao",  senha: "joao123",  nome: "João Silva",    tipo: "tecnico" },
  { usuario: "maria", senha: "maria123", nome: "Maria Santos",  tipo: "tecnico" },

  // Para adicionar outro técnico, copie a linha abaixo,
  // tire as duas barras // do começo e mude os dados:
  // { usuario: "pedro", senha: "pedro123", nome: "Pedro Costa", tipo: "tecnico" },

];
