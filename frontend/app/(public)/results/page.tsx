import {
  ResultsPage,
  resolveResultsScope,
  type ResultsScope,
} from "@/components/public/results/ResultsPage";
import { WolisticResultsPage } from "@/components/public/wolistic/WolisticResultsPage";
import { wolisticSearch } from "@/components/public/data/wolisticApi";

type ResultsRouteProps = {
  searchParams?: Promise<{
    q?: string;
    scope?: string;
    page?: string;
  }>;
};

function parsePage(value?: string): number {
  if (!value) {
    return 1;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export default async function ResultsRoute({ searchParams }: ResultsRouteProps) {
  const params = searchParams ? await searchParams : undefined;
  const rawScope = params?.scope?.trim().toLowerCase() ?? "";
  const query = params?.q?.trim() ?? "";
  const currentPage = parsePage(params?.page);

  if (rawScope === "wolistic") {
    let initialData;
    try {
      initialData = await wolisticSearch(query, 6);
    } catch {
      initialData = { professionals: [], products: [], services: [], articles: [] };
    }
    return <WolisticResultsPage query={query} initialData={initialData} />;
  }

  const scope = resolveResultsScope(rawScope);
  return <ResultsPage scope={scope satisfies ResultsScope} query={query} currentPage={currentPage} />;
}