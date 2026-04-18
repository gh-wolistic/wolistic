import { Award, Check, Globe, GraduationCap, Plus, Target, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProfessionalApproachInput,
  ProfessionalCertificationInput,
  ProfessionalEditorPayload,
  ProfessionalExpertiseAreaInput,
} from "@/types/professional-editor";
import { LanguageMultiSelect } from "@/components/dashboard/profile/LanguageMultiSelect";

type ProfilePracticeSectionProps = {
  value: ProfessionalEditorPayload;
  onFieldChange: (field: keyof ProfessionalEditorPayload, nextValue: string | number) => void;
  onLanguagesChange: (next: string[]) => void;
  onSessionTypesChange: (next: string[]) => void;
  onSubcategoriesChange: (next: string[]) => void;
  onEducationChange: (next: string[]) => void;
  onApproachesChange: (next: ProfessionalApproachInput[]) => void;
  onExpertiseAreasChange: (next: ProfessionalExpertiseAreaInput[]) => void;
  onCertificationsChange: (next: ProfessionalCertificationInput[]) => void;
};

const SESSION_TYPES: { value: string; label: string; clientLabel: string }[] = [
  { value: "online",  label: "Online (Video / Phone)",  clientLabel: "clients see: Video Call" },
  { value: "offline", label: "In-person (Gym / Studio)", clientLabel: "clients see: In-person" },
  { value: "hybrid",  label: "Hybrid (Online + In-person)", clientLabel: "clients see: Hybrid" },
];

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

const MAX_ITEMS = 5;

