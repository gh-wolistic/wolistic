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
  const sectionAnchorClassName = "scroll-mt-20 sm:scroll-mt-32";
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
      <div id="short-bio" className={sectionAnchorClassName}>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4">Short Bio</h2>
          <p className="break-words text-sm leading-relaxed text-muted-foreground sm:text-base">{shortBio}</p>
        </Card>
      </div>

      <div id="about" className={sectionAnchorClassName}>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4">About</h2>
          <p className="break-words text-sm leading-relaxed text-muted-foreground sm:text-base">{about}</p>
        </Card>
      </div>

      <div id="approach" className={sectionAnchorClassName}>
        <Card className="p-5 sm:p-6">
        <h2 className="mb-4">Approach</h2>
        <p className="break-words text-sm leading-relaxed text-muted-foreground sm:text-base">
          {professional.approach}
        </p>
      </Card>
      </div>

      <div id="expertise" className={sectionAnchorClassName}>
        <Card className="p-5 sm:p-6">
        <h2 className="mb-4">Areas of Expertise</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {professional.specializations.map((specialization) => (
            <div key={specialization} className="flex items-start gap-2">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <span className="break-words text-sm sm:text-base">{specialization}</span>
            </div>
          ))}
        </div>
      </Card>
      </div>

      <div id="education" className={sectionAnchorClassName}>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4">Education & Certifications</h2>
          <div className="space-y-6">
            {hasEducation && (
              <div className="space-y-3">
                {professional.education.map((education, index) => (
                  <div key={`${education}-${index}`} className="flex items-start gap-3">
                    <Award size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="break-words text-sm text-muted-foreground sm:text-base">{education}</span>
                  </div>
                ))}
              </div>
            )}

            {hasCertifications && (
              <div className="space-y-3">
                <div className="space-y-3 sm:hidden">
                  {certifications.map((certification, index) => (
                    <div
                      key={`${certification.name}-${certification.issuer ?? "na"}-${certification.issuedYear ?? index}`}
                      className="rounded-xl border border-border/60 bg-muted/10 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="break-words text-sm font-medium text-foreground">{certification.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {certification.issuer?.trim() || "Issuer not specified"}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          Certified
                        </Badge>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Issued {certification.issuedYear ?? "year not specified"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto rounded-lg border border-border/60 sm:block">
                  <table className="w-full min-w-[34rem] text-sm">
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
