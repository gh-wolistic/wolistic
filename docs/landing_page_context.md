we will move the next important section
#IMPORTANT keep the UI as is shared below , only logic will be updated 


import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import type { Product } from "@/types/product";

type ProductsSectionProps = {
  products: Product[];
  isLoading: boolean;
  resultsHref: string;
};

export function ProductsSection({ products, isLoading, resultsHref }: ProductsSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
        <ShoppingBag size={20} />
        <h2 className="text-xl lg:text-2xl">Products we recommend</h2>
      </div>

      {isLoading ? (
        <p className="mb-4 text-sm text-muted-foreground">Loading matching products...</p>
      ) : products.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">No matching products found yet for this query.</p>
      ) : (
        <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-xl border border-border overflow-hidden bg-background">
              <div className="aspect-4/3">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">₹{product.price}</p>
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
