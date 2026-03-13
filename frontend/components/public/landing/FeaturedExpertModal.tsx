"use client";

import { Award, Calendar, Clock, IndianRupee, MapPin, MessageCircle, Star } from "lucide-react";

import { getProfessionalShortBio } from "@/lib/professionalBio";
import type { ProfessionalCertificationInput, ProfessionalProfile } from "@/types/professional";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";

type FeaturedExpertModalProps = {
  professional: ProfessionalProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFullProfile: (username: string) => void;
  onBookConsultation: (username: string) => void;
};

function certificationName(value: ProfessionalCertificationInput): string {
  if (typeof value === "string") {
    return value;
  }
  return value.name;
}

export function FeaturedExpertModal({
  professional,
  isOpen,
  onClose,
  onViewFullProfile,
  onBookConsultation,
}: FeaturedExpertModalProps) {
  if (!professional) {
    return null;
  }

  const shortBio = getProfessionalShortBio(professional);
  const hourlyRate = professional.services.find((service) => service.price > 0)?.price;
  const certifications = professional.certifications.map(certificationName).filter(Boolean);
  const location = professional.location?.trim() || "Location not specified";
  const category = professional.category?.trim() || "Wellness Expert";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border border-border bg-card shadow-2xl dark:shadow-black/40">
        <DialogHeader>
          <DialogTitle>{professional.name}</DialogTitle>
          <DialogDescription>
            {professional.specialization} - {category}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden shrink-0">
              <ImageWithFallback
                src={professional.image}
                alt={professional.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-2xl">{professional.name}</h2>
                  <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1 dark:bg-amber-500/15">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                    <span className="font-medium">{professional.rating}</span>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground">{professional.specialization}</p>
              </div>

              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                {category}
              </Badge>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Award size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{certifications.join(", ") || "Certified Professional"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-muted-foreground" />
                  <span>{location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2">Short Bio</h3>
              <p className="text-muted-foreground">{shortBio}</p>
            </div>

            {professional.experience && (
              <div>
                <h4 className="mb-2">Experience</h4>
                <p className="text-muted-foreground">{professional.experience}</p>
              </div>
            )}

            {professional.languages && professional.languages.length > 0 && (
              <div>
                <h4 className="mb-2">Languages</h4>
                <div className="flex gap-2 flex-wrap">
                  {professional.languages.map((lang) => (
                    <Badge key={lang} variant="outline">{lang}</Badge>
                  ))}
                </div>
              </div>
            )}

            {professional.availability && (
              <div className="bg-accent/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-emerald-600" />
                  <h4 className="text-sm">Availability</h4>
                </div>
                <p className="text-sm text-muted-foreground">{professional.availability}</p>
              </div>
            )}
          </div>

          <div className="hidden sm:flex sm:flex-row gap-3 pt-4 border-t">
            <Button
              className="flex-1 bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
              onClick={() => {
                onViewFullProfile(professional.username);
                onClose();
              }}
            >
              View Full Profile
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onBookConsultation(professional.username);
                onClose();
              }}
            >
              <Calendar size={16} className="mr-2" />
              Book Consultation
            </Button>
            <Button variant="outline" className="flex-1">
              <MessageCircle size={16} className="mr-2" />
              Message
            </Button>
          </div>

          <div className="sticky bottom-0 z-20 -mx-6 border-t border-border bg-card/95 p-3 backdrop-blur sm:hidden">
            <div className="grid w-full grid-cols-2 gap-2 px-3">
              <Button
                className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                onClick={() => {
                  onViewFullProfile(professional.username);
                  onClose();
                }}
              >
                View Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onBookConsultation(professional.username);
                  onClose();
                }}
              >
                <Calendar size={16} className="mr-2" />
                Book
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
