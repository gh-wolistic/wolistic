"use client";

import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProfessionalProfile } from "@/types/professional";

type BookingPanelProps = {
  professional: ProfessionalProfile;
  onBookConsultation: () => void;
};
export function BookingPanel({ professional, onBookConsultation }: BookingPanelProps) {

  return (
    <div className="lg:col-span-1">
      <Card className="border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 p-4 sm:p-6 dark:border-emerald-500/30 dark:from-emerald-950/30 dark:to-teal-950/30">
        <div className="space-y-4">

          <div className="space-y-2">
            <h4>Session Types</h4>
            <div className="flex flex-wrap gap-2">
              {professional.sessionTypes.map((type) => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              className="w-full bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
              onClick={onBookConsultation}
            >
              Book Consultation
            </Button>
            <Button variant="outline" className="w-full">
              <MessageCircle size={18} className="mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
