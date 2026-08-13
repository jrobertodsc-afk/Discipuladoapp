import { db } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Sincroniza o localStorage com o Firestore (Estratégia Local-First)
// Isso evita a necessidade de reescrever todo o código de interface que usa DB.getAll e DB.save de forma síncrona.

if (window.DB) {
    const originalSave = window.DB.save;
    
    // Monkey-patch the save function to push to Firebase
    window.DB.save = function(key, data) {
        // Save locally first for instant UI updates
        originalSave.call(this, key, data);
        
        // Push to Firebase async
        setDoc(doc(db, "appData", key), { items: data }).catch(err => {
            console.error("Erro ao sincronizar com Firebase:", err);
        });
    };

    // Load data from Firebase on startup
    window.DB.syncFromFirebase = async function() {
        let hasUpdates = false;
        
        for (const key of Object.values(window.DB.KEYS)) {
            try {
                const docSnap = await getDoc(doc(db, "appData", key));
                if (docSnap.exists()) {
                    const items = docSnap.data().items;
                    originalSave.call(this, key, items); // save to localStorage silently
                    hasUpdates = true;
                }
            } catch (e) {
                console.error(`Erro ao carregar chave ${key} do Firebase:`, e);
            }
        }
        
        // Dispara evento para a UI saber que os dados foram atualizados da nuvem
        if (hasUpdates) {
            window.dispatchEvent(new Event('firebase-synced'));
        }
    };
}
