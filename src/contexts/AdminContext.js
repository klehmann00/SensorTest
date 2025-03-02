// AdminContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const AdminContext = createContext(null);

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AdminProvider mounted");
    const auth = getAuth();
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("Auth state changed in AdminContext:", user ? user.uid : "No user");
      
      if (user) {
        try {
          const db = getDatabase();
          // FIXED: Changed path to match AdminManager.js
          const adminRef = ref(db, `users/${user.uid}/isAdmin`);
          const snapshot = await get(adminRef);
          
          const isAdminValue = snapshot.exists() && snapshot.val() === true;
          console.log(`Admin check for ${user.uid}: ${isAdminValue}`);
          setIsAdmin(isAdminValue);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    isAdmin,
    loading,
    // FIXED: Updated function to use same path as above
    checkAdminStatus: async (userId) => {
      try {
        const db = getDatabase();
        const adminRef = ref(db, `users/${userId}/isAdmin`);
        const snapshot = await get(adminRef);
        return snapshot.exists() && snapshot.val() === true;
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    }
  };

  if (loading) {
    // Always provide the context, even during loading
    return (
      <AdminContext.Provider value={value}>
        {children}
      </AdminContext.Provider>
    );
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};