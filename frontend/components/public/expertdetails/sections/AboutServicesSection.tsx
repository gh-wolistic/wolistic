import { Award, CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getProfessionalAbout, getProfessionalShortBio } from "@/lib/professionalBio";
import type { ProfessionalProfile } from "@/types/professional";
import { SidebarSection } from "./SidebarSection";
import { ServicesBookingSection } from "./ServicesBookingSection";

type AboutServicesSectionProps = {
  professional: ProfessionalProfile;
  bookingStartSignal: number;
};

export function AboutServicesSection({ professional, bookingStartSignal }: AboutServicesSectionProps) {
  const shortBio = getProfessionalShortBio(professional, 220);
  const about = getProfessionalAbout(professional);

  return (
    <>
      <div id="short-bio" className="scroll-mt-32">
        <Card className="p-6">
          <h2 className="mb-4">Short Bio</h2>
          <p className="text-muted-foreground leading-relaxed">{shortBio}</p>
        </Card>
      </div>

      <div id="about" className="scroll-mt-32">
        <Card className="p-6">
          <h2 className="mb-4">About</h2>
          <p className="text-muted-foreground leading-relaxed">{about}</p>
        </Card>
      </div>

      <div id="approach" className="scroll-mt-32">
        <Card className="p-6">
        <h2 className="mb-4">Approach</h2>
        <p className="text-muted-foreground leading-relaxed">
          {professional.approach}
        </p>
      </Card>
      </div>

      <div id="expertise" className="scroll-mt-32">
        <Card className="p-6">
        <h2 className="mb-4">Areas of Expertise</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {professional.specializations.map((specialization) => (
            <div key={specialization} className="flex items-start gap-2">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>{specialization}</span>
            </div>
          ))}
        </div>
      </Card>
      </div>

      <div id="education" className="scroll-mt-32">
        <Card className="p-6">
        <h2 className="mb-4">Education & Certifications</h2>
        <div className="space-y-3">
          {professional.education.map((education, index) => (
            <div key={`${education}-${index}`} className="flex items-start gap-3">
              <Award size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{education}</span>
            </div>
          ))}
        </div>
      </Card>
      </div>

      <div className="lg:hidden">
        <SidebarSection professional={professional} />
      </div>

      <ServicesBookingSection professional={professional} bookingStartSignal={bookingStartSignal} />
    </>
  );
}
