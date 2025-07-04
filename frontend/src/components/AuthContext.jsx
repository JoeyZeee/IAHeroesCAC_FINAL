import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useLocation } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [banned, setBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};
        setUserRole(data.role || "");
        setBanned(!!data.banned);
      } else {
        setUserRole("");
        setBanned(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Block banned users from all pages except login
  if (!loading && banned && !location.pathname.startsWith("/login")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-red-600 text-2xl font-bold">
        You are banned from accessing this site.
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userRole, loading, banned }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 