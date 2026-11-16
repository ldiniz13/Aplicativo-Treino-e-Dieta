/* PULSO — configuração do login (Firebase).
   Enquanto estiver "null", o app funciona sem conta (tudo salvo só no aparelho).
   Para ativar: troque null pelo bloco "firebaseConfig" do console do Firebase, assim:

   window.PULSO_FIREBASE = {
     apiKey: "AIza...",
     authDomain: "seu-projeto.firebaseapp.com",
     projectId: "seu-projeto",
     storageBucket: "seu-projeto.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };

   (Essas chaves não são secretas: quem protege os dados são as regras do Firestore.) */
window.PULSO_FIREBASE = null;
