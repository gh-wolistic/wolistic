import { Award, CheckCircle2, Users, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProfessionalAbout, getProfessionalShortBio } from "@/lib/professionalBio";
import { getProfessionalSessions, type ProfessionalSession } from "@/lib/api/sessions";
import type { ProfessionalProfile } from "@/types/professional";
import { SessionCard } from "@/components/sessions/SessionCard";
import { SessionEnrollmentModal } from "@/components/sessions/SessionEnrollmentModal";
import { SidebarSection } from "./SidebarSection";
import { ServicesBookingSection } from "./ServicesBookingSection";
import { getVerifiedCredentials, type VerifiedCredentialsResponse } from "@/lib/public-credentials-api";

type AboutServicesSectionProps = {
  professional: ProfessionalProfile;
  bookingStartSignal: number;
};

const INITIAL_SESSIONS_TO_SHOW = 2;

export function AboutServicesSection({ professional, bookingStartSignal }: AboutServicesSectionProps) {
  const sectionAnchorClassName = "scroll-mt-20 sm:scroll-mt-32";
  const shortBio = getProfessionalShortBio(professional, 220);
  const about = getProfessionalAbout(professional);
  const [sessions, setSessions] = useState<ProfessionalSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ProfessionalSession | null>(null);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [verifiedCredentials, setVerifiedCredentials] = useState<VerifiedCredentialsResponse | null>(null);

  // Fetch verified credentials
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const credentials = await getVerifiedCredentials(professional.username);
        console.log('[AboutServicesSection] Fetched verified credentials:', credentials);
        setVerifiedCredentials(credentials);
      } catch (error) {
        console.error("Failed to fetch verified credentials:", error);
      }
    };
    void fetchCredentials();
  }, [professional.username]);

  // Only show verified credentials (no legacy fallback)
  const displayEducation = verifiedCredentials?.education.map(e => e.name) || [];
  const displayCertificates = verifiedCredentials?.certificates || [];
  const displayLicenses = verifiedCredentials?.licenses || [];

  const hasEducation = displayEducation.length > 0;
  const hasCertifications = displayCertificates.length > 0;
  const hasLicenses = displayLicenses.length > 0;

  // Prefer structured approaches[], fall back to legacy approach string
  const hasStructuredApproaches = professional.approaches && professional.approaches.length > 0;
  const hasLegacyApproach = !hasStructuredApproaches && Boolean(professional.approach);

  // Prefer structured expertiseAreas[], fall back to legacy specializations[]
  const hasStructuredExpertise = professional.expertiseAreas && professional.expertiseAreas.length > 0;
  const legacySpecializations = !hasStructuredExpertise ? (professional.specializations ?? []) : [];

  // Progressive disclosure: show identity section if ≥2 of 3 fields are filled
  const identityFieldCount = [
    professional.pronouns,
    professional.whoIWorkWith,
    professional.clientGoals && professional.clientGoals.length > 0,
  ].filter(Boolean).length;
  // Fetch professional's sessions
  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoadingSessions(true);
        const data = await getProfessionalSessions(professional.username);
        setSessions(data);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    }

    void fetchSessions();
  }, [professional.username]);

  const showIdentitySection = identityFieldCount >= 2;

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

      {showIdentitySection && (
        <div id="who-i-help" className={sectionAnchorClassName}>
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-emerald-600" />
              <h2>Who I Help</h2>
            </div>
            <div className="space-y-4">
              {professional.whoIWorkWith && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Ideal Clients</p>
                  <p className="break-words text-sm leading-relaxed text-muted-foreground">
                    {professional.whoIWorkWith}
                  </p>
                </div>
              )}
              {professional.clientGoals && professional.clientGoals.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Client Goals I Support</p>
                  <div className="flex flex-wrap gap-2">
                    {professional.clientGoals.map((goal) => (
                      <Badge
                        key={goal}
                        variant="outline"
                        className="border-emerald-600/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {(hasStructuredApproaches || hasLegacyApproach) && (
        <div id="approach" className={sectionAnchorClassName}>
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4">My Approach</h2>
            {hasStructuredApproaches ? (
              <div className="space-y-4">
                {professional.approaches?.map((approach, idx) => (
                  <div
                    key={`${approach.title}-${idx}`}
                    className="rounded-xl border border-border/60 bg-muted/10 p-4"
                  >
                    <p className="font-semibold text-foreground">{approach.title}</p>
                    {approach.description && (
                      <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
                        {approach.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="break-words text-sm leading-relaxed text-muted-foreground sm:text-base">
                {professional.approach}
              </p>
            )}
          </Card>
        </div>
      )}

      <div id="expertise" className={sectionAnchorClassName}>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4">Areas of Expertise</h2>
          {hasStructuredExpertise ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {professional.expertiseAreas?.map((area, idx) => (
                <div key={`${area.title}-${idx}`} className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/10 p-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{area.title}</p>
                    {area.description && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{area.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {legacySpecializations.map((specialization) => (
                <div key={specialization} className="flex items-start gap-2">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="break-words text-sm sm:text-base">{specialization}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div id="education" className={sectionAnchorClassName}>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4">Education & Certifications</h2>
          <div className="space-y-6">
            {hasEducation && (
              <div className="space-y-3">
                {displayEducation.map((education, index) => (
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
                  {displayCertificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="rounded-xl border border-border/60 bg-muted/10 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="break-words text-sm font-medium text-foreground">{cert.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {cert.issuer}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          Verified
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto rounded-lg border border-border/60 sm:block">
                  <table className="w-full min-w-[34rem] text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Certification</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Issuer</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayCertificates.map((cert) => (
                        <tr
                          key={cert.id}
                          className="border-t border-border/50"
                        >
                          <td className="px-4 py-3 text-foreground">{cert.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{cert.issuer}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Verified
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {hasLicenses && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  Professional Licenses
                </h3>
                <div className="space-y-3 sm:hidden">
                  {displayLicenses.map((license) => (
                    <div
                      key={license.id}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="break-words text-sm font-medium text-foreground">{license.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {license.issuer}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          Verified
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto rounded-lg border border-border/60 sm:block">
                  <table className="w-full min-w-[34rem] text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-foreground">License</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Issuer</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayLicenses.map((license) => (
                        <tr
                          key={license.id}
                          className="border-t border-border/50"
                        >
                          <td className="px-4 py-3 text-foreground">{license.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{license.issuer}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Verified
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!hasEducation && !hasCertifications && !hasLicenses && (
              <p className="text-muted-foreground">
                This professional hasn't added verified credentials yet.
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="lg:hidden">
        <SidebarSection professional={professional} />
      </div>

      <ServicesBookingSection professional={professional} bookingStartSignal={bookingStartSignal} />

      {/* Sessions Section */}
      <div id="sessions" className={sectionAnchorClassName}>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4">Upcoming Sessions</h2>
          {loadingSessions ? (
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming sessions available.</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4">
                {(showAllSessions ? sessions : sessions.slice(0, INITIAL_SESSIONS_TO_SHOW)).map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    variant="light"
                    onBookClick={() => {
                      setSelectedSession(session);
                      setEnrollmentModalOpen(true);
                    }}
                  />
                ))}
              </div>
              {sessions.length > INITIAL_SESSIONS_TO_SHOW && !showAllSessions && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setShowAllSessions(true)}
                  >
                    Load More ({sessions.length - INITIAL_SESSIONS_TO_SHOW} more session{sessions.length - INITIAL_SESSIONS_TO_SHOW !== 1 ? "s" : ""})
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Session Enrollment Modal */}
      <SessionEnrollmentModal
        session={selectedSession}
        isOpen={enrollmentModalOpen}
        onClose={() => {
          setEnrollmentModalOpen(false);
          setSelectedSession(null);
        }}
        onSuccess={(enrollmentId) => {
          console.log("Successfully enrolled:", enrollmentId);
          // Refresh sessions list after enrollment
          getProfessionalSessions(professional.username)
            .then(setSessions)
            .catch(console.error);
        }}
      />
    </>
  );
}
