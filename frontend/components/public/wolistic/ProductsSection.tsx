import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/wolistic";

type ProductsSectionProps = {
  products: Product[];
  isLoading: boolean;
  resultsHref: string;
};

export function ProductsSection({ products, isLoading, resultsHref }: ProductsSectionProps) {
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
        <ShoppingBag size={20} />
        <h2 className="text-xl lg:text-2xl">Products we recommend</h2>
      </div>

      {isLoading ? (
        <p className="mb-4 text-sm text-muted-foreground">Loading matching products...</p>
      ) : (
        <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-xl border border-border bg-background">
              <div className="p-4">
                <p className="font-medium">{product.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sold by {product.brand?.trim() || product.websiteName?.trim() || "Partner brand"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">₹{product.price.toLocaleString("en-IN")}</p>
                {product.websiteUrl && (
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                    <a href={product.websiteUrl} target="_blank" rel="noreferrer">
                      Check on {product.websiteName?.trim() || product.brand?.trim() || "website"}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link href={resultsHref}>
        <Button variant="outline">View matching products</Button>
      </Link>
    </div>
  );
}
