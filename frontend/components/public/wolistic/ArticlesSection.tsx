import React from "react";
import { BookOpenText } from "lucide-react";
import type { WolisticArticle } from "@/types/wolistic";

type ArticlesSectionProps = {
  suggestions: WolisticArticle[];
};

export function ArticlesSection({ suggestions }: ArticlesSectionProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
        <BookOpenText size={20} />
        <h2 className="text-xl lg:text-2xl">Articles related to your request</h2>
      </div>
      <div className="space-y-3">
        {suggestions.map((article) => (
          <div key={article.id} className="rounded-xl border border-border p-4 bg-background">
            <p className="font-medium">{article.title}</p>
            <p className="text-sm text-muted-foreground">{article.readTime}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
