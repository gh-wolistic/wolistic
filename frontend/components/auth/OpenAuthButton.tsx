"use client";

import type { ComponentProps, ReactNode } from "react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Button } from "@/components/ui/button";

type ButtonProps = ComponentProps<typeof Button>;

type OpenAuthButtonProps = Omit<ButtonProps, "onClick"> & {
  children: ReactNode;
};

export function OpenAuthButton({ children, ...props }: OpenAuthButtonProps) {
  const { openAuthModal } = useAuthModal();

  return (
    <Button {...props} onClick={openAuthModal}>
      {children}
    </Button>
  );
}
