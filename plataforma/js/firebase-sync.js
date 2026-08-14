import { db } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Sincroniza o localStorage com o Firestore (Estratégia Local-First)
// Isso evita a necessidade de reescrever todo o código de interface que usa DB.getAll e DB.save de forma síncrona.

// Atualiza o ícone de nuvem na UI (se existir)
function setSyncStatus(status) {
    const icon = document.getElementById('firebase-sync-icon');
    if (!icon) return;
    if (status === 'syncing') {
        icon.textContent = '⏳';
        icon.title = 'Sincronizando com a nuvem...';
        icon.className = 'sync-icon syncing';
    } else if (status === 'ok') {
        icon.textContent = '☁️';
        icon.title = 'Dados sincronizados com Firebase';
        icon.className = 'sync-icon ok';
    } else if (status === 'error') {
        icon.textContent = '⚠️';
        icon.title = 'Erro na sincronização. Dados salvos localmente.';
        icon.className = 'sync-icon error';
    }
}

if (window.DB) {
    const originalSave = window.DB.save;

    // Monkey-patch the save function to push to Firebase
    window.DB.save = function(key, data) {
        // Save locally first for instant UI updates
        originalSave.call(this, key, data);

        // Push to Firebase async
        setSyncStatus('syncing');
        setDoc(doc(db, "appData", key), { items: data })
            .then(() => setSyncStatus('ok'))
            .catch(err => {
                console.error("Erro ao sincronizar com Firebase:", err);
                setSyncStatus('error');
            });
    };

    // Load data from Firebase on startup
    window.DB.syncFromFirebase = async function() {
        const updatedKeys = [];
        setSyncStatus('syncing');

        for (const key of Object.values(window.DB.KEYS)) {
            try {
                const docSnap = await getDoc(doc(db, "appData", key));
                if (docSnap.exists()) {
                    const items = docSnap.data().items;
                    originalSave.call(this, key, items); // save to localStorage silently
                    updatedKeys.push(key);
                }
            } catch (e) {
                console.error(`Erro ao carregar chave ${key} do Firebase:`, e);
            }
        }

        setSyncStatus(updatedKeys.length > 0 ? 'ok' : 'error');

        // Dispara evento com detalhe de quais chaves foram atualizadas
        window.dispatchEvent(new CustomEvent('firebase-synced', {
            detail: { keys: updatedKeys }
        }));
    };
}

