# AEP NR-17 — Dr. Prevent Saúde Ocupacional
## Versão simples — login funciona em qualquer dispositivo, SEM configuração

---

## ✅ Como funciona o login

Os usuários ficam listados no arquivo **`usuarios.js`**. Como esse arquivo faz
parte do app e é igual em todos os dispositivos, o login funciona em **qualquer
aparelho** (celular, PC, tablet) automaticamente — sem Firebase, sem banco de
dados, sem nenhuma configuração externa.

---

## 👤 Usuários que já vêm prontos

| Usuário | Senha    | Perfil  |
|---------|----------|---------|
| admin   | admin123 | Admin   |
| joao    | joao123  | Técnico |
| maria   | maria123 | Técnico |

> Os usuários `joao` e `maria` são exemplos. Edite o arquivo `usuarios.js`
> para colocar os nomes e senhas reais dos seus técnicos.

---

## ✏️ Como adicionar/editar/remover técnicos

Abra o arquivo **`usuarios.js`** (no GitHub, clique nele e depois no lápis ✏️).
Cada técnico é uma linha assim:

```javascript
{ usuario: "joao", senha: "joao123", nome: "João Silva", tipo: "tecnico" },
```

- **Adicionar:** copie uma linha, cole abaixo e mude os dados
- **Trocar senha:** mude o texto depois de `senha:`
- **Remover:** apague a linha inteira
- **Salvar:** role até o fim e clique em **Commit changes**

Em ~1 minuto as mudanças valem em todos os dispositivos.

A página **Admin** dentro do app mostra a lista atual e essas instruções de novo.

---

## 📋 Como publicar no GitHub Pages

1. Crie um repositório público (ex.: `aep-prevent`)
2. **Add file → Upload files** → arraste TODOS os arquivos desta pasta
3. **Commit changes**
4. **Settings → Pages → Branch: main → Save**
5. Acesse `https://SEU_USUARIO.github.io/aep-prevent/`
6. Login: **admin** / **admin123**

---

## 📁 Arquivos do pacote

| Arquivo | Função |
|---------|--------|
| `usuarios.js` | **Lista de usuários** — edite aqui para gerenciar acessos |
| `login.html` | Tela de login |
| `aeps.html` | Lista de AEPs (tela inicial) |
| `admin.html` | Lista de usuários + instruções |
| `index.html` | App principal (cada AEP) |
| `auth.js` | Login |
| `aeps.js` | Gerenciador de AEPs |
| `app.js` | Lógica + gerador de Word |
| `logo-data.js` / `logo-prevent.png` | Logo Dr. Prevent |
| `sw.js` / `manifest.json` | PWA (offline) |
| `icon-192.png` / `icon-512.png` | Ícones |

---

## 🔒 Sobre segurança das senhas

Como o repositório do GitHub Pages é público, as senhas no `usuarios.js` ficam
visíveis para quem procurar no código. Para um app interno com poucos usuários,
isso é aceitável — mas use **senhas exclusivas deste app**, nunca repita senhas
de e-mail, banco ou outros serviços importantes.

---

## 📌 Lembrete sobre as AEPs

As AEPs preenchidas ficam salvas **no próprio dispositivo** onde foram criadas
(cada técnico no seu celular). Isso é o ideal para o seu uso e mantém as fotos
e dados sempre disponíveis offline.

---

Dr. Prevent Saúde Ocupacional
