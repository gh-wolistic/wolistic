"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import AuthModal from "@/components/auth/AuthModal";
import AuthSidebar from "@/components/auth/AuthSidebar";

type AuthSidebarOptions = {
  onAuthenticated?: () => void;
  redirectNextPath?: string | null;
  defaultMode?: "login" | "signup";
  title?: string;
  description?: string;
};

type AuthModalContextValue = {
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openAuthSidebar: (options?: AuthSidebarOptions) => void;
  closeAuthSidebar: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthSidebarOpen, setIsAuthSidebarOpen] = useState(false);
  const [sidebarOptions, setSidebarOptions] = useState<AuthSidebarOptions>({});

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openAuthSidebar = useCallback((options?: AuthSidebarOptions) => {
    setSidebarOptions(options ?? {});
    setIsAuthSidebarOpen(true);
  }, []);

  const closeAuthSidebar = useCallback(() => {
    setIsAuthSidebarOpen(false);
    setSidebarOptions({});
  }, []);

  const value = useMemo<AuthModalContextValue>(
    () => ({
      openAuthModal,
      closeAuthModal,
      openAuthSidebar,
      closeAuthSidebar,
    }),
    [closeAuthModal, closeAuthSidebar, openAuthModal, openAuthSidebar]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
      <AuthSidebar
        isOpen={isAuthSidebarOpen}
        onClose={closeAuthSidebar}
        onAuthenticated={sidebarOptions.onAuthenticated}
        redirectNextPath={sidebarOptions.redirectNextPath}
        defaultMode={sidebarOptions.defaultMode}
        title={sidebarOptions.title}
        description={sidebarOptions.description}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }

  return context;
}
