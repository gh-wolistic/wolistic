import { CheckCircle2, Globe, Instagram, Linkedin, Youtube, Twitter } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { inferMembershipLabel } from "@/lib/professionalSignals";
import type { ProfessionalProfile, SocialLinks } from "@/types/professional";

type SidebarSectionProps = {
  professional: ProfessionalProfile;
};

function formatResponseTime(hours: number): string {
  if (hours <= 1) return "Within 1 hour";
  if (hours < 24) return `Within ${hours} hours`;
  if (hours === 24) return "Within 24 hours";
  const days = Math.round(hours / 24);
  return `Within ${days} day${days > 1 ? "s" : ""}`;
}

function formatCancellation(hours: number): string {
  if (hours === 0) return "No notice required";
  if (hours < 24) return `${hours} hours notice`;
  if (hours === 24) return "24 hours notice";
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} notice`;
}

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  website: Globe,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  twitter: Twitter,
};

function SocialLinkRow({ platform, handle }: { platform: string; handle: string }) {
  const Icon = SOCIAL_ICONS[platform] ?? Globe;
  const href = buildSocialHref(platform, handle);
  
  // Platform-specific colors
  const iconColorClass = {
    instagram: "text-pink-500",
    twitter: "text-sky-500",
    linkedin: "text-blue-600",
    youtube: "text-red-600",
    website: "text-emerald-600",
  }[platform] || "text-zinc-600";
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-all hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
    >
      <Icon size={18} className={`shrink-0 ${iconColorClass} transition-transform group-hover:scale-110`} />
      <span className="truncate text-foreground/80 group-hover:text-foreground">{handle}</span>
    </a>
  );
}

function buildSocialHref(platform: string, handle: string): string {
  if (platform === "website") return handle.startsWith("http") ? handle : `https://${handle}`;
  if (platform === "instagram") {
    const u = handle.replace(/^@/, "");
    return `https://instagram.com/${u}`;
  }
  if (platform === "twitter") {
    const u = handle.replace(/^@/, "");
    return `https://x.com/${u}`;
  }
  if (platform === "tiktok") {
    const u = handle.replace(/^@/, "");
    return `https://tiktok.com/@${u}`;
  }
  return handle.startsWith("http") ? handle : `https://${handle}`;
}

export function SidebarSection({ professional }: SidebarSectionProps) {
  const membershipLabel = inferMembershipLabel(professional);
  const socialLinks = (professional.socialLinks ?? {}) as SocialLinks;
  const socialEntries = Object.entries(socialLinks).filter(([, v]) => Boolean(v)) as [string, string][];

  const responseTimeHours = professional.responseTimeHours ?? 24;
  const cancellationHours = professional.cancellationHours ?? 24;

  return (
    <div className="space-y-4 lg:col-span-1 lg:block lg:space-y-6">
      <Card className="p-5 sm:p-6">
        <h3 className="mb-4">Experience</h3>
        <p className="text-2xl text-emerald-600 font-semibold">{professional.experience}</p>
        <p className="text-sm text-muted-foreground mt-1">in professional practice</p>
      </Card>

      {socialEntries.length > 0 && (
        <Card className="border-zinc-200 p-5 sm:p-6 dark:border-zinc-700">
          <h3 className="mb-1">Connect</h3>
          <p className="mb-4 text-sm text-muted-foreground">Follow and stay connected</p>
          <div className="space-y-1">
            {socialEntries.map(([platform, handle]) => (
              <SocialLinkRow key={platform} platform={platform} handle={handle} />
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5 sm:p-6">
        <h3 className="mb-4">Quick Facts</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Response Time</p>
            <p className="font-medium">{formatResponseTime(responseTimeHours)}</p>
          </div>
          {professional.sessionTypes && professional.sessionTypes.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Session Types</p>
                <p className="font-medium">{professional.sessionTypes.join(", ")}</p>
              </div>
            </>
          )}
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-1">Cancellation Policy</p>
            <p className="font-medium">{formatCancellation(cancellationHours)}</p>
          </div>
          {professional.languages && professional.languages.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Languages</p>
                <p className="font-medium">{professional.languages.join(", ")}</p>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50 p-5 sm:col-span-2 sm:p-6 dark:border-emerald-500/30 dark:bg-emerald-500/10 lg:col-span-1">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
          <div>
            <h4 className="mb-2">Credentials</h4>
            <div className="flex flex-wrap gap-2">
              {professional.certifications.length > 0 && (
                <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">Certified</Badge>
              )}
              {membershipLabel && <Badge variant="outline">{membershipLabel}</Badge>}
              {professional.certifications.length === 0 && !membershipLabel && (
                <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">Verified</Badge>
              )}
            </div>
            {professional.certifications.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {professional.certifications.length} certification{professional.certifications.length > 1 ? "s" : ""} on file
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
