# AEP NR-17 — Dr. Prevent Saúde Ocupacional
## Versão com Firebase (login funciona em qualquer dispositivo)

---

## ⚡ IMPORTANTE — Leia primeiro

Esta versão usa **Firebase** para que o login funcione em **qualquer dispositivo**
(celular, PC, tablet). Antes de usar, você precisa fazer uma configuração única
de ~10 minutos.

👉 **Siga o arquivo `FIREBASE-SETUP.md` passo a passo.**

Sem essa configuração, o app mostrará "Firebase não configurado" e o login não funcionará.

---

## Por que Firebase?

Na versão anterior, os usuários ficavam salvos só no navegador onde foram criados
(localStorage). Por isso o login funcionava no PC do admin, mas não no celular dos
técnicos — cada dispositivo tinha sua própria "lista de usuários" isolada.

Com o Firebase, os usuários ficam guardados **na nuvem**, acessíveis de qualquer
aparelho. O login passa a funcionar em todos os dispositivos.

- ✅ **Usuários/login** → nuvem (Firebase) — funciona em qualquer dispositivo
- ✅ **AEPs preenchidas** → ficam no próprio dispositivo (como você prefere)
- ✅ **Funciona offline** → depois do primeiro login, o app funciona sem internet em campo
- ✅ **Custo zero** → plano gratuito do Firebase é mais que suficiente

---

## Ordem de instalação

1. **Configure o Firebase** seguindo `FIREBASE-SETUP.md`
2. **Cole as credenciais** no arquivo `firebase-config.js`
3. **Suba todos os arquivos** ao GitHub (veja abaixo)
4. **Ative o GitHub Pages**
5. **Acesse e faça login** com admin / admin123

---

## Subir ao GitHub Pages

1. Crie um repositório público (ex.: `aep-prevent`)
2. **Add file → Upload files**
3. Arraste **TODOS os arquivos** desta pasta
4. **Commit changes**
5. **Settings → Pages → Branch: main → Save**
6. Acesse `https://SEU_USUARIO.github.io/aep-prevent/`

---

## Arquivos do pacote

| Arquivo | Função |
|---------|--------|
| `FIREBASE-SETUP.md` | **LEIA PRIMEIRO** — guia de configuração do Firebase |
| `firebase-config.js` | **EDITE** — cole aqui as credenciais do seu Firebase |
| `login.html` | Tela de login |
| `aeps.html` | Lista de AEPs (tela inicial) |
| `admin.html` | Painel de administração de usuários |
| `index.html` | App principal (cada AEP) |
| `auth.js` | Autenticação (Firebase + SHA-256) |
| `aeps.js` | Gerenciador de AEPs (local no dispositivo) |
| `app.js` | Lógica do app + gerador de Word |
| `logo-data.js` | Logo Dr. Prevent (base64) |
| `logo-prevent.png` | Logo PNG |
| `sw.js` | Service Worker (offline) |
| `manifest.json` | PWA manifest |
| `icon-192.png` / `icon-512.png` | Ícones |

---

## Primeiro acesso

- Usuário: **admin**
- Senha: **admin123**
- Troque a senha do admin imediatamente em **Admin**
- Cadastre os técnicos — agora eles conseguem logar de qualquer dispositivo

---

Dr. Prevent Saúde Ocupacional
