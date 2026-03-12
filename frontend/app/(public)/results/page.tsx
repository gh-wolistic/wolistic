import {
  ResultsPage,
  resolveResultsScope,
  type ResultsScope,
} from "@/components/public/results/ResultsPage";

type ResultsRouteProps = {
  searchParams?: Promise<{
    q?: string;
    scope?: string;
  }>;
};

export default async function ResultsRoute({ searchParams }: ResultsRouteProps) {
  const params = searchParams ? await searchParams : undefined;
  const scope = resolveResultsScope(params?.scope);
  const query = params?.q?.trim() ?? "";

  return <ResultsPage scope={scope satisfies ResultsScope} query={query} />;
}