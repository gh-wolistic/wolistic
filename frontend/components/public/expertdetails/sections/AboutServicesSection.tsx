import { Award, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getProfessionalAbout, getProfessionalShortBio } from "@/lib/professionalBio";
import type { ProfessionalCertification, ProfessionalProfile } from "@/types/professional";
import { SidebarSection } from "./SidebarSection";
import { ServicesBookingSection } from "./ServicesBookingSection";

type AboutServicesSectionProps = {
  professional: ProfessionalProfile;
  bookingStartSignal: number;
};

export function AboutServicesSection({ professional, bookingStartSignal }: AboutServicesSectionProps) {
  const shortBio = getProfessionalShortBio(professional, 220);
  const about = getProfessionalAbout(professional);
  const certifications = professional.certifications
    .map((certification): ProfessionalCertification => {
      if (typeof certification === "string") {
        return { name: certification };
      }

      return certification;
    })
    .filter((certification) => certification.name.trim().length > 0);
  const hasEducation = professional.education.length > 0;
  const hasCertifications = certifications.length > 0;

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
          <div className="space-y-6">
            {hasEducation && (
              <div className="space-y-3">
                {professional.education.map((education, index) => (
                  <div key={`${education}-${index}`} className="flex items-start gap-3">
                    <Award size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="text-muted-foreground">{education}</span>
                  </div>
                ))}
              </div>
            )}

            {hasCertifications && (
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full min-w-140 text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Certification</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Issuer</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Year</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certifications.map((certification, index) => (
                      <tr
                        key={`${certification.name}-${certification.issuer ?? "na"}-${certification.issuedYear ?? index}`}
                        className="border-t border-border/50"
                      >
                        <td className="px-4 py-3 text-foreground">{certification.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {certification.issuer?.trim() || "Not specified"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {certification.issuedYear ?? "Not specified"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="shrink-0">
                            Certified
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!hasEducation && !hasCertifications && (
              <p className="text-muted-foreground">No education or certifications available.</p>
            )}
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
