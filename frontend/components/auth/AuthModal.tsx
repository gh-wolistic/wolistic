"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthPanelContent } from "@/components/auth/AuthPanelContent";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md border-border bg-card shadow-2xl dark:shadow-black/40">
        <DialogHeader>
          <DialogTitle className="text-center">Welcome to Wolistic</DialogTitle>
        </DialogHeader>
        <AuthPanelContent onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
