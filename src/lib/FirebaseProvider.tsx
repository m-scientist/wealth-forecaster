import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, signOutUser } from "./firebase";

interface FirebaseAuthContextType {
  user: User | null;
  loadingAuth: boolean;
  login: () => Promise<User>;
  logout: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType>({
  user: null,
  loadingAuth: true,
  login: async () => { throw new Error("Auth not initialized"); },
  logout: async () => { throw new Error("Auth not initialized"); }
});

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    }, (error) => {
      console.error("onAuthStateChanged error:", error);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    return await signInWithGoogle();
  };

  const logout = async () => {
    await signOutUser();
  };

  return (
    <FirebaseAuthContext.Provider value={{ user, loadingAuth, login, logout }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(FirebaseAuthContext);
}
