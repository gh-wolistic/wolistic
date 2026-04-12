import { Award, Check, Globe, GraduationCap, Plus, Target, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProfessionalApproachInput,
  ProfessionalCertificationInput,
  ProfessionalEditorPayload,
  ProfessionalExpertiseAreaInput,
} from "@/types/professional-editor";

type ProfilePracticeSectionProps = {
  value: ProfessionalEditorPayload;
  onLanguagesChange: (next: string[]) => void;
  onSessionTypesChange: (next: string[]) => void;
  onSubcategoriesChange: (next: string[]) => void;
  onEducationChange: (next: string[]) => void;
  onApproachesChange: (next: ProfessionalApproachInput[]) => void;
  onExpertiseAreasChange: (next: ProfessionalExpertiseAreaInput[]) => void;
  onCertificationsChange: (next: ProfessionalCertificationInput[]) => void;
};

const SESSION_TYPES = ["online", "offline", "hybrid"] as const;

function toLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * A textarea that maintains its own raw text state so typing/Enter works naturally.
 * It syncs FROM the parent array only when the canonical (trimmed) value changes —
 * e.g. after a save or an external update — but does not clobber the user's
 * in-progress trailing newline while they are actively typing.
 * It calls the parent onChange only on blur so we never strip an in-progress line.
 */
function ListTextarea({
  id,
  rows = 4,
  placeholder,
  canonical,
  onChange,
}: {
  id?: string;
  rows?: number;
  placeholder?: string;
  canonical: string[];
  onChange: (next: string[]) => void;
}) {
  const [text, setText] = useState(() => canonical.join("\n"));

  // Sync inward when the canonical array changes from outside (e.g. after save).
  const canonicalStr = canonical.join("\n");
  useEffect(() => {
    const currentLines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n");
    if (currentLines !== canonicalStr) {
      setText(canonicalStr);
    }
    // intentionally exclude `text` — we only want to react to external changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonicalStr]);

  return (
    <Textarea
      id={id}
      rows={rows}
      placeholder={placeholder}
      className="rounded-xl border-white/10 bg-white/5 text-white"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        // Update parent on every keystroke so Save always gets the latest lines
        onChange(toLines(e.target.value));
      }}
    />
  );
}

