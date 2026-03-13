import { Package, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import type { ProfessionalProfile } from "@/types/professional";

type GalleryProductsSectionProps = {
  professional: ProfessionalProfile;
};

export function GalleryProductsSection({ professional }: GalleryProductsSectionProps) {
  const sectionAnchorClassName = "scroll-mt-20 sm:scroll-mt-32";

  return (
    <>
      <div id="gallery" className={sectionAnchorClassName}>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-6">Gallery & Feed</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3">
            {professional.gallery.map((image, index) => (
              <div key={`${image}-${index}`} className="group aspect-square cursor-pointer overflow-hidden rounded-lg">
                <ImageWithFallback
                  src={image}
                  alt={`Gallery ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div id="products" className={sectionAnchorClassName}>
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="mb-1">Featured Products</h2>
              <p className="text-sm text-muted-foreground">
                Recommended products curated by {professional.name.split(" ")[0]}
              </p>
            </div>
            <ShoppingBag className="text-emerald-600" size={32} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {professional.featuredProducts.map((product) => (
              <Card key={product.id} className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg">
                <div className="aspect-square overflow-hidden">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="p-4">
                  <h3 className="mb-2">{product.name}</h3>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xl font-semibold text-emerald-600">₹ {product.price}</span>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
            <p className="text-sm text-muted-foreground">
              <Package size={16} className="inline mr-2" />
              These products are personally recommended by this professional. Wolistic may earn a
              small commission from purchases made through these links at no extra cost to you.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
