// Configuração do Firebase
// Importando funções necessárias do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBbV40uvsXlYMlXjOO9ZD0CK7IIE8HAbhI",
  authDomain: "discipulado-77dd6.firebaseapp.com",
  projectId: "discipulado-77dd6",
  storageBucket: "discipulado-77dd6.firebasestorage.app",
  messagingSenderId: "1090113808343",
  appId: "1:1090113808343:web:cb504bc57f35dc32be4d92",
  measurementId: "G-H7QJV3VK98"
};

let app = null;
let db = null;
let auth = null;

if (firebaseConfig.apiKey !== "COLE_SUA_API_KEY_AQUI") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
}

export { app, db, auth };

