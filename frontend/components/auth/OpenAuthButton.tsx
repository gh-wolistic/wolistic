"use client";

import type { ComponentProps, ReactNode } from "react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Button } from "@/components/ui/button";

type ButtonProps = ComponentProps<typeof Button>;

type OpenAuthButtonProps = Omit<ButtonProps, "onClick"> & {
  children: ReactNode;
};

export function OpenAuthButton({ children, ...props }: OpenAuthButtonProps) {
  const { openAuthSidebar } = useAuthModal();

  const handleOpen = () => {
    openAuthSidebar({
      title: "Sign in to continue",
      description: "Pick up right where you left off.",
    });
  };

  return (
    <Button {...props} onClick={handleOpen}>
      {children}
    </Button>
  );
}
