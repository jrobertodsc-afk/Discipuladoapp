import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Login handler
export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return { user, role: userData.role };
        } else {
            throw new Error("Perfil de usuário não encontrado no banco de dados.");
        }
    } catch (error) {
        console.error("Erro no login:", error);
        throw error;
    }
};

// Logout handler
export const logoutUser = async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Erro ao deslogar:", error);
    }
};

// Register new user (students typically via admin or a registration form)
export const registerUser = async (email, password, role, additionalData = {}) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save user role and data to Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: role,
            createdAt: new Date().toISOString(),
            ...additionalData
        });
        
        return user;
    } catch (error) {
        console.error("Erro no registro:", error);
        throw error;
    }
};

// Protect routes
export const checkAuth = (allowedRoles, redirectUrl = "index.html") => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (allowedRoles.includes(userData.role)) {
                            resolve({ user, userData });
                        } else {
                            window.location.href = redirectUrl;
                            reject("Acesso negado");
                        }
                    } else {
                        window.location.href = redirectUrl;
                        reject("Usuário não tem um perfil registrado");
                    }
                } catch (error) {
                    console.error("Erro ao verificar auth:", error);
                    window.location.href = redirectUrl;
                    reject(error);
                }
            } else {
                window.location.href = redirectUrl;
                reject("Usuário não está logado");
            }
            unsubscribe(); // we only want to check once per page load usually
        });
    });
};

export const getCurrentUser = () => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                resolve({ user, userData: userDoc.exists() ? userDoc.data() : null });
            } else {
                resolve(null);
            }
            unsubscribe();
        });
    });
};

// Expose to window for non-module scripts
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.registerUser = registerUser;
window.checkAuth = checkAuth;
window.getCurrentUser = getCurrentUser;

