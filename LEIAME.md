# AEP NR-17 — Dr. Prevent Saúde Ocupacional
## Versão final, limpa, testada

---

## ✅ O que esta versão tem

- **Autenticação SHA-256 nativa** (Web Crypto API) — não pode quebrar entre versões
- **Login com auto-cura** — se admin não existir, é criado automaticamente
- **Múltiplas AEPs por usuário** — cada técnico tem suas próprias avaliações
- **Admin vê todas** as AEPs, técnico só as próprias
- **Nome automático** (razão social + data), editável
- **Consulta CNPJ** via Brasil API (Receita Federal)
- **PWA** — instalável e funciona offline
- **Documento Word** com sumário, fotos lado a lado e cronograma 5W2H em português

---

## 📋 Como criar o novo repositório no GitHub

### Passo 1 — Criar repositório

1. Acesse [github.com](https://github.com) (faça login)
2. Canto superior direito → **+** → **New repository**
3. Configure:
   - **Repository name:** `aep-prevent` (ou outro nome de sua escolha)
   - **Public** ✅ (obrigatório)
   - **Não marque** Add README
4. Clique **Create repository**

### Passo 2 — Upload dos arquivos

1. Na tela do repositório recém-criado, clique no link **"uploading an existing file"**
2. Extraia o ZIP no seu computador
3. **Selecione TODOS os 11 arquivos** de dentro da pasta (Ctrl+A)
4. Arraste para o GitHub
5. Aguarde aparecer a lista completa dos 11 arquivos
6. Role para baixo → caixa **Commit changes** → mensagem: `Versão inicial`
7. Clique no botão verde **Commit changes**

### Passo 3 — Ativar GitHub Pages

1. No repositório → **Settings** (engrenagem)
2. Menu lateral esquerdo → **Pages**
3. Em **Source** → **Deploy from a branch**
4. Em **Branch** → mude de "None" para **main** → deixe **/ (root)**
5. Clique **Save**
6. Aguarde 2-3 minutos

### Passo 4 — Acessar

1. Volte em Pages, recarregue a página (F5)
2. Aparecerá: "Your site is live at: https://SEU_USUARIO.github.io/aep-prevent/"
3. Acesse essa URL
4. Login: **admin** / Senha: **admin123**
5. Troque a senha imediatamente em **Admin**

---

## 📁 Arquivos do pacote

| Arquivo | Função |
|---------|--------|
| `login.html` | Tela de login (entrada) |
| `aeps.html` | Lista de AEPs (tela inicial após login) |
| `admin.html` | Painel de administração de usuários |
| `index.html` | App principal (cada AEP individual) |
| `auth.js` | Autenticação (SHA-256) |
| `aeps.js` | Gerenciador de múltiplas AEPs |
| `app.js` | Lógica do app + gerador de Word |
| `logo-data.js` | Logo Dr. Prevent (base64) |
| `logo-prevent.png` | Logo PNG |
| `sw.js` | Service Worker (offline) |
| `manifest.json` | PWA manifest |
| `icon-192.png` / `icon-512.png` | Ícones |

---

## 🎯 Fluxo de uso

```
login.html
   ↓ (login válido)
aeps.html (lista de AEPs)
   ↓ (clica em "Nova AEP" ou abre uma existente)
index.html (app principal)
   - Empresa → GES → Cronograma → Responsável
   - Botão "Voltar às AEPs" na sidebar
```

---

## 🔐 Segurança

- Senhas armazenadas como **SHA-256** (padrão de mercado)
- Hash gerado pela **Web Crypto API nativa** do navegador
- Mesmo input sempre produz mesmo hash em qualquer navegador
- Sessão expira em 12 horas
- Cada técnico vê apenas suas próprias AEPs
- Admin tem visão completa do sistema

---

Dr. Prevent Saúde Ocupacional
