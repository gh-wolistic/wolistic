import { Badge } from "@/components/ui/badge";

type RoleDashboardPageProps = {
  title: string;
  summary: string;
  roleLabel: string;
};

export function RoleDashboardPage({ title, summary, roleLabel }: RoleDashboardPageProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-emerald-600 text-white">{roleLabel}</Badge>
        <p className="text-xs uppercase tracking-wide text-zinc-500">Dashboard v1</p>
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-zinc-700">{summary}</p>
    </section>
  );
}
