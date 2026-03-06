import Image from "next/image";

import logoImage from "@/assets/logo_ver.png";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <div className="absolute inset-3 rounded-full border border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image src={logoImage} alt="Wolistic" className="h-10 w-10" />
          </div>
        </div>
        <div>
          <p className="text-lg font-medium text-foreground">Loading your experience</p>
          <p className="text-sm text-muted-foreground">Fetching the latest from Wolistic…</p>
        </div>
      </div>
    </div>
  );
}
