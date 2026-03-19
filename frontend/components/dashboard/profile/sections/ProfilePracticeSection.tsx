import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProfessionalEditorPayload } from "@/types/professional-editor";

type ProfilePracticeSectionProps = {
  value: ProfessionalEditorPayload;
  onStringListChange: (
    field: "education" | "languages" | "session_types" | "subcategories",
    nextValue: string,
  ) => void;
  onObjectListChange: (
    field: "approaches" | "expertise_areas" | "certifications" | "gallery",
    nextValue: string,
  ) => void;
};

function objectListToText(
  field: "approaches" | "expertise_areas" | "certifications" | "gallery",
  value: ProfessionalEditorPayload,
): string {
  if (field === "approaches" || field === "expertise_areas") {
    return value[field].map((item) => `${item.title}|${item.description}`).join("\n");
  }

  if (field === "certifications") {
    return value.certifications
      .map((item) => `${item.name}|${item.issuer}|${item.issued_year ?? ""}`)
      .join("\n");
  }

  return value.gallery.map((item) => `${item.image_url}|${item.caption}|${item.display_order}`).join("\n");
}

export function ProfilePracticeSection({ value, onStringListChange, onObjectListChange }: ProfilePracticeSectionProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-900">Practice Data</h2>
      <p className="mt-1 text-sm text-zinc-600">Each line creates one entry. Use the helper format shown in placeholders.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="editor-languages">Languages (one per line)</Label>
          <Textarea
            id="editor-languages"
            rows={4}
            value={value.languages.join("\n")}
            onChange={(event) => onStringListChange("languages", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-session-types">Session Types (one per line)</Label>
          <Textarea
            id="editor-session-types"
            rows={4}
            value={value.session_types.join("\n")}
            onChange={(event) => onStringListChange("session_types", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-subcategories">Subcategories (one per line)</Label>
          <Textarea
            id="editor-subcategories"
            rows={4}
            value={value.subcategories.join("\n")}
            onChange={(event) => onStringListChange("subcategories", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-education">Education (one per line)</Label>
          <Textarea
            id="editor-education"
            rows={4}
            value={value.education.join("\n")}
            onChange={(event) => onStringListChange("education", event.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="editor-approaches">Approaches (title|description)</Label>
          <Textarea
            id="editor-approaches"
            rows={4}
            placeholder="Holistic Assessment|I combine sleep, movement, and nutrition insights"
            value={objectListToText("approaches", value)}
            onChange={(event) => onObjectListChange("approaches", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-expertise">Expertise Areas (title|description)</Label>
          <Textarea
            id="editor-expertise"
            rows={4}
            placeholder="Weight Management|Sustainable plans tailored to lifestyle"
            value={objectListToText("expertise_areas", value)}
            onChange={(event) => onObjectListChange("expertise_areas", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-certs">Certifications (name|issuer|year)</Label>
          <Textarea
            id="editor-certs"
            rows={4}
            placeholder="Precision Nutrition Level 1|Precision Nutrition|2024"
            value={objectListToText("certifications", value)}
            onChange={(event) => onObjectListChange("certifications", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-gallery">Gallery (image_url|caption|display_order)</Label>
          <Textarea
            id="editor-gallery"
            rows={4}
            placeholder="https://.../image.jpg|Consultation setup|1"
            value={objectListToText("gallery", value)}
            onChange={(event) => onObjectListChange("gallery", event.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        Tip: keep line formats simple. Empty lines are ignored automatically.
      </div>
    </section>
  );
}
