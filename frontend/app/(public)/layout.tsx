import type { ReactNode } from "react";

import { PublicLayoutClient } from "../../components/public/PublicLayoutClient";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicLayoutClient>{children}</PublicLayoutClient>;
}
