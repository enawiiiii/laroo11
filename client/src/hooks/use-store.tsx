import React, { createContext, useContext, useState, useEffect } from "react";

interface StoreContextType {
  currentEmployee: string;
  currentStore: "boutique" | "online" | "";
  setEmployee: (employee: string) => void;
  setStore: (store: "boutique" | "online") => void;
  isLoggedIn: boolean;
  logout: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentEmployee, setCurrentEmployee] = useState("");
  const [currentStore, setCurrentStore] = useState<"boutique" | "online" | "">("");

  useEffect(() => {
    const savedEmployee = localStorage.getItem("larosa_employee");
    const savedStore = localStorage.getItem("larosa_store");
    
    if (savedEmployee) setCurrentEmployee(savedEmployee);
    if (savedStore && (savedStore === "boutique" || savedStore === "online")) {
      setCurrentStore(savedStore);
    }
  }, []);

  const setEmployee = (employee: string) => {
    setCurrentEmployee(employee);
    localStorage.setItem("larosa_employee", employee);
  };

  const setStore = (store: "boutique" | "online") => {
    setCurrentStore(store);
    localStorage.setItem("larosa_store", store);
  };

  const logout = () => {
    setCurrentEmployee("");
    setCurrentStore("");
    localStorage.removeItem("larosa_employee");
    localStorage.removeItem("larosa_store");
  };

  const isLoggedIn = !!(currentEmployee && currentStore);

  const value = {
    currentEmployee,
    currentStore,
    setEmployee,
    setStore,
    isLoggedIn,
    logout,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}