export function ProfilePracticeSection({
  value,
  onFieldChange,
  onLanguagesChange,
  onSessionTypesChange,
  onSubcategoriesChange,
  onEducationChange,
  onApproachesChange,
  onExpertiseAreasChange,
  onCertificationsChange,
}: ProfilePracticeSectionProps) {
  const [subcategoryInput, setSubcategoryInput] = useState("");

  const addSubcategory = () => {
    const trimmed = subcategoryInput.trim();
    if (trimmed && !value.subcategories.includes(trimmed) && value.subcategories.length < MAX_ITEMS) {
      onSubcategoriesChange([...value.subcategories, trimmed]);
      setSubcategoryInput("");
    }
  };

  const removeSubcategory = (subcat: string) => {
    onSubcategoriesChange(value.subcategories.filter((s) => s !== subcat));
  };

  const handleSubcategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubcategory();
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
          <Target className="h-5 w-5 text-emerald-400" /> Specialization & Subcategories
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="editor-specialization" className="mb-2 block text-sm text-zinc-300">
              Specialization *
            </Label>
            <Input
              id="editor-specialization"
              className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
              value={value.specialization}
              onChange={(event) => onFieldChange("specialization", event.target.value)}
              placeholder="Certified Wellness Coach"
            />
          </div>
          <div>
            <Label htmlFor="editor-subcategories" className="mb-2 block text-sm text-zinc-300">
              Subcategories {value.subcategories.length >= MAX_ITEMS && <span className="text-amber-400">(Max {MAX_ITEMS} reached)</span>}
            </Label>
            <p className="mb-3 text-xs text-zinc-500">
              Add custom subcategories that describe your practice areas. Maximum {MAX_ITEMS} items.
            </p>
            <div className="flex gap-2 mb-3">
              <Input
                id="editor-subcategories"
                type="text"
                value={subcategoryInput}
                onChange={(e) => setSubcategoryInput(e.target.value)}
                onKeyDown={handleSubcategoryKeyDown}
                placeholder="e.g., Prenatal Yoga, HIIT Training"
                disabled={value.subcategories.length >= MAX_ITEMS}
                className="h-12 flex-1 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button
                type="button"
                onClick={addSubcategory}
                disabled={!subcategoryInput.trim() || value.subcategories.includes(subcategoryInput.trim()) || value.subcategories.length >= MAX_ITEMS}
                className="shrink-0 h-12 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add
              </Button>
            </div>
            {value.subcategories.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">
                  Your subcategories ({value.subcategories.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {value.subcategories.map((subcat) => (
                    <Badge
                      key={subcat}
                      variant="outline"
                      className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 pl-3 pr-2 py-1"
                    >
                      {subcat}
                      <button
                        type="button"
                        onClick={() => removeSubcategory(subcat)}
                        className="ml-1 rounded-sm hover:bg-emerald-500/20 focus:outline-hidden"
                        aria-label={`Remove ${subcat}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
          <Globe className="h-5 w-5 text-emerald-400" /> Languages & Consultation Mode
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="editor-languages" className="mb-2 block text-sm text-zinc-300">
              Languages {value.languages.length >= MAX_ITEMS && <span className="text-amber-400">(Max {MAX_ITEMS})</span>}
            </Label>
            <p className="mb-3 text-xs text-zinc-500">
              Select the languages you speak with clients. Maximum {MAX_ITEMS}.
            </p>
            <LanguageMultiSelect
              value={value.languages}
              onChange={onLanguagesChange}
              placeholder="Select languages..."
              maxItems={MAX_ITEMS}
            />
          </div>
          <div>
            <Label className="mb-2 block text-sm text-zinc-300">Consultation Mode</Label>
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              {SESSION_TYPES.map((type) => {
                const checked = value.session_types.includes(type.value);
                return (
                  <label key={type.value} className="flex cursor-pointer items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
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
                          onSessionTypesChange([...value.session_types, type.value]);
                        } else {
                          onSessionTypesChange(value.session_types.filter((item) => item !== type.value));
                        }
                      }}
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-200">{type.label}</span>
                      <span className="text-xs text-zinc-500">{type.clientLabel}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
          <GraduationCap className="h-5 w-5 text-emerald-400" /> Education {value.education.length >= MAX_ITEMS && <span className="text-sm text-amber-400">(Max {MAX_ITEMS})</span>}
        </h3>
        <div>
          <Label htmlFor="editor-education" className="mb-2 block text-sm text-zinc-300">
            Education (one per line, max {MAX_ITEMS})
          </Label>
          <ListTextarea
            id="editor-education"
            rows={4}
            placeholder="MSc Psychology, University of Delhi&#10;Yoga Alliance 200-hr RYT"
            canonical={value.education}
            onChange={(lines) => onEducationChange(lines.slice(0, MAX_ITEMS))}
          />
          {value.education.length >= MAX_ITEMS && (
            <p className="mt-2 text-xs text-amber-400">Maximum {MAX_ITEMS} education entries reached.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Target className="h-5 w-5 text-emerald-400" /> Approaches ({value.approaches.length}/{MAX_ITEMS})
          </h3>
          <Button
            type="button"
            className="h-11 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 px-5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onApproachesChange([...value.approaches, { title: "", description: "" }])}
            disabled={value.approaches.length >= MAX_ITEMS}
          >
            <Plus className="h-4 w-4" /> Add Approach
          </Button>
        </div>

        {value.approaches.length >= MAX_ITEMS && (
          <p className="mb-4 text-xs text-amber-400">Maximum {MAX_ITEMS} approaches reached.</p>
        )}

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
            <Award className="h-5 w-5 text-emerald-400" /> Expertise Areas ({value.expertise_areas.length}/{MAX_ITEMS})
          </h3>
          <Button
            type="button"
            className="h-11 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 px-5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onExpertiseAreasChange([...value.expertise_areas, { title: "", description: "" }])}
            disabled={value.expertise_areas.length >= MAX_ITEMS}
          >
            <Plus className="h-4 w-4" /> Add Expertise
          </Button>
        </div>

        {value.expertise_areas.length >= MAX_ITEMS && (
          <p className="mb-4 text-xs text-amber-400">Maximum {MAX_ITEMS} expertise areas reached.</p>
        )}

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
            <Award className="h-5 w-5 text-emerald-400" /> Certificates ({value.certifications.length}/{MAX_ITEMS})
          </h3>
          <Button
            type="button"
            className="h-11 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 px-5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onCertificationsChange([...value.certifications, { name: "", issuer: "", issued_year: undefined }])}
            disabled={value.certifications.length >= MAX_ITEMS}
          >
            <Plus className="h-4 w-4" /> Add Certificate
          </Button>
        </div>

        {value.certifications.length >= MAX_ITEMS && (
          <p className="mb-4 text-xs text-amber-400">Maximum {MAX_ITEMS} certificates reached.</p>
        )}

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
