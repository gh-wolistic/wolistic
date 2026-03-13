const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type SearchParseResponse = {
  normalized_query: string;
  keywords: string[];
  tokens: string[];
  entities: Record<string, string[]>;
  category_hint: string | null;
  session_type_hint: string | null;
  min_rating_hint: number | null;
  min_hourly_rate_hint: number | null;
  max_hourly_rate_hint: number | null;
  timeframe_hint: string | null;
  location_hint: string | null;
  expanded_keywords: string[];
  is_multi_category: boolean;
};

export async function parseSearchQuery(query: string): Promise<SearchParseResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/search/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to parse search query (${response.status})`);
  }

  return (await response.json()) as SearchParseResponse;
}
