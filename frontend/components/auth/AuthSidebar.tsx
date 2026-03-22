"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AuthPanelContent } from "@/components/auth/AuthPanelContent";

type AuthSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
  redirectNextPath?: string | null;
  defaultMode?: "login" | "signup";
  title?: string;
  description?: string;
};

export default function AuthSidebar({
  isOpen,
  onClose,
  onAuthenticated,
  redirectNextPath,
  defaultMode = "login",
  title = "Sign in to continue",
  description = "Your current progress is preserved.",
}: AuthSidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6">
          <AuthPanelContent
            onClose={onClose}
            onAuthenticated={onAuthenticated}
            redirectNextPath={redirectNextPath}
            defaultMode={defaultMode}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