export function ProfilePracticeSection({
  value,
  onLanguagesChange,
  onSessionTypesChange,
  onSubcategoriesChange,
  onEducationChange,
  onApproachesChange,
  onExpertiseAreasChange,
  onCertificationsChange,
}: ProfilePracticeSectionProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
          <Globe className="h-5 w-5 text-emerald-400" /> Languages & Session Types
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="editor-languages" className="mb-2 block text-sm text-zinc-300">
              Languages (one per line)
            </Label>
            <ListTextarea
              id="editor-languages"
              rows={4}
              placeholder="English&#10;Hindi&#10;French"
              canonical={value.languages}
              onChange={onLanguagesChange}
            />
          </div>
          <div>
            <Label className="mb-2 block text-sm text-zinc-300">Session Types</Label>
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              {SESSION_TYPES.map((type) => {
                const checked = value.session_types.includes(type);
                return (
                  <label key={type} className="flex cursor-pointer items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        checked
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-white/30 bg-white/5"
                      }`}
                    >
                      {checked ? <Check className="h-3.5 w-3.5 text-white" /> : null}
                    </span>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          onSessionTypesChange([...value.session_types, type]);
                        } else {
                          onSessionTypesChange(value.session_types.filter((item) => item !== type));
                        }
                      }}
                    />
                    <span className="text-base font-medium capitalize text-zinc-300">{type}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
          <GraduationCap className="h-5 w-5 text-emerald-400" /> Subcategories & Education
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="editor-subcategories" className="mb-2 block text-sm text-zinc-300">
              Subcategories (one per line)
            </Label>
            <ListTextarea
              id="editor-subcategories"
              rows={4}
              placeholder="Yoga&#10;Meditation&#10;Breathwork"
              canonical={value.subcategories}
              onChange={onSubcategoriesChange}
            />
          </div>
          <div>
            <Label htmlFor="editor-education" className="mb-2 block text-sm text-zinc-300">
              Education (one per line)
            </Label>
            <ListTextarea
              id="editor-education"
              rows={4}
              placeholder="MSc Psychology, University of Delhi&#10;Yoga Alliance 200-hr RYT"
              canonical={value.education}
              onChange={onEducationChange}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Target className="h-5 w-5 text-emerald-400" /> Approaches
          </h3>
          <Button
            type="button"
            className="h-11 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 px-5 text-white"
            onClick={() => onApproachesChange([...value.approaches, { title: "", description: "" }])}
          >
            <Plus className="h-4 w-4" /> Add Approach
          </Button>
        </div>

        <div className="space-y-4">
          {value.approaches.map((approach, index) => (
            <div key={`approach-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-3">
                  <Input
                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                    placeholder="Approach title"
                    value={approach.title}
                    onChange={(event) => {
                      const next = [...value.approaches];
                      next[index] = { ...next[index], title: event.target.value };
                      onApproachesChange(next);
                    }}
                  />
                  <Textarea
                    className="rounded-xl border-white/10 bg-white/5 text-white"
                    rows={2}
                    placeholder="Approach description"
                    value={approach.description}
                    onChange={(event) => {
                      const next = [...value.approaches];
                      next[index] = { ...next[index], description: event.target.value };
                      onApproachesChange(next);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => onApproachesChange(value.approaches.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Award className="h-5 w-5 text-emerald-400" /> Expertise Areas
          </h3>
          <Button
            type="button"
            className="h-11 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 px-5 text-white"
            onClick={() => onExpertiseAreasChange([...value.expertise_areas, { title: "", description: "" }])}
          >
            <Plus className="h-4 w-4" /> Add Expertise
          </Button>
        </div>

        <div className="space-y-4">
          {value.expertise_areas.map((item, index) => (
            <div key={`expertise-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-3">
                  <Input
                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                    placeholder="Expertise title"
                    value={item.title}
                    onChange={(event) => {
                      const next = [...value.expertise_areas];
                      next[index] = { ...next[index], title: event.target.value };
                      onExpertiseAreasChange(next);
                    }}
                  />
                  <Textarea
                    className="rounded-xl border-white/10 bg-white/5 text-white"
                    rows={2}
                    placeholder="Expertise description"
                    value={item.description}
                    onChange={(event) => {
                      const next = [...value.expertise_areas];
                      next[index] = { ...next[index], description: event.target.value };
                      onExpertiseAreasChange(next);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => onExpertiseAreasChange(value.expertise_areas.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Award className="h-5 w-5 text-emerald-400" /> Certificates
          </h3>
          <Button
            type="button"
            className="h-11 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 px-5 text-white"
            onClick={() => onCertificationsChange([...value.certifications, { name: "", issuer: "", issued_year: undefined }])}
          >
            <Plus className="h-4 w-4" /> Add Certificate
          </Button>
        </div>

        <div className="space-y-4">
          {value.certifications.map((certification, index) => (
            <div key={`certificate-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                    placeholder="Certificate Name"
                    value={certification.name}
                    onChange={(event) => {
                      const next = [...value.certifications];
                      next[index] = { ...next[index], name: event.target.value };
                      onCertificationsChange(next);
                    }}
                  />
                  <Input
                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                    placeholder="Issuer"
                    value={certification.issuer}
                    onChange={(event) => {
                      const next = [...value.certifications];
                      next[index] = { ...next[index], issuer: event.target.value };
                      onCertificationsChange(next);
                    }}
                  />
                  <Input
                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                    placeholder="Year"
                    value={certification.issued_year ?? ""}
                    onChange={(event) => {
                      const raw = event.target.value.trim();
                      const next = [...value.certifications];
                      next[index] = {
                        ...next[index],
                        issued_year: raw ? Number(raw) : undefined,
                      };
                      onCertificationsChange(next);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => onCertificationsChange(value.certifications.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
