import {
  ResultsPage,
  resolveResultsScope,
  type ResultsScope,
} from "@/components/public/results/ResultsPage";
import { WolisticResultsPage } from "@/components/public/wolistic/WolisticResultsPage";

type ResultsRouteProps = {
  searchParams?: Promise<{
    q?: string;
    scope?: string;
  }>;
};

export default async function ResultsRoute({ searchParams }: ResultsRouteProps) {
  const params = searchParams ? await searchParams : undefined;
  const rawScope = params?.scope?.trim().toLowerCase() ?? "";
  const query = params?.q?.trim() ?? "";

  if (rawScope === "wolistic") {
    return <WolisticResultsPage query={query} />;
  }

  const scope = resolveResultsScope(rawScope);
  return <ResultsPage scope={scope satisfies ResultsScope} query={query} />;
}