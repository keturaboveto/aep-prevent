# 🔥 Guia de Configuração do Firebase — AEP NR-17

Este guia mostra, passo a passo, como criar seu projeto Firebase gratuito
para que o login funcione em **qualquer dispositivo** (celular, PC, tablet).

⏱️ Tempo estimado: 10 minutos · 💰 Custo: gratuito

---

## PARTE 1 — Criar o projeto Firebase

1. Acesse **https://console.firebase.google.com**
2. Faça login com uma conta Google (a mesma da clínica, de preferência)
3. Clique em **"Criar um projeto"** (ou "Add project")
4. Nome do projeto: digite `aep-prevent` (ou outro nome)
5. Clique em **Continuar**
6. Na tela "Google Analytics": **desative** a chave (não é necessário) e clique em **Continuar** / **Criar projeto**
7. Aguarde alguns segundos e clique em **Continuar** quando estiver pronto

---

## PARTE 2 — Criar o banco de dados (Firestore)

1. No menu lateral esquerdo, clique em **Criação** → **Firestore Database**
   (ou procure por "Firestore" na busca do topo)
2. Clique em **Criar banco de dados**
3. Em "Modo", escolha **Iniciar no modo de teste**
   - ⚠️ Isso libera leitura/escrita por 30 dias. Veja a PARTE 5 para deixar permanente.
4. Em "Local", escolha **`southamerica-east1` (São Paulo)** — mais rápido no Brasil
5. Clique em **Ativar** / **Criar**
6. Aguarde a criação (alguns segundos)

---

## PARTE 3 — Registrar o aplicativo web

1. No menu lateral, clique na **engrenagem ⚙️** (ao lado de "Visão geral do projeto") → **Configurações do projeto**
2. Role para baixo até **"Seus aplicativos"**
3. Clique no ícone **`</>`** (Web)
4. Apelido do app: digite `aep-web`
5. **NÃO marque** "Firebase Hosting"
6. Clique em **Registrar app**
7. Vai aparecer um bloco de código parecido com este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "aep-prevent.firebaseapp.com",
  projectId: "aep-prevent",
  storageBucket: "aep-prevent.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

8. **Copie esses valores** — você vai usá-los no próximo passo
9. Clique em **Continuar no console**

---

## PARTE 4 — Colar as credenciais no app

1. No seu computador, abra o arquivo **`firebase-config.js`** (do pacote do app)
   - Pode abrir no Bloco de Notas, VS Code, ou direto no GitHub (lápis ✏️)
2. Substitua cada `"COLE_AQUI_..."` pelo valor correspondente que você copiou.
   Exemplo de como deve ficar:

```javascript
const firebaseConfig = {
  apiKey:            "AIzaSyXXXXXXXXXXXXXXXXXXXXX",
  authDomain:        "aep-prevent.firebaseapp.com",
  projectId:         "aep-prevent",
  storageBucket:     "aep-prevent.appspot.com",
  messagingSenderId: "123456789012",
  appId:             "1:123456789012:web:abc123def456"
};
```

3. **Salve** o arquivo
4. Suba ao GitHub (substituindo o `firebase-config.js` antigo)

✅ Pronto! Agora o login funciona em qualquer dispositivo.

---

## PARTE 5 — Deixar o banco seguro (após testar)

O "modo de teste" expira em 30 dias. Antes disso, troque as regras:

1. No Firebase → **Firestore Database** → aba **Regras**
2. Apague tudo e cole exatamente isto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
  }
}
```

3. Clique em **Publicar**

> 📌 Isso permite que o app leia/grave a lista de usuários (necessário para o login).
> As senhas ficam guardadas com criptografia SHA-256, nunca em texto puro.
> Para um app interno com poucos usuários, esse nível é adequado.

---

## ✅ Teste final

1. Acesse o app pelo **computador**: faça login com `admin` / `admin123`
2. Vá em **Admin** e cadastre um técnico de teste
3. Pegue o **celular**, acesse a mesma URL
4. Faça login com o técnico que você acabou de criar
5. Funcionou no celular? 🎉 Está tudo certo!

---

## 🆘 Problemas?

| Sintoma | Solução |
|---------|---------|
| "Firebase não configurado" no console | Verifique se colou as credenciais certas no `firebase-config.js` |
| Login funciona no PC mas não no celular | Confirme que o `firebase-config.js` com as credenciais foi enviado ao GitHub |
| "Sem conexão. Cadastro exige internet" | Cadastro de usuários precisa de internet (só o login fica offline) |
| Nada acontece ao logar | Abra com F12 → aba Console e veja se há erro de Firebase |

---

Dr. Prevent Saúde Ocupacional
