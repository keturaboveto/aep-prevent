/* ════════════════════════════════════════════════════════════
   CONFIGURAÇÃO DO FIREBASE
   ────────────────────────────────────────────────────────────
   Cole abaixo as credenciais do SEU projeto Firebase.
   Siga o passo a passo no arquivo FIREBASE-SETUP.md

   Você vai substituir cada "COLE_AQUI..." pelos valores que
   o Firebase mostra na configuração do projeto.
   ════════════════════════════════════════════════════════════ */

const firebaseConfig = {
  apiKey:            "AIzaSyXXXXXXXXXXXXXXXXXXXXX",
  authDomain:        "aep-prevent.firebaseapp.com",
  projectId:         "aep-prevent",
  storageBucket:     "aep-prevent.appspot.com",
  messagingSenderId: "123456789012",
  appId:             "1:123456789012:web:abc123def456"
};

/* ─── Inicialização (não precisa mexer daqui para baixo) ─── */
(function(){
  try{
    if(!firebaseConfig.apiKey || firebaseConfig.apiKey.indexOf('COLE_AQUI') === 0){
      window.firebaseReady = false;
      console.warn('Firebase ainda não configurado — edite firebase-config.js');
      return;
    }
    firebase.initializeApp(firebaseConfig);
    window.firebaseDB = firebase.firestore();
    // Cache offline nativo do Firestore
    window.firebaseDB.enablePersistence({synchronizeTabs:true}).catch(()=>{});
    window.firebaseReady = true;
    console.log('Firebase conectado com sucesso.');
  }catch(e){
    window.firebaseReady = false;
    console.error('Erro ao iniciar Firebase:', e);
  }
})();
