import { CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { inferMembershipLabel } from "@/lib/professionalSignals";
import type { ProfessionalProfile } from "@/types/professional";

type SidebarSectionProps = {
  professional: ProfessionalProfile;
};

export function SidebarSection({ professional }: SidebarSectionProps) {
  const membershipLabel = inferMembershipLabel(professional);

  return (
    <div className="space-y-4 lg:col-span-1 lg:block lg:space-y-6">
      <Card className="p-5 sm:p-6">
        <h3 className="mb-4">Experience</h3>
        <p className="text-2xl text-emerald-600 font-semibold">{professional.experience}</p>
        <p className="text-sm text-muted-foreground mt-1">in professional practice</p>
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="mb-4">Quick Facts</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Response Time</p>
            <p className="font-medium">Within 24 hours</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-1">Session Duration</p>
            <p className="font-medium">50-60 minutes</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-1">Cancellation Policy</p>
            <p className="font-medium">24 hours notice</p>
          </div>
        </div>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50 p-5 sm:col-span-2 sm:p-6 dark:border-emerald-500/30 dark:bg-emerald-500/10 lg:col-span-1">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
          <div>
            <h4 className="mb-2">Credentials</h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">Certified</Badge>
              {membershipLabel && <Badge variant="outline">{membershipLabel}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Trust signals verified from profile and platform quality markers
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
