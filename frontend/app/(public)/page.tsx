import { getFeaturedProfessionals } from "@/components/public/data/professionalsApi";
import { getFeaturedProducts } from "@/components/public/data/productsApi";
import { getFeaturedWellnessCenters } from "@/components/public/data/wellnessCentersApi";
import type { ProfessionalProfile } from "@/types/professional";
import type { Product, WolisticService } from "@/types/wolistic";
import { LandingPageClient } from "./LandingPageClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    featuredProfessionalsResult,
    featuredProductsResult,
    featuredWellnessCentersResult,
  ] = await Promise.allSettled([
    getFeaturedProfessionals(8), // hard cap enforced in API + component
    getFeaturedProducts(8),
    getFeaturedWellnessCenters(8),
  ]);

  const featuredProfessionals: ProfessionalProfile[] =
    featuredProfessionalsResult.status === "fulfilled"
      ? featuredProfessionalsResult.value
      : [];
  const featuredProducts: Product[] =
    featuredProductsResult.status === "fulfilled"
      ? featuredProductsResult.value
      : [];
  const featuredWellnessCenters: WolisticService[] =
    featuredWellnessCentersResult.status === "fulfilled"
      ? featuredWellnessCentersResult.value
      : [];

  return (
    <LandingPageClient
      featuredProfessionals={featuredProfessionals}
      featuredProducts={featuredProducts}
      featuredWellnessCenters={featuredWellnessCenters}
    />
  );
}